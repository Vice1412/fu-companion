import Peer from 'peerjs';

class PeerSyncManager {
  constructor() {
    this.peer = null;
    this.connections = [];
    this.isHost = false;
    this.roomCode = null;
    this.onStateReceived = null;
    this.onPeerConnected = null;
    this.onPeerDisconnected = null;
    this.onError = null;
  }

  // Create a room as GM
  createRoom(roomCode, onOpenCallback) {
    this.destroy();
    this.isHost = true;
    const cleanCode = roomCode.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    this.roomCode = cleanCode;

    // Use PeerJS with clean ID
    this.peer = new Peer(`fu-${cleanCode}-${Date.now().toString(36)}`, {
      debug: 1
    });

    this.peer.on('open', (id) => {
      if (onOpenCallback) onOpenCallback(cleanCode, id);
    });

    this.peer.on('connection', (conn) => {
      this.connections.push(conn);

      conn.on('open', () => {
        if (this.onPeerConnected) this.onPeerConnected(conn.peer);
      });

      conn.on('data', (data) => {
        if (this.onStateReceived) this.onStateReceived(data, conn);
      });

      conn.on('close', () => {
        this.connections = this.connections.filter(c => c !== conn);
        if (this.onPeerDisconnected) this.onPeerDisconnected(conn.peer);
      });
    });

    this.peer.on('error', (err) => {
      console.warn('PeerJS Host Error:', err);
      if (this.onError) this.onError(err);
    });
  }

  // Join a room as Player
  joinRoom(targetRoomCode, onConnectedCallback) {
    this.destroy();
    this.isHost = false;
    const cleanCode = targetRoomCode.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    this.roomCode = cleanCode;

    this.peer = new Peer();

    this.peer.on('open', (myId) => {
      // Find host peer id (prefix pattern)
      // Connect to host
      const conn = this.peer.connect(`fu-${cleanCode}`, {
        reliable: true
      });

      this.connections = [conn];

      conn.on('open', () => {
        if (onConnectedCallback) onConnectedCallback(cleanCode);
        if (this.onPeerConnected) this.onPeerConnected(conn.peer);
      });

      conn.on('data', (data) => {
        if (this.onStateReceived) this.onStateReceived(data, conn);
      });

      conn.on('close', () => {
        this.connections = [];
        if (this.onPeerDisconnected) this.onPeerDisconnected(conn.peer);
      });
    });

    this.peer.on('error', (err) => {
      console.warn('PeerJS Client Error:', err);
      if (this.onError) this.onError(err);
    });
  }

  // Broadcast state to all peers
  broadcast(type, payload) {
    const packet = { type, payload, timestamp: Date.now() };
    this.connections.forEach(conn => {
      if (conn.open) {
        try {
          conn.send(packet);
        } catch (e) {
          console.error('PeerJS send error:', e);
        }
      }
    });
  }

  destroy() {
    this.connections.forEach(c => {
      try { c.close(); } catch (e) {}
    });
    this.connections = [];
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
  }
}

export const peerSync = new PeerSyncManager();
