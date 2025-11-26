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
    // If already connected to this room, update stream and return
    if (this.peer && !this.peer.destroyed && this.roomId === roomId) {
        this.localStream = stream;
        this.localParticipantInfo = user;
        // Re-broadcast join for good measure in case of refresh
        this.sendUpdate(user);
        return;
    }

    this.disconnect();
    
    this.roomId = roomId;
    this.isHost = isHost;
    this.localStream = stream;
    this.localParticipantInfo = user;
    this.currentParticipants.clear();

    // Host takes a specific ID, Guests take random IDs
    // Clean ID to avoid URL safe characters issues
    const cleanRoomId = roomId.replace(/[^a-zA-Z0-9-]/g, '');
    const myPeerId = isHost ? `jurisim-room-${cleanRoomId}` : undefined;
    
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
      
      // If I am Guest, I MUST connect to the Host first to get into the room
      if (!isHost) {
        this.connectToHost(`jurisim-room-${cleanRoomId}`, user);
      } else {
        // If I am Host, I add myself to my list
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

    this.peer.on('error', (err) => {
      console.error('[PeerJS Error]', err);
      if (err.type === 'unavailable-id' && isHost) {
        alert("Esta sala já está aberta por outro anfitrião. Você entrará como convidado.");
        // Fallback logic could go here, but reload is safer for MVP
        window.location.reload();
      }
      if (err.type === 'peer-unavailable' && !isHost) {
         // Retry logic or alert
         console.warn("Host not found. Retrying...");
      }
    });
  }

  private connectToHost(hostId: string, user: Participant) {
    if (!this.peer) return;
    
    // Data Connection
    const conn = this.peer.connect(hostId, { metadata: user, reliable: true });
    
    conn.on('open', () => {
      this.connections.set(hostId, conn);
      
      // Send JOIN immediately with my real ID
      const joinPayload = { ...user, id: this.peer?.id || '' };
      conn.send({ type: 'JOIN', payload: joinPayload });
    });

    conn.on('data', (data: any) => {
      this.handleMessage(data);
    });
    
    conn.on('close', () => {
      if (!this.isHost) {
        alert("A conexão com o Anfitrião foi perdida.");
      }
    });
    
    conn.on('error', (err) => console.error("Host Connection Error", err));
  }

  private handleDataConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      
      // If I am Host, I am the source of truth.
      if (this.isHost) {
         // 1. Send SYNC_USERS to the new guy
         // Convert Map to Array
         const others = Array.from(this.currentParticipants.values());
         conn.send({ type: 'SYNC_USERS', payload: others });

         // 2. Initiate Call (Mesh)
         if (this.localStream) {
             const call = this.peer!.call(conn.peer, this.localStream);
             this.setupMediaCall(call);
         }
      }
    });

    conn.on('data', (data: any) => {
      this.handleMessage(data);
      
      // If Host, relay to everyone else (Star topology for data)
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
    // Always answer calls. The UI decides whether to show the video.
    // This ensures waiting room users still establish the pipeline.
    call.answer(this.localStream || undefined);
    this.setupMediaCall(call);
  }

  private setupMediaCall(call: MediaConnection) {
    call.on('stream', (remoteStream) => {
       // Trigger internal update to attach stream
       this.notifyListeners({
         type: 'UPDATE',
         payload: { id: call.peer, stream: remoteStream } as any
       });
    });
    
    call.on('error', (err) => console.error("Media Call Error", err));
    this.mediaConnections.set(call.peer, call);
  }

  // --- Messaging ---

  private handleMessage(event: SignalingEvent) {
    if (event.type === 'JOIN') {
        this.currentParticipants.set(event.payload.id, event.payload);
        
        // MESH NETWORK LOGIC:
        // If I am a Guest, and I see another Guest join, I should try to connect/call them
        // But to simplify bandwidth in this MVP, we let the Host initiate calls, 
        // OR we rely on the Host relaying the JOIN, and then we initiate the call.
        
        if (!this.isHost && event.payload.id !== this.peer?.id) {
            // Establish direct media connection
            if (this.localStream) {
                // Check if already calling
                if (!this.mediaConnections.has(event.payload.id)) {
                    console.log(`[Mesh] Initiating call to ${event.payload.name}`);
                    const call = this.peer!.call(event.payload.id, this.localStream);
                    this.setupMediaCall(call);
                }
            }
        }
    }
    else if (event.type === 'SYNC_USERS') {
        // Received list of users.
        event.payload.forEach(p => {
             this.currentParticipants.set(p.id, p);
             // Try to call them if not connected
             if (p.id !== this.peer?.id && !this.mediaConnections.has(p.id) && this.localStream) {
                 const call = this.peer!.call(p.id, this.localStream);
                 this.setupMediaCall(call);
             }
        });
    }
    else if (event.type === 'UPDATE') {
        if (this.currentParticipants.has(event.payload.id)) {
            const p = this.currentParticipants.get(event.payload.id)!;
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
    // If I am Host, update my local registry
    if (this.isHost) {
        if (event.type === 'UPDATE') {
             if (this.currentParticipants.has(event.payload.id)) {
                 const p = this.currentParticipants.get(event.payload.id)!;
                 this.currentParticipants.set(event.payload.id, { ...p, ...event.payload });
             }
        }
        this.connections.forEach(conn => conn.open && conn.send(event));
    } else {
      // Guest sends to Host, Host broadcasts
      // Clean room ID logic
      const cleanRoomId = this.roomId.replace(/[^a-zA-Z0-9-]/g, '');
      const hostConn = this.connections.get(`jurisim-room-${cleanRoomId}`);
      if (hostConn && hostConn.open) {
          hostConn.send(event);
      } else {
          console.warn("Cannot broadcast: Not connected to host");
      }
    }
  }

  sendUpdate(participant: Participant) {
    // Override ID with PeerID just in case
    if (this.peer) {
        this.broadcast({
            type: 'UPDATE',
            payload: { ...participant, id: this.peer.id }
        });
    }
  }

  sendAudioLevel(id: string, level: number) {
     if (this.peer) {
        // Audio level is high frequency, so we send it fire-and-forget
        // Optimizing: only send if significant change? For now, raw.
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
    this.currentParticipants.clear();
    this.peer = null;
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