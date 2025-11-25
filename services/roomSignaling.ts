import { Participant, CourtRole } from '../types';

export type SignalingEvent = 
  | { type: 'JOIN', payload: Participant }
  | { type: 'UPDATE', payload: Partial<Participant> & { id: string } }
  | { type: 'AUDIO_LEVEL', payload: { id: string, level: number } }
  | { type: 'LEAVE', payload: { id: string } }
  | { type: 'MUTE_FORCE', payload: { targetId?: string } } // targetId null means ALL
  | { type: 'HEARING_STATUS', payload: { status: 'waiting' | 'running' | 'ended', startTime?: number } };

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
    this.broadcast({
      type: 'AUDIO_LEVEL',
      payload: { id, level }
    });
  }

  sendHearingStatus(status: 'waiting' | 'running' | 'ended', startTime?: number) {
    this.broadcast({
      type: 'HEARING_STATUS',
      payload: { status, startTime }
    });
  }

  forceMuteAll() {
    this.broadcast({
      type: 'MUTE_FORCE',
      payload: {} // No targetId implies all except sender (handled in logic)
    });
  }
}

export const roomSignaling = new RoomSignalingService();