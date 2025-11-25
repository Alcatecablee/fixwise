"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client for realtime
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 20, // Throttle events for better performance
    },
  },
});

interface CollaborationMessage {
  type: 'join' | 'leave' | 'cursor_move' | 'code_change' | 'comment' | 'analysis' | 'presence_update';
  sessionId: string;
  userId?: string;
  userName: string;
  data?: any;
  timestamp: string;
  messageId: string;
}

interface Participant {
  userId?: string;
  userName: string;
  role: string;
  joinedAt: string;
  lastSeen: string;
  isOnline: boolean;
  cursor?: {
    line: number;
    column: number;
    file?: string;
  };
  avatar?: string;
  color?: string;
}

interface UseCollaborationRealtimeProps {
  sessionId: string;
  userName: string;
  userId?: string;
  role?: 'host' | 'moderator' | 'participant' | 'observer';
  onMessage?: (message: CollaborationMessage) => void;
  onParticipantJoin?: (participant: Participant) => void;
  onParticipantLeave?: (participant: Participant) => void;
  onError?: (error: string) => void;
}

interface UseCollaborationRealtimeReturn {
  isConnected: boolean;
  participants: Participant[];
  sendMessage: (type: CollaborationMessage['type'], data?: any) => Promise<void>;
  sendCursorUpdate: (line: number, column: number, file?: string) => Promise<void>;
  sendCodeChange: (content: string, file: string, changes: any[]) => Promise<void>;
  sendComment: (content: string, lineNumber?: number, file?: string) => Promise<void>;
  sendAnalysis: (results: any, file: string) => Promise<void>;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  error: string | null;
  reconnect: () => void;
}

// Assign colors to participants
const participantColors = [
  '#2196F3', '#4CAF50', '#FF9800', '#E91E63', 
  '#9C27B0', '#00BCD4', '#FFC107', '#795548'
];

