import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { Participant } from '../types';

export type SignalingEvent = 
  | { type: 'JOIN', payload: Participant }
  | { type: 'UPDATE', payload: Partial<Participant> & { id: string } }
  | { type: 'AUDIO_LEVEL', payload: { id: string, level: number } }
  | { type: 'LEAVE', payload: { id: string } }
  | { type: 'MUTE_FORCE', payload: { targetId?: string } }
  | { type: 'HEARING_STATUS', payload: { status: 'waiting' | 'running' | 'ended', startTime?: number } }
  | { type: 'SYNC_USERS', payload: Participant[] };

class RoomSignalingService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map(); // PeerID -> Connection
  private mediaConnections: Map<string, MediaConnection> = new Map();
  private listeners: ((event: SignalingEvent) => void)[] = [];
  
  private isHost: boolean = false;
  private roomId: string = '';
  private localStream: MediaStream | null = null;

  async connect(roomId: string, user: Participant, isHost: boolean, stream: MediaStream | null) {
    this.disconnect();
    
    this.roomId = roomId;
    this.isHost = isHost;
    this.localStream = stream;

    // Host takes a specific ID, Guests take random IDs
    const myPeerId = isHost ? `jurisim-room-${roomId}` : undefined;
    
    // Initialize Peer
    this.peer = new Peer(myPeerId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    this.peer.on('open', (id) => {
      console.log(`[PeerJS] Connected with ID: ${id}`);
      
      if (!isHost) {
        // Guest: Connect to Host immediately
        this.connectToHost(`jurisim-room-${roomId}`, user);
      }
    });

    this.peer.on('connection', (conn) => {
      this.handleDataConnection(conn);
    });

    this.peer.on('call', (call) => {
      this.handleIncomingCall(call);
    });

    this.peer.on('error', (err) => {
      console.error('[PeerJS Error]', err);
      if (err.type === 'unavailable-id' && isHost) {
        alert("Esta sala já está aberta por outro anfitrião. Entre como convidado.");
        window.location.reload();
      }
    });
  }

  private connectToHost(hostId: string, user: Participant) {
    if (!this.peer) return;
    
    const conn = this.peer.connect(hostId, { metadata: user });
    
    conn.on('open', () => {
      this.connections.set(hostId, conn);
      // Send JOIN immediately
      conn.send({ type: 'JOIN', payload: { ...user, id: this.peer?.id } }); // Use actual PeerID as UserID for simplicity in WebRTC
    });

    conn.on('data', (data: any) => {
      this.handleMessage(data);
    });
    
    conn.on('close', () => {
      alert("O Anfitrião encerrou a sala.");
      window.location.reload();
    });
  }

  private handleDataConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      
      // If I am Host, I need to relay messages
      if (this.isHost) {
         // Ask the new person to call me
         if (this.localStream) {
             const call = this.peer!.call(conn.peer, this.localStream);
             this.setupMediaCall(call);
         }
      }
    });

    conn.on('data', (data: any) => {
      this.handleMessage(data);
      
      // If Host, relay to everyone else
      if (this.isHost) {
        this.broadcastExcept(data, conn.peer);
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      // Notify others of disconnection
      const leaveEvent: SignalingEvent = { type: 'LEAVE', payload: { id: conn.peer } };
      this.notifyListeners(leaveEvent);
      if (this.isHost) this.broadcast(leaveEvent);
    });
  }

  // --- Media Handling ---

  private handleIncomingCall(call: MediaConnection) {
    // Answer the call with our local stream
    call.answer(this.localStream || undefined);
    this.setupMediaCall(call);
  }

  private setupMediaCall(call: MediaConnection) {
    call.on('stream', (remoteStream) => {
       // We received video! But we need to map it to a user.
       // We trigger a special internal update to attach stream to participant
       this.notifyListeners({
         type: 'UPDATE',
         payload: { id: call.peer, stream: remoteStream } as any
       });
    });
    this.mediaConnections.set(call.peer, call);
  }

  // --- Messaging ---

  private handleMessage(event: SignalingEvent) {
    // If it's a JOIN, we might need to initiate a call if we are NOT host but in mesh
    // For this MVP, we stick to Star Topology for signaling, 
    // but for Media, let's try to Mesh if possible, or simple Star.
    // Simpler: Everyone calls Host. Host calls everyone. Guests don't see each other's video in pure Star without SFU.
    // FIX: To let Guests see Guests without SFU, they must call each other.
    // Implementing Full Mesh via Host Relay:
    
    if (this.isHost && event.type === 'JOIN') {
        // Tell new user about existing peers
        // Tell existing peers about new user
        // (Handled by broadcastExcept)
    }

    // Logic for guests to call other guests:
    // When Guest A receives JOIN of Guest B (relayed by Host), A calls B.
    if (!this.isHost && event.type === 'JOIN' && event.payload.id !== this.peer?.id) {
        if (this.localStream) {
            console.log(`Initiating mesh call to ${event.payload.id}`);
            const call = this.peer!.call(event.payload.id, this.localStream);
            this.setupMediaCall(call);
        }
    }

    this.notifyListeners(event);
  }

  private broadcastExcept(data: any, skipPeerId: string) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== skipPeerId && conn.open) {
        conn.send(data);
      }
    });
  }

  // --- Public API ---

  broadcast(event: SignalingEvent) {
    // If Host: send to all.
    // If Guest: send to Host (who will relay).
    if (this.isHost) {
      this.connections.forEach(conn => conn.open && conn.send(event));
    } else {
      // Find host connection
      const hostConn = this.connections.get(`jurisim-room-${this.roomId}`);
      if (hostConn && hostConn.open) hostConn.send(event);
    }
    
    // Also notify self
    // this.notifyListeners(event); // Don't notify self to avoid echo logic issues in React
  }

  sendUpdate(participant: Participant) {
    // Override ID with PeerID to ensure consistency
    if (this.peer) {
        this.broadcast({
            type: 'UPDATE',
            payload: { ...participant, id: this.peer.id }
        });
    }
  }

  sendAudioLevel(id: string, level: number) {
     if (this.peer) {
        this.broadcast({ type: 'AUDIO_LEVEL', payload: { id: this.peer.id, level } });
     }
  }

  sendHearingStatus(status: 'waiting' | 'running' | 'ended', startTime?: number) {
    this.broadcast({ type: 'HEARING_STATUS', payload: { status, startTime } });
  }

  forceMuteAll() {
    this.broadcast({ type: 'MUTE_FORCE', payload: {} });
  }

  disconnect() {
    this.peer?.destroy();
    this.connections.clear();
    this.mediaConnections.clear();
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
}

export const roomSignaling = new RoomSignalingService();