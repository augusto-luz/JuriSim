
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { Participant } from '../types';

export type SignalingEvent = 
  | { type: 'JOIN', payload: Participant }
  | { type: 'UPDATE', payload: Partial<Participant> & { id: string } }
  | { type: 'AUDIO_LEVEL', payload: { id: string, level: number } }
  | { type: 'LEAVE', payload: { id: string } }
  | { type: 'MUTE_FORCE', payload: { targetId?: string } }
  | { type: 'HEARING_STATUS', payload: { status: 'waiting' | 'running' | 'ended', startTime?: number } }
  | { type: 'SYNC_USERS', payload: Participant[] }
  | { type: 'ERROR', payload: string }
  | { type: 'RETRYING', payload: string };

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
  private retryCount: number = 0;
  private maxRetries: number = 5;

  getPeerId() { return this.peer?.id || ''; }

  async connect(roomId: string, user: Participant, isHost: boolean, stream: MediaStream | null) {
    if (!roomId) return;

    this.disconnect();
    
    this.roomId = roomId;
    this.isHost = isHost;
    this.localStream = stream;
    this.localParticipantInfo = user;

    const cleanRoomId = roomId.replace(/[^a-zA-Z0-9-]/g, '');
    const myPeerId = isHost ? `juri-v3-${cleanRoomId}` : undefined;
    
    const isSecure = window.location.protocol === 'https:';

    this.peer = new Peer(myPeerId, {
      debug: 1,
      secure: isSecure,
      host: '0.peerjs.com',
      port: 443,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    this.peer.on('open', (id) => {
      console.debug(`[Signaling] Conectado. ID: ${id}`);
      this.retryCount = 0; // Reset ao abrir
      if (!isHost) {
        this.attemptConnectToHost(`juri-v3-${cleanRoomId}`, user);
      } else if (this.localParticipantInfo) {
        this.currentParticipants.set(id, { ...this.localParticipantInfo, id });
      }
    });

    this.peer.on('connection', (conn) => this.handleDataConnection(conn));
    this.peer.on('call', (call) => this.handleIncomingCall(call));

    this.peer.on('error', (err: any) => {
      console.error("[Signaling] Erro:", err.type);
      
      // Lógica de Re-tentativa para Host Indisponível (comum se o host for lento ou estiver escolhendo cargo)
      if (err.type === 'peer-unavailable' && !this.isHost && this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.notifyListeners({ type: 'RETRYING', payload: `Aguardando o host se conectar... (Tentativa ${this.retryCount}/${this.maxRetries})` });
        
        setTimeout(() => {
          if (this.peer && !this.peer.destroyed) {
            this.attemptConnectToHost(`juri-v3-${cleanRoomId}`, this.localParticipantInfo!);
          }
        }, 3000); // 3 segundos entre tentativas
        return;
      }

      if (err.type === 'peer-unavailable') {
        this.notifyListeners({ type: 'ERROR', payload: 'O anfitrião da sala não foi encontrado. Verifique se o código está correto.' });
      } else if (err.type === 'unavailable-id') {
        this.notifyListeners({ type: 'ERROR', payload: 'Esta sala já possui um anfitrião ativo.' });
      } else {
        this.notifyListeners({ type: 'ERROR', payload: `Falha de rede: ${err.type}` });
      }
    });
  }

  private attemptConnectToHost(hostId: string, user: Participant) {
    if (!this.peer || this.peer.destroyed) return;

    console.debug(`[Signaling] Tentando conectar ao host: ${hostId}`);
    const conn = this.peer.connect(hostId, { metadata: user, reliable: true });

    conn.on('open', () => {
      console.debug("[Signaling] Conexão com host estabelecida.");
      this.retryCount = 0;
      this.connections.set(hostId, conn);
      conn.send({ type: 'JOIN', payload: { ...user, id: this.peer!.id } });
    });

    conn.on('data', (data: any) => this.handleMessage(data));
    conn.on('close', () => this.handleParticipantLeave(hostId));
    conn.on('error', (err) => console.error("[Signaling] Erro na conexão de dados:", err));
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
    conn.on('error', () => this.handleParticipantLeave(conn.peer));
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
      if (!this.isHost && event.payload.id !== this.peer?.id && this.localStream && !this.mediaConnections.has(event.payload.id)) {
        const call = this.peer!.call(event.payload.id, this.localStream);
        this.setupMediaCall(call);
      }
    } else if (event.type === 'SYNC_USERS') {
      event.payload.forEach(p => {
        if (p.id === this.peer?.id) return;
        this.currentParticipants.set(p.id, p);
        if (!this.mediaConnections.has(p.id) && this.localStream) {
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
    this.mediaConnections.delete(id);
    this.currentParticipants.delete(id);
    this.notifyListeners({ type: 'LEAVE', payload: { id } });
  }

  private broadcastExcept(data: any, skipId: string) {
    this.connections.forEach((conn, id) => { 
      if (id !== skipId && conn.open) conn.send(data); 
    });
  }

  broadcast(event: SignalingEvent) {
    if (!this.peer || this.peer.destroyed) return;
    if (this.isHost) {
      this.connections.forEach(conn => conn.open && conn.send(event));
    } else {
      const cleanRoomId = this.roomId.replace(/[^a-zA-Z0-9-]/g, '');
      const hostId = `juri-v3-${cleanRoomId}`;
      const hostConn = this.connections.get(hostId);
      if (hostConn?.open) hostConn.send(event);
    }
  }

  sendUpdate(participant: Participant) {
    if (this.peer && !this.peer.destroyed) {
      this.broadcast({ type: 'UPDATE', payload: { ...participant, id: this.peer.id } });
    }
  }

  sendHearingStatus(status: 'waiting' | 'running' | 'ended', startTime?: number) {
    this.broadcast({ type: 'HEARING_STATUS', payload: { status, startTime } });
  }

  disconnect() {
    this.connections.forEach(c => c.close());
    this.connections.clear();
    this.mediaConnections.forEach(m => m.close());
    this.mediaConnections.clear();
    this.currentParticipants.clear();
    this.retryCount = 0;
    
    if (this.peer) { 
      this.peer.destroy(); 
      this.peer = null; 
    }
  }

  subscribe(cb: (event: SignalingEvent) => void) {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  private notifyListeners(e: SignalingEvent) { 
    this.listeners.forEach(l => l(e)); 
  }
}

export const roomSignaling = new RoomSignalingService();