export function useCollaborationRealtime({
  sessionId,
  userName,
  userId,
  role = 'participant',
  onMessage,
  onParticipantJoin,
  onParticipantLeave,
  onError
}: UseCollaborationRealtimeProps): UseCollaborationRealtimeReturn {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const participantColorMap = useRef<Map<string, string>>(new Map());

  const getParticipantColor = useCallback((participantId: string): string => {
    if (!participantColorMap.current.has(participantId)) {
      const colorIndex = participantColorMap.current.size % participantColors.length;
      participantColorMap.current.set(participantId, participantColors[colorIndex]);
    }
    return participantColorMap.current.get(participantId)!;
  }, []);

  const connect = useCallback(() => {
    if (channelRef.current) {
      return; // Already connected
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      // Create channel for this collaboration session
      const channel = supabase.channel(`collaboration:${sessionId}`, {
        config: {
          presence: {
            key: userId || `guest_${Date.now()}`,
          },
        },
      });

      channelRef.current = channel;

      // Handle presence state (who's online)
      channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          const currentParticipants: Participant[] = [];

          Object.entries(presenceState).forEach(([key, presences]: [string, any[]]) => {
            const presence = presences[0]; // Get the latest presence
            if (presence) {
              currentParticipants.push({
                userId: presence.userId || key,
                userName: presence.userName || 'Anonymous',
                role: presence.role || 'participant',
                joinedAt: presence.joinedAt || new Date().toISOString(),
                lastSeen: presence.lastSeen || new Date().toISOString(),
                isOnline: true,
                cursor: presence.cursor,
                avatar: presence.avatar,
                color: getParticipantColor(presence.userId || key),
              });
            }
          });

          setParticipants(currentParticipants);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          const newPresence = newPresences[0];
          if (newPresence && newPresence.userName !== userName) {
            const participant: Participant = {
              userId: newPresence.userId || key,
              userName: newPresence.userName || 'Anonymous',
              role: newPresence.role || 'participant',
              joinedAt: newPresence.joinedAt || new Date().toISOString(),
              lastSeen: new Date().toISOString(),
              isOnline: true,
              color: getParticipantColor(newPresence.userId || key),
            };
            onParticipantJoin?.(participant);
          }
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          const leftPresence = leftPresences[0];
          if (leftPresence) {
            const participant: Participant = {
              userId: leftPresence.userId || key,
              userName: leftPresence.userName || 'Anonymous',
              role: leftPresence.role || 'participant',
              joinedAt: leftPresence.joinedAt || new Date().toISOString(),
              lastSeen: new Date().toISOString(),
              isOnline: false,
              color: getParticipantColor(leftPresence.userId || key),
            };
            onParticipantLeave?.(participant);
          }
        });

      // Handle broadcast messages (code changes, comments, etc.)
      channel
        .on('broadcast', { event: 'collaboration_message' }, ({ payload }) => {
          const message: CollaborationMessage = payload;
          
          // Update participant cursor position if it's a cursor move
          if (message.type === 'cursor_move') {
            setParticipants(prev => prev.map(p => 
              p.userId === message.userId 
                ? { ...p, cursor: message.data?.cursor, lastSeen: new Date().toISOString() }
                : p
            ));
          }

          onMessage?.(message);
        });

      // Subscribe to the channel
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionStatus('connected');
          setError(null);

          // Track our presence
          const presencePayload = {
            userId: userId || `guest_${Date.now()}`,
            userName,
            role,
            joinedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            avatar: null,
          };

          presenceRef.current = await channel.track(presencePayload);
          console.log('[SUPABASE REALTIME] Connected to collaboration session');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
          setError('Failed to connect to collaboration session');
          onError?.('Failed to connect to collaboration session');
        } else if (status === 'TIMED_OUT') {
          setConnectionStatus('error');
          setError('Connection timed out');
          onError?.('Connection timed out');
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          setConnectionStatus('disconnected');
        }
      });

    } catch (error) {
      const errorMessage = `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('[SUPABASE REALTIME]', errorMessage);
      setError(errorMessage);
      setConnectionStatus('error');
      onError?.(errorMessage);
    }
  }, [sessionId, userName, userId, role, onMessage, onParticipantJoin, onParticipantLeave, onError, getParticipantColor]);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    
    presenceRef.current = null;
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setParticipants([]);
  }, []);

  const sendMessage = useCallback(async (type: CollaborationMessage['type'], data?: any) => {
    if (!channelRef.current || !isConnected) {
      console.warn('[SUPABASE REALTIME] Cannot send message: not connected');
      return;
    }

    const message: CollaborationMessage = {
      type,
      sessionId,
      userId,
      userName,
      data,
      timestamp: new Date().toISOString(),
      messageId: `${type}_${Date.now()}_${Math.random().toString(36).substring(2)}`
    };

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'collaboration_message',
        payload: message,
      });

      // Update our presence timestamp
      if (presenceRef.current) {
        await presenceRef.current.track({
          ...presenceRef.current.state,
          lastSeen: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('[SUPABASE REALTIME] Failed to send message:', error);
    }
  }, [sessionId, userId, userName, isConnected]);

  const sendCursorUpdate = useCallback(async (line: number, column: number, file?: string) => {
    // Update our presence with cursor position
    if (presenceRef.current) {
      try {
        await presenceRef.current.track({
          ...presenceRef.current.state,
          cursor: { line, column, file },
          lastSeen: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[SUPABASE REALTIME] Failed to update cursor:', error);
      }
    }

    // Also send as a message for immediate updates
    await sendMessage('cursor_move', {
      cursor: { line, column, file }
    });
  }, [sendMessage]);

  const sendCodeChange = useCallback(async (content: string, file: string, changes: any[]) => {
    await sendMessage('code_change', {
      content,
      file,
      changes,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);

  const sendComment = useCallback(async (content: string, lineNumber?: number, file?: string) => {
    await sendMessage('comment', {
      content,
      lineNumber,
      file,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);

  const sendAnalysis = useCallback(async (results: any, file: string) => {
    await sendMessage('analysis', {
      results,
      file,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);

  const reconnect = useCallback(() => {
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

  // Heartbeat to keep presence updated
  useEffect(() => {
    if (!isConnected || !presenceRef.current) return;

    const heartbeat = setInterval(async () => {
      try {
        await presenceRef.current?.track({
          ...presenceRef.current.state,
          lastSeen: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[SUPABASE REALTIME] Heartbeat failed:', error);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(heartbeat);
  }, [isConnected]);

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
