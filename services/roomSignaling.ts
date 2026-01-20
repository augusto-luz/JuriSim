
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
  private connections: Map<string, DataConnection> = new Map();
  private mediaConnections: Map<string, MediaConnection> = new Map();
  private listeners: ((event: SignalingEvent) => void)[] = [];
  private currentParticipants: Map<string, Participant> = new Map();
  
  private isHost: boolean = false;
  private roomId: string = '';
  private localStream: MediaStream | null = null;
  private localParticipantInfo: Participant | null = null;

  getPeerId() { return this.peer?.id || ''; }

  async connect(roomId: string, user: Participant, isHost: boolean, stream: MediaStream | null) {
    if (!roomId) return;

    this.disconnect();
    this.roomId = roomId;
    this.isHost = isHost;
    this.localStream = stream;
    this.localParticipantInfo = user;

    const cleanRoomId = roomId.replace(/[^a-zA-Z0-9-]/g, '');
    const myPeerId = isHost ? `jurisim-v2-${cleanRoomId}` : undefined;
    
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
      console.log(`[Signaling] ID: ${id}`);
      if (!isHost) {
        this.attemptConnectToHost(`jurisim-v2-${cleanRoomId}`, user, 0);
      } else if (this.localParticipantInfo) {
        this.currentParticipants.set(id, { ...this.localParticipantInfo, id });
      }
    });

    this.peer.on('connection', (conn) => this.handleDataConnection(conn));
    this.peer.on('call', (call) => this.handleIncomingCall(call));

    this.peer.on('error', (err: any) => {
      if (err.type === 'unavailable-id' && isHost) {
        console.warn("Sala já ativa. Tentando reconectar como participante.");
        // Não resetamos, permitimos que o erro suba para a UI se necessário
      }
    });
  }

  private attemptConnectToHost(hostId: string, user: Participant, retryCount: number) {
    if (!this.peer || this.peer.destroyed) return;

    const conn = this.peer.connect(hostId, { metadata: user, reliable: true });

    const timeout = window.setTimeout(() => {
      if (!conn.open && retryCount < 3) {
        conn.close();
        this.attemptConnectToHost(hostId, user, retryCount + 1);
      }
    }, 4000);

    conn.on('open', () => {
      clearTimeout(timeout);
      this.connections.set(hostId, conn);
      conn.send({ type: 'JOIN', payload: { ...user, id: this.peer!.id } });
    });

    conn.on('data', (data: any) => this.handleMessage(data));
  }

  private handleDataConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      if (this.isHost) {
        conn.send({ type: 'SYNC_USERS', payload: Array.from(this.currentParticipants.values()) });
        if (this.localStream) {
          const call = this.peer!.call(conn.peer, this.localStream);
          this.setupMediaCall(call);
        }
      }
    });
    conn.on('data', (data: any) => {
      this.handleMessage(data);
      if (this.isHost) this.broadcastExcept(data, conn.peer);
    });
    conn.on('close', () => this.handleParticipantLeave(conn.peer));
  }

  private handleIncomingCall(call: MediaConnection) {
    call.answer(this.localStream || undefined);
    this.setupMediaCall(call);
  }

  private setupMediaCall(call: MediaConnection) {
    this.mediaConnections.set(call.peer, call);
    call.on('stream', (remoteStream) => {
       this.notifyListeners({ type: 'UPDATE', payload: { id: call.peer, stream: remoteStream } as any });
    });
    call.on('close', () => this.mediaConnections.delete(call.peer));
  }

  private handleMessage(event: SignalingEvent) {
    if (event.type === 'JOIN') {
      this.currentParticipants.set(event.payload.id, event.payload);
      if (!this.isHost && event.payload.id !== this.peer?.id && this.localStream) {
        const call = this.peer!.call(event.payload.id, this.localStream);
        this.setupMediaCall(call);
      }
    } else if (event.type === 'SYNC_USERS') {
      event.payload.forEach(p => {
        this.currentParticipants.set(p.id, p);
        if (p.id !== this.peer?.id && !this.mediaConnections.has(p.id) && this.localStream) {
          const call = this.peer!.call(p.id, this.localStream);
          this.setupMediaCall(call);
        }
      });
    } else if (event.type === 'UPDATE') {
      const p = this.currentParticipants.get(event.payload.id);
      if (p) this.currentParticipants.set(event.payload.id, { ...p, ...event.payload });
    }
    this.notifyListeners(event);
  }

  private handleParticipantLeave(id: string) {
    this.connections.delete(id);
    this.currentParticipants.delete(id);
    this.notifyListeners({ type: 'LEAVE', payload: { id } });
  }

  private broadcastExcept(data: any, skipId: string) {
    this.connections.forEach((conn, id) => { if (id !== skipId && conn.open) conn.send(data); });
  }

  broadcast(event: SignalingEvent) {
    if (!this.peer || this.peer.destroyed) return;
    if (this.isHost) {
      this.connections.forEach(conn => conn.open && conn.send(event));
    } else {
      const cleanRoomId = this.roomId.replace(/[^a-zA-Z0-9-]/g, '');
      const hostConn = this.connections.get(`jurisim-v2-${cleanRoomId}`);
      if (hostConn?.open) hostConn.send(event);
    }
  }

  sendUpdate(participant: Participant) {
    if (this.peer) this.broadcast({ type: 'UPDATE', payload: { ...participant, id: this.peer.id } });
  }

  sendHearingStatus(status: 'waiting' | 'running' | 'ended', startTime?: number) {
    this.broadcast({ type: 'HEARING_STATUS', payload: { status, startTime } });
  }

  disconnect() {
    if (this.peer) { 
      this.peer.destroy(); 
      this.peer = null; 
    }
    this.connections.forEach(c => c.close());
    this.connections.clear();
    this.mediaConnections.forEach(m => m.close());
    this.mediaConnections.clear();
    this.currentParticipants.clear();
  }

  subscribe(cb: (event: SignalingEvent) => void) {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  private notifyListeners(e: SignalingEvent) { this.listeners.forEach(l => l(e)); }
}

export const roomSignaling = new RoomSignalingService();
