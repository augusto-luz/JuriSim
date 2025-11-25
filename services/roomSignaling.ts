import { Participant, CourtRole } from '../types';

export type SignalingEvent = 
  | { type: 'JOIN', payload: Participant }
  | { type: 'UPDATE', payload: Partial<Participant> & { id: string } }
  | { type: 'AUDIO_LEVEL', payload: { id: string, level: number } }
  | { type: 'LEAVE', payload: { id: string } };

class RoomSignalingService {
  private channel: BroadcastChannel | null = null;
  private listeners: ((event: SignalingEvent) => void)[] = [];

  connect(roomId: string, user: Participant) {
    this.disconnect(); // Close existing if any
    
    const channelName = `jurisim-room-${roomId}`;
    console.log(`[Signaling] Connecting to ${channelName}`);
    
    this.channel = new BroadcastChannel(channelName);
    
    this.channel.onmessage = (msg) => {
      const event = msg.data as SignalingEvent;
      this.notifyListeners(event);
    };

    // Announce presence immediately
    this.broadcast({ type: 'JOIN', payload: user });

    // Window close handler to leave gracefully
    window.addEventListener('beforeunload', () => {
      this.broadcast({ type: 'LEAVE', payload: { id: user.id } });
    });
  }

  disconnect() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }

  subscribe(callback: (event: SignalingEvent) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(event: SignalingEvent) {
    this.listeners.forEach(l => l(event));
  }

  broadcast(event: SignalingEvent) {
    if (this.channel) {
      this.channel.postMessage(event);
    }
  }

  sendUpdate(participant: Participant) {
    this.broadcast({
      type: 'UPDATE',
      payload: {
        id: participant.id,
        isMuted: participant.isMuted,
        isVideoOff: participant.isVideoOff,
        isHandRaised: participant.isHandRaised,
        role: participant.role,
        name: participant.name,
        status: participant.status
      }
    });
  }

  sendAudioLevel(id: string, level: number) {
    // Optimization: broadcast audio level (throttle handled by caller usually, but lightweight here)
    this.broadcast({
      type: 'AUDIO_LEVEL',
      payload: { id, level }
    });
  }
}

export const roomSignaling = new RoomSignalingService();