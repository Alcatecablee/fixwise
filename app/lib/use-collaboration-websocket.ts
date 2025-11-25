"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface CollaborationMessage {
  type: 'join' | 'leave' | 'cursor_move' | 'code_change' | 'comment' | 'analysis' | 'presence_update' | 'error' | 'ping' | 'pong';
  sessionId: string;
  userId?: string;
  userName: string;
  data?: any;
  timestamp: Date;
  messageId: string;
}

interface Participant {
  clientId: string;
  userId?: string;
  userName: string;
  role: string;
  joinedAt: Date;
  lastSeen: Date;
  cursor?: {
    line: number;
    column: number;
    file?: string;
  };
}

interface UseCollaborationWebSocketProps {
  sessionId: string;
  userName: string;
  userId?: string;
  role?: 'host' | 'moderator' | 'participant' | 'observer';
  onMessage?: (message: CollaborationMessage) => void;
  onParticipantJoin?: (participant: Participant) => void;
  onParticipantLeave?: (participant: Participant) => void;
  onError?: (error: string) => void;
}

interface UseCollaborationWebSocketReturn {
  isConnected: boolean;
  participants: Participant[];
  sendMessage: (type: CollaborationMessage['type'], data?: any) => void;
  sendCursorUpdate: (line: number, column: number, file?: string) => void;
  sendCodeChange: (content: string, file: string, changes: any[]) => void;
  sendComment: (content: string, lineNumber?: number, file?: string) => void;
  sendAnalysis: (results: any, file: string) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  error: string | null;
  reconnect: () => void;
}

