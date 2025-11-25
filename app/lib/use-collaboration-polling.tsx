"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface PollingOptions {
  sessionId?: string;
  userName: string;
  userId?: string;
  role: 'host' | 'participant';
  onMessage?: (message: any) => void;
  onParticipantJoin?: (participant: any) => void;
  onParticipantLeave?: (participant: any) => void;
  onError?: (error: string) => void;
  pollingInterval?: number; // in milliseconds, default 3000
  accessToken?: string;
}

interface Participant {
  id: string;
  user_id: string;
  user_name: string;
  user_color: string;
  is_active: boolean;
  is_host: boolean;
  last_seen_at: string;
}

interface PollingState {
  isConnected: boolean;
  participants: Participant[];
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  error: string | null;
  lastUpdate: Date | null;
}

export function useCollaborationPolling(options: PollingOptions) {
  const {
    sessionId,
    userName,
    userId,
    role,
    onMessage,
    onParticipantJoin,
    onParticipantLeave,
    onError,
    pollingInterval = 3000,
    accessToken,
  } = options;

  const [state, setState] = useState<PollingState>({
    isConnected: false,
    participants: [],
    connectionStatus: 'disconnected',
    error: null,
    lastUpdate: null
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastParticipantsRef = useRef<Participant[]>([]);
  const isPollingRef = useRef(false);

  // Update presence endpoint
  const updatePresence = useCallback(async () => {
    if (!sessionId || !userId) return;

    try {
      await fetch("/api/collaboration/presence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "x-user-name": userName,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          sessionId,
          userId,
          userName,
          isActive: true,
          lastSeenAt: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error("Failed to update presence:", error);
    }
  }, [sessionId, userId, userName, accessToken]);

  // Poll for updates
  const pollForUpdates = useCallback(async () => {
    if (!sessionId || isPollingRef.current) return;

    isPollingRef.current = true;

    try {
      setState(prev => ({ ...prev, connectionStatus: 'connecting' }));

      // Fetch session data including participants
      const [sessionResponse, activityResponse] = await Promise.all([
        fetch(`/api/collaboration/sessions/${sessionId}`, {
          headers: {
            "x-user-id": userId || "anonymous",
            "x-user-name": userName,
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        }),
        fetch(`/api/collaboration/activity?sessionId=${sessionId}&limit=10`, {
          headers: {
            "x-user-id": userId || "anonymous",
            "x-user-name": userName,
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        })
      ]);

      let participants: Participant[] = [];
      let newActivities: any[] = [];

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        participants = sessionData.session?.participants || [];
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        newActivities = activityData.activities || [];
      }

      // Check for participant changes
      const lastParticipants = lastParticipantsRef.current;
      
      // Find joined participants
      const joinedParticipants = participants.filter(p => 
        !lastParticipants.find(lp => lp.user_id === p.user_id)
      );
      
      // Find left participants
      const leftParticipants = lastParticipants.filter(lp => 
        !participants.find(p => p.user_id === lp.user_id)
      );

      // Notify about participant changes
      joinedParticipants.forEach(participant => {
        onParticipantJoin?.(participant);
        onMessage?.({
          type: 'join',
          sessionId,
          userId: participant.user_id,
          userName: participant.user_name,
          timestamp: new Date(),
          data: { participant }
        });
      });

      leftParticipants.forEach(participant => {
        onParticipantLeave?.(participant);
        onMessage?.({
          type: 'leave',
          sessionId,
          userId: participant.user_id,
          userName: participant.user_name,
          timestamp: new Date(),
          data: { participant }
        });
      });

      // Notify about new activities
      newActivities.forEach(activity => {
        onMessage?.({
          type: activity.type,
          sessionId: activity.sessionId,
          userId: activity.userId,
          userName: activity.userName,
          timestamp: new Date(activity.timestamp),
          data: activity
        });
      });

      // Update state
      setState(prev => ({
        ...prev,
        isConnected: true,
        participants,
        connectionStatus: 'connected',
        error: null,
        lastUpdate: new Date()
      }));

      lastParticipantsRef.current = participants;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Polling failed';
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionStatus: 'error',
        error: errorMessage
      }));
      onError?.(errorMessage);
    } finally {
      isPollingRef.current = false;
    }
  }, [sessionId, userId, userName, accessToken, onMessage, onParticipantJoin, onParticipantLeave, onError]);

  // Start polling when sessionId is available
  useEffect(() => {
    if (!sessionId) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionStatus: 'disconnected',
        participants: []
      }));
      return;
    }

    // Initial poll
    pollForUpdates();

    // Set up polling interval
    pollingRef.current = setInterval(pollForUpdates, pollingInterval);

    // Update presence immediately and then every 30 seconds
    updatePresence();
    const presenceInterval = setInterval(updatePresence, 30000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      clearInterval(presenceInterval);
    };
  }, [sessionId, pollForUpdates, updatePresence, pollingInterval]);

  // Send message simulation (for API calls)
  const sendMessage = useCallback(async (type: string, data: any) => {
    if (!sessionId || !userId) return;

    try {
      await fetch("/api/collaboration/operations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "x-user-name": userName,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          type,
          sessionId,
          userId,
          userName,
          data,
          timestamp: new Date().toISOString()
        }),
      });

      // Trigger immediate poll to get updated data
      setTimeout(pollForUpdates, 500);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }, [sessionId, userId, userName, accessToken, pollForUpdates]);

  const sendCursorUpdate = useCallback(async (position: any) => {
    return sendMessage('cursor', { position });
  }, [sendMessage]);

  const sendCodeChange = useCallback(async (changes: any) => {
    return sendMessage('code_change', { changes });
  }, [sendMessage]);

  const sendComment = useCallback(async (comment: any) => {
    return sendMessage('comment', { content: comment });
  }, [sendMessage]);

  const sendAnalysis = useCallback(async (analysis: any) => {
    return sendMessage('analysis', { results: analysis });
  }, [sendMessage]);

  const reconnect = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    setState(prev => ({
      ...prev,
      connectionStatus: 'connecting',
      error: null
    }));

    // Restart polling
    pollForUpdates();
    pollingRef.current = setInterval(pollForUpdates, pollingInterval);
  }, [pollForUpdates, pollingInterval]);

  return {
    isConnected: state.isConnected,
    participants: state.participants,
    connectionStatus: state.connectionStatus,
    error: state.error,
    lastUpdate: state.lastUpdate,
    sendMessage,
    sendCursorUpdate,
    sendCodeChange,
    sendComment,
    sendAnalysis,
    reconnect
  };
}
