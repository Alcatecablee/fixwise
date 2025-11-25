import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import { randomUUID } from 'crypto';

interface WebSocketClient {
  id: string;
  ws: WebSocket;
  sessionId: string;
  userId?: string;
  userName: string;
  role: 'host' | 'moderator' | 'participant' | 'observer';
  joinedAt: Date;
  lastSeen: Date;
  metadata: Record<string, any>;
}

interface CollaborationMessage {
  type: 'join' | 'leave' | 'cursor_move' | 'code_change' | 'comment' | 'analysis' | 'presence_update' | 'error' | 'ping' | 'pong';
  sessionId: string;
  userId?: string;
  userName: string;
  data?: any;
  timestamp: Date;
  messageId: string;
}

export class CollaborationWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocketClient> = new Map();
  private sessions: Map<string, Set<string>> = new Map(); // sessionId -> Set of clientIds
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupHeartbeat();
  }

  initialize(server: any) {
    this.wss = new WebSocketServer({
      server,
      path: '/api/collaboration/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('[WEBSOCKET] Server initialized on /api/collaboration/ws');
  }

  private verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }): boolean {
    // Basic verification - in production, add proper authentication
    const url = parse(info.req.url || '', true);
    const sessionId = url.query.sessionId as string;
    const userName = url.query.userName as string;

    if (!sessionId || !userName) {
      console.log('[WEBSOCKET] Connection rejected: missing sessionId or userName');
      return false;
    }

    return true;
  }

  private handleConnection(ws: WebSocket, request: IncomingMessage) {
    const url = parse(request.url || '', true);
    const sessionId = url.query.sessionId as string;
    const userName = url.query.userName as string;
    const userId = url.query.userId as string;
    const role = (url.query.role as string) || 'participant';

    const clientId = randomUUID();
    const client: WebSocketClient = {
      id: clientId,
      ws,
      sessionId,
      userId,
      userName,
      role: role as any,
      joinedAt: new Date(),
      lastSeen: new Date(),
      metadata: {}
    };

    this.clients.set(clientId, client);

    // Add client to session
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new Set());
    }
    this.sessions.get(sessionId)!.add(clientId);

    console.log(`[WEBSOCKET] Client ${userName} (${clientId}) joined session ${sessionId}`);

    // Set up message handling
    ws.on('message', (data) => this.handleMessage(clientId, Buffer.from(data.toString())));
    ws.on('close', () => this.handleDisconnection(clientId));
    ws.on('error', (error) => this.handleError(clientId, error));

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'join',
      sessionId,
      userName: 'System',
      data: {
        clientId,
        message: 'Successfully connected to collaboration session',
        participants: this.getSessionParticipants(sessionId)
      },
      timestamp: new Date(),
      messageId: randomUUID()
    });

    // Notify other participants about the new user
    this.broadcastToSession(sessionId, {
      type: 'join',
      sessionId,
      userId,
      userName,
      data: {
        clientId,
        role,
        joinedAt: client.joinedAt
      },
      timestamp: new Date(),
      messageId: randomUUID()
    }, clientId);
  }

  private handleMessage(clientId: string, data: Buffer) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message: CollaborationMessage = JSON.parse(data.toString());
      
      // Update last seen
      client.lastSeen = new Date();

      // Handle different message types
      switch (message.type) {
        case 'ping':
          this.sendToClient(clientId, {
            type: 'pong',
            sessionId: client.sessionId,
            userName: 'System',
            timestamp: new Date(),
            messageId: randomUUID()
          });
          break;

        case 'cursor_move':
          this.broadcastToSession(client.sessionId, {
            ...message,
            userId: client.userId,
            userName: client.userName,
            timestamp: new Date(),
            messageId: randomUUID()
          }, clientId);
          break;

        case 'code_change':
          this.broadcastToSession(client.sessionId, {
            ...message,
            userId: client.userId,
            userName: client.userName,
            timestamp: new Date(),
            messageId: randomUUID()
          }, clientId);
          break;

        case 'comment':
          this.broadcastToSession(client.sessionId, {
            ...message,
            userId: client.userId,
            userName: client.userName,
            timestamp: new Date(),
            messageId: randomUUID()
          });
          break;

        case 'analysis':
          this.broadcastToSession(client.sessionId, {
            ...message,
            userId: client.userId,
            userName: client.userName,
            timestamp: new Date(),
            messageId: randomUUID()
          });
          break;

        case 'presence_update':
          this.broadcastToSession(client.sessionId, {
            ...message,
            userId: client.userId,
            userName: client.userName,
            timestamp: new Date(),
            messageId: randomUUID()
          }, clientId);
          break;

        default:
          console.log(`[WEBSOCKET] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`[WEBSOCKET] Error parsing message from ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: 'error',
        sessionId: client.sessionId,
        userName: 'System',
        data: { error: 'Invalid message format' },
        timestamp: new Date(),
        messageId: randomUUID()
      });
    }
  }

  private handleDisconnection(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`[WEBSOCKET] Client ${client.userName} (${clientId}) disconnected`);

    // Remove from session
    const sessionClients = this.sessions.get(client.sessionId);
    if (sessionClients) {
      sessionClients.delete(clientId);
      if (sessionClients.size === 0) {
        this.sessions.delete(client.sessionId);
      }
    }

    // Notify other participants
    this.broadcastToSession(client.sessionId, {
      type: 'leave',
      sessionId: client.sessionId,
      userId: client.userId,
      userName: client.userName,
      data: {
        clientId,
        leftAt: new Date()
      },
      timestamp: new Date(),
      messageId: randomUUID()
    });

    // Remove client
    this.clients.delete(clientId);
  }

  private handleError(clientId: string, error: Error) {
    console.error(`[WEBSOCKET] Error for client ${clientId}:`, error);
    this.handleDisconnection(clientId);
  }

  private sendToClient(clientId: string, message: CollaborationMessage) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`[WEBSOCKET] Error sending message to ${clientId}:`, error);
      this.handleDisconnection(clientId);
      return false;
    }
  }

  private broadcastToSession(sessionId: string, message: CollaborationMessage, excludeClientId?: string) {
    const sessionClients = this.sessions.get(sessionId);
    if (!sessionClients) return;

    let sentCount = 0;
    for (const clientId of sessionClients) {
      if (excludeClientId && clientId === excludeClientId) continue;
      
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    }

    console.log(`[WEBSOCKET] Broadcasted ${message.type} to ${sentCount} clients in session ${sessionId}`);
  }

  private getSessionParticipants(sessionId: string): Array<{
    clientId: string;
    userId?: string;
    userName: string;
    role: string;
    joinedAt: Date;
    lastSeen: Date;
  }> {
    const sessionClients = this.sessions.get(sessionId);
    if (!sessionClients) return [];

    return Array.from(sessionClients)
      .map(clientId => this.clients.get(clientId))
      .filter(client => client !== undefined)
      .map(client => ({
        clientId: client!.id,
        userId: client!.userId,
        userName: client!.userName,
        role: client!.role,
        joinedAt: client!.joinedAt,
        lastSeen: client!.lastSeen
      }));
  }

  private setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const timeout = 30000; // 30 seconds

      for (const [clientId, client] of this.clients.entries()) {
        if (now.getTime() - client.lastSeen.getTime() > timeout) {
          console.log(`[WEBSOCKET] Client ${clientId} timed out`);
          this.handleDisconnection(clientId);
        }
      }
    }, 15000); // Check every 15 seconds
  }

  public getStats() {
    return {
      totalClients: this.clients.size,
      totalSessions: this.sessions.size,
      sessions: Array.from(this.sessions.entries()).map(([sessionId, clients]) => ({
        sessionId,
        participantCount: clients.size,
        participants: this.getSessionParticipants(sessionId)
      }))
    };
  }

  public closeSession(sessionId: string) {
    const sessionClients = this.sessions.get(sessionId);
    if (!sessionClients) return;

    // Notify all clients that session is closing
    this.broadcastToSession(sessionId, {
      type: 'error',
      sessionId,
      userName: 'System',
      data: { error: 'Session has been closed by administrator' },
      timestamp: new Date(),
      messageId: randomUUID()
    });

    // Close all connections
    for (const clientId of sessionClients) {
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.close(1000, 'Session closed');
      }
    }
  }

  public destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all connections
    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.close(1000, 'Server shutting down');
      }
    }

    this.clients.clear();
    this.sessions.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    console.log('[WEBSOCKET] Server destroyed');
  }
}

export const collaborationWS = new CollaborationWebSocketServer();