export function useCollaborationWebSocket({
  sessionId,
  userName,
  userId,
  role = 'participant',
  onMessage,
  onParticipantJoin,
  onParticipantLeave,
  onError
}: UseCollaborationWebSocketProps): UseCollaborationWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
      const wsUrl = `${protocol}//${host}/api/collaboration/ws?sessionId=${encodeURIComponent(sessionId)}&userName=${encodeURIComponent(userName)}&userId=${encodeURIComponent(userId || '')}&role=${encodeURIComponent(role)}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WEBSOCKET CLIENT] Connected to collaboration session');
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        setReconnectAttempts(0);
        
        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ping',
              sessionId,
              userName,
              timestamp: new Date(),
              messageId: `ping_${Date.now()}`
            }));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message: CollaborationMessage = JSON.parse(event.data);
          
          // Handle system messages
          if (message.type === 'join') {
            if (message.data?.participants) {
              setParticipants(message.data.participants);
            } else if (message.data?.clientId !== message.data?.currentClientId) {
              // Another user joined
              const newParticipant: Participant = {
                clientId: message.data.clientId,
                userId: message.userId,
                userName: message.userName,
                role: message.data.role || 'participant',
                joinedAt: new Date(message.data.joinedAt),
                lastSeen: new Date()
              };
              setParticipants(prev => [...prev, newParticipant]);
              onParticipantJoin?.(newParticipant);
            }
          } else if (message.type === 'leave') {
            setParticipants(prev => prev.filter(p => p.clientId !== message.data?.clientId));
            if (message.data?.clientId) {
              const leftParticipant = participants.find(p => p.clientId === message.data.clientId);
              if (leftParticipant) {
                onParticipantLeave?.(leftParticipant);
              }
            }
          } else if (message.type === 'cursor_move') {
            setParticipants(prev => prev.map(p => 
              p.userId === message.userId 
                ? { ...p, cursor: message.data?.cursor, lastSeen: new Date() }
                : p
            ));
          } else if (message.type === 'presence_update') {
            setParticipants(prev => prev.map(p => 
              p.userId === message.userId 
                ? { ...p, ...message.data, lastSeen: new Date() }
                : p
            ));
          } else if (message.type === 'error') {
            const errorMsg = message.data?.error || 'Unknown WebSocket error';
            setError(errorMsg);
            onError?.(errorMsg);
          } else if (message.type === 'pong') {
            // Handle pong response
            console.log('[WEBSOCKET CLIENT] Received pong');
          }

          // Call the general message handler
          onMessage?.(message);
        } catch (error) {
          console.error('[WEBSOCKET CLIENT] Error parsing message:', error);
        }
      };

            ws.onerror = (error) => {
        // Extract useful error information from the Event object
        const errorInfo = {
          type: error.type,
          target: (error.target as WebSocket)?.readyState,
          url: (error.target as WebSocket)?.url,
          timestamp: new Date().toISOString()
        };

        console.error('[WEBSOCKET CLIENT] WebSocket error details:', {
          ...errorInfo,
          message: 'Failed to connect to WebSocket server. Ensure the server supports WebSocket connections.',
          suggestion: 'Use "npm run dev:ws" instead of "npm run dev" for WebSocket support'
        });

        const errorMessage = 'WebSocket connection failed. Real-time collaboration unavailable.';
        setError(errorMessage);
        setConnectionStatus('error');
        onError?.(errorMessage);
      };

      ws.onclose = (event) => {
        console.log('[WEBSOCKET CLIENT] Connection closed:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
                }

        // Handle specific error codes
        if (event.code === 1006) {
          // Abnormal closure - likely server not available
          const errorMsg = 'WebSocket server not available. Start server with WebSocket support for real-time collaboration.';
          console.warn('[WEBSOCKET CLIENT]', errorMsg);
          setError(errorMsg);
          setConnectionStatus('error');
          onError?.(errorMsg);
          return; // Don't attempt to reconnect if server is not available
        }

        // Attempt to reconnect if it wasn't a normal closure
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts); // Exponential backoff
          console.log(`[WEBSOCKET CLIENT] Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setError('Failed to reconnect after multiple attempts');
          setConnectionStatus('error');
        }
      };
        } catch (error) {
      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
      const errorMessage = `Failed to create WebSocket connection: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('[WEBSOCKET CLIENT]', errorMessage, {
        sessionId,
        userName,
        wsUrl: `${protocol}//${host}/api/collaboration/ws`,
        suggestion: 'Ensure WebSocket server is running (use "npm run dev:ws")'
      });
      setError('Failed to establish connection');
      setConnectionStatus('error');
      onError?.('Failed to establish connection');
    }
  }, [sessionId, userName, userId, role, reconnectAttempts, onMessage, onParticipantJoin, onParticipantLeave, onError, participants]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    setParticipants([]);
  }, []);

  const sendMessage = useCallback((type: CollaborationMessage['type'], data?: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: CollaborationMessage = {
        type,
        sessionId,
        userId,
        userName,
        data,
        timestamp: new Date(),
        messageId: `${type}_${Date.now()}_${Math.random().toString(36).substring(2)}`
      };

      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WEBSOCKET CLIENT] Cannot send message: WebSocket not connected');
    }
  }, [sessionId, userId, userName]);

  const sendCursorUpdate = useCallback((line: number, column: number, file?: string) => {
    sendMessage('cursor_move', {
      cursor: { line, column, file }
    });
  }, [sendMessage]);

  const sendCodeChange = useCallback((content: string, file: string, changes: any[]) => {
    sendMessage('code_change', {
      content,
      file,
      changes,
      timestamp: new Date()
    });
  }, [sendMessage]);

  const sendComment = useCallback((content: string, lineNumber?: number, file?: string) => {
    sendMessage('comment', {
      content,
      lineNumber,
      file,
      timestamp: new Date()
    });
  }, [sendMessage]);

  const sendAnalysis = useCallback((results: any, file: string) => {
    sendMessage('analysis', {
      results,
      file,
      timestamp: new Date()
    });
  }, [sendMessage]);

  const reconnect = useCallback(() => {
    setReconnectAttempts(0);
    disconnect();
    setTimeout(connect, 1000);
  }, [connect, disconnect]);

  // Initialize connection on mount
  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    participants,
    sendMessage,
    sendCursorUpdate,
    sendCodeChange,
    sendComment,
    sendAnalysis,
    connectionStatus,
    error,
    reconnect
  };
}
