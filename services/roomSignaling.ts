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
  
  // Track current participants to sync with late joiners
  private currentParticipants: Map<string, Participant> = new Map();
  
  private isHost: boolean = false;
  private roomId: string = '';
  private localStream: MediaStream | null = null;
  private localParticipantInfo: Participant | null = null;

  getPeerId() {
    return this.peer?.id || '';
  }

  async connect(roomId: string, user: Participant, isHost: boolean, stream: MediaStream | null) {
    // Aggressive cleanup before connecting to ensure no stale state
    this.disconnect();
    
    this.roomId = roomId;
    this.isHost = isHost;
    this.localStream = stream;
    this.localParticipantInfo = user;
    this.currentParticipants.clear();

    const cleanRoomId = roomId.replace(/[^a-zA-Z0-9-]/g, '');
    const myPeerId = isHost ? `jurisim-room-${cleanRoomId}` : undefined;
    
    console.log(`[Signaling] Connecting as ${isHost ? 'HOST' : 'GUEST'}...`);

    // Initialize Peer with a small delay to ensure previous cleanup finished
    setTimeout(() => {
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
            this.connectToHost(`jurisim-room-${cleanRoomId}`, user);
          } else {
            // Host adds themselves to the registry
            if (this.localParticipantInfo) {
                 this.currentParticipants.set(id, { ...this.localParticipantInfo, id });
            }
          }
        });

        this.peer.on('connection', (conn) => {
          this.handleDataConnection(conn);
        });

        this.peer.on('call', (call) => {
          this.handleIncomingCall(call);
        });

        this.peer.on('error', (err: any) => {
          console.error('[PeerJS Error]', err);
          if (err.type === 'unavailable-id' && isHost) {
            alert("Sessão antiga ainda ativa. Recarregando...");
            window.location.reload();
          }
          if (err.type === 'peer-unavailable') {
             // Clean up if we tried to connect to a dead peer
             const deadPeerId = err.message.replace('Could not connect to peer ', '');
             if (deadPeerId && !isHost) {
                 console.warn(`Peer ${deadPeerId} unavailable, retrying host...`);
                 setTimeout(() => this.connectToHost(`jurisim-room-${cleanRoomId}`, user), 2000);
             } else if (deadPeerId) {
                 // Remove dead peer from list
                 this.currentParticipants.delete(deadPeerId);
                 this.notifyListeners({ type: 'LEAVE', payload: { id: deadPeerId } });
             }
          }
        });
    }, 100);
  }

  private connectToHost(hostId: string, user: Participant) {
    if (!this.peer || this.peer.destroyed) return;
    
    console.log(`[Signaling] Connecting to Host: ${hostId}`);
    const conn = this.peer.connect(hostId, { metadata: user, reliable: true });
    
    conn.on('open', () => {
      this.connections.set(hostId, conn);
      
      const joinPayload = { ...user, id: this.peer?.id || '' };
      conn.send({ type: 'JOIN', payload: joinPayload });
    });

    conn.on('data', (data: any) => {
      this.handleMessage(data);
    });
    
    conn.on('close', () => {
      console.warn("Host disconnected");
    });
    
    conn.on('error', (err) => console.error("Host Connection Error", err));
  }

  private handleDataConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      
      if (this.isHost) {
         // Send existing users list to the new joiner
         const others = Array.from(this.currentParticipants.values());
         conn.send({ type: 'SYNC_USERS', payload: others });

         // Host initiates call to the new user immediately
         if (this.localStream) {
             console.log(`[Host] Calling new user ${conn.peer}`);
             const call = this.peer!.call(conn.peer, this.localStream);
             this.setupMediaCall(call);
         }
      }
    });

    conn.on('data', (data: any) => {
      this.handleMessage(data);
      
      // Host acts as a relay server for data
      if (this.isHost) {
        this.broadcastExcept(data, conn.peer);
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.currentParticipants.delete(conn.peer);
      
      const leaveEvent: SignalingEvent = { type: 'LEAVE', payload: { id: conn.peer } };
      this.notifyListeners(leaveEvent);
      if (this.isHost) this.broadcast(leaveEvent);
    });
  }

  // --- Media Handling (WebRTC) ---

  private handleIncomingCall(call: MediaConnection) {
    console.log(`[Media] Incoming call from ${call.peer}`);
    
    // Always answer to establish the P2P link
    call.answer(this.localStream || undefined);
    this.setupMediaCall(call);
  }

  private setupMediaCall(call: MediaConnection) {
    this.mediaConnections.set(call.peer, call);

    call.on('stream', (remoteStream) => {
       console.log(`[Media] Received stream from ${call.peer}`);
       this.notifyListeners({
         type: 'UPDATE',
         payload: { id: call.peer, stream: remoteStream } as any
       });
    });
    
    call.on('close', () => {
        console.log(`[Media] Call closed with ${call.peer}`);
        this.mediaConnections.delete(call.peer);
    });

    call.on('error', (err) => console.error("Media Call Error", err));
  }

  // --- Messaging ---

  private handleMessage(event: SignalingEvent) {
    if (event.type === 'JOIN') {
        this.currentParticipants.set(event.payload.id, event.payload);
        
        // MESH NETWORKING:
        // If I see someone joined, and I am NOT the host, and I am NOT the one who joined,
        // I should check if I need to initiate a call to them (Mesh).
        if (!this.isHost && event.payload.id !== this.peer?.id && this.localStream) {
            // Check if not already connected
            if (!this.mediaConnections.has(event.payload.id)) {
                console.log(`[Mesh] Initiating P2P call to ${event.payload.id}`);
                const call = this.peer!.call(event.payload.id, this.localStream);
                this.setupMediaCall(call);
            }
        }
    }
    else if (event.type === 'SYNC_USERS') {
        event.payload.forEach(p => {
             this.currentParticipants.set(p.id, p);
             
             // Aggressively connect to everyone in the list
             if (p.id !== this.peer?.id && !this.mediaConnections.has(p.id) && this.localStream) {
                 console.log(`[Mesh Sync] Calling existing peer ${p.id}`);
                 const call = this.peer!.call(p.id, this.localStream);
                 this.setupMediaCall(call);
             }
        });
    }
    else if (event.type === 'UPDATE') {
        if (this.currentParticipants.has(event.payload.id)) {
            const p = this.currentParticipants.get(event.payload.id)!;
            // Merge but DON'T overwrite stream with undefined if payload doesn't have it
            this.currentParticipants.set(event.payload.id, { ...p, ...event.payload });
        }
    }
    else if (event.type === 'LEAVE') {
        this.currentParticipants.delete(event.payload.id);
        const mediaConn = this.mediaConnections.get(event.payload.id);
        if (mediaConn) {
            mediaConn.close();
            this.mediaConnections.delete(event.payload.id);
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
    if (this.isHost) {
        if (event.type === 'UPDATE') {
             if (this.currentParticipants.has(event.payload.id)) {
                 const p = this.currentParticipants.get(event.payload.id)!;
                 this.currentParticipants.set(event.payload.id, { ...p, ...event.payload });
             }
        }
        this.connections.forEach(conn => conn.open && conn.send(event));
    } else {
      const cleanRoomId = this.roomId.replace(/[^a-zA-Z0-9-]/g, '');
      const hostConn = this.connections.get(`jurisim-room-${cleanRoomId}`);
      if (hostConn && hostConn.open) {
          hostConn.send(event);
      }
    }
  }

  sendUpdate(participant: Participant) {
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
    console.log("[Signaling] Disconnecting...");
    if (this.peer) {
        this.peer.removeAllListeners();
        this.peer.destroy();
        this.peer = null;
    }
    this.connections.forEach(conn => conn.close());
    this.connections.clear();
    this.mediaConnections.forEach(mc => mc.close());
    this.mediaConnections.clear();
    this.currentParticipants.clear();
    this.listeners = [];
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