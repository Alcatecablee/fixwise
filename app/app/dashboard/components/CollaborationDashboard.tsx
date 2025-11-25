'use client';

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../lib/auth-context";
import { useCollaborationPolling } from "../../../lib/use-collaboration-polling";

interface CollaborationSession {
  id: string;
  name: string;
  document_filename: string;
  document_language: string;
  host_user_id: string;
  created_at: string;
  last_activity: string;
  is_locked: boolean;
  is_public: boolean;
  max_participants: number;
  collaboration_participants?: Array<{
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    user_color: string;
    role: string;
    is_active: boolean;
    last_seen_at: string;
    joined_at: string;
  }>;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  members: Array<{
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    role: "owner" | "admin" | "member";
    status: "online" | "offline" | "away";
    lastSeen: Date;
  }>;
  userRole: string;
}

interface Activity {
  id: string;
  type:
    | "session_created"
    | "session_joined"
    | "session_left"
    | "document_edited"
    | "comment_added"
    | "analysis_run"
    | "session_deleted"
    | "member_invited"
    | "member_joined";
  session_id?: string;
  team_id?: string;
  user_id: string;
  user_name: string;
  timestamp: string;
  details: any;
}

export default function CollaborationDashboard() {
  const { user, session } = useAuth();
  const [activeTab, setActiveTab] = useState<"sessions" | "teams" | "activity">("sessions");
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "locked">("all");
  const [newSessionName, setNewSessionName] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [newLanguage, setNewLanguage] = useState("javascript");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Add activity helper - memoized to prevent infinite loops
  const addActivity = useCallback(async (type: Activity['type'], sessionId?: string, teamId?: string, details?: any) => {
    if (!user?.id) return;

    try {
      await fetch("/api/collaboration/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
          "x-user-name": user.firstName || user.email || "Anonymous",
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
        body: JSON.stringify({
          type,
          sessionId,
          teamId,
          details: typeof details === 'string' ? { message: details } : details
        }),
      });

      // Don't refresh activities here to avoid infinite loops
      // Activities will be refreshed when user switches to activity tab
    } catch (error) {
      console.error("Failed to add activity:", error);
    }
  }, [user?.id, session?.access_token, user?.firstName, user?.email]);

  // Handle polling messages - memoized to prevent infinite loops
  const handlePollingMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'join':
        if (message.data?.participants) {
          setSessions(prev => prev.map(session => {
            if (session.id === message.sessionId) {
              return {
                ...session,
                collaboration_participants: message.data.participants
              };
            }
            return session;
          }));
        }
        break;
      case 'analysis':
        addActivity('analysis_run', message.sessionId, undefined,
          `Analysis completed with ${message.data?.results?.detectedIssues?.length || 0} issues found`);
        break;
      case 'comment':
        addActivity('comment_added', message.sessionId, undefined,
          message.data?.content || 'Comment added');
        break;
    }
  }, [addActivity]);

  // Memoize callbacks for useCollaborationPolling
  const onParticipantJoin = useCallback((participant: any) => {
    addActivity('session_joined', selectedSessionId || undefined, undefined, 'Joined the collaboration session');
  }, [addActivity, selectedSessionId]);

  const onParticipantLeave = useCallback((participant: any) => {
    addActivity('session_left', selectedSessionId || undefined, undefined, 'Left the collaboration session');
  }, [addActivity, selectedSessionId]);

  const onError = useCallback((error: any) => {
    setError(`Connection error: ${error}`);
  }, []);

  // Initialize Supabase Realtime connection for selected session
  const {
    isConnected,
    participants,
    sendMessage,
    connectionStatus,
    error: realtimeError,
    reconnect,
    lastUpdate
  } = useCollaborationPolling({
    sessionId: selectedSessionId || undefined,
    userName: user?.firstName || user?.email || "Anonymous",
    userId: user?.id || undefined,
    role: 'participant',
    pollingInterval: 5000,
    onMessage: handlePollingMessage,
    onParticipantJoin,
    onParticipantLeave,
    onError,
    accessToken: session?.access_token,
  });

  const loadSessions = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch("/api/collaboration/sessions?includeParticipants=true", {
        headers: {
          "x-user-id": user.id,
          "x-user-name": user.firstName || user.email || "Anonymous",
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(`Failed to load sessions: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to load sessions: ${response.status} ${response.statusText}`);
      }

      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Failed to load sessions:", error);
      throw error;
    }
  }, [user?.id, user?.firstName, user?.email, session?.access_token]);

  const loadTeams = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch("/api/collaboration/teams", {
        headers: {
          "x-user-id": user.id,
          "x-user-name": user.firstName || user.email || "Anonymous",
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(`Failed to load teams: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to load teams: ${response.status} ${response.statusText}`);
      }
      setTeams(data.teams || []);
    } catch (error) {
      console.error("Failed to load teams:", error);
      throw error;
    }
  }, [user?.id, user?.firstName, user?.email, session?.access_token]);

  const loadActivity = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch("/api/collaboration/activity", {
        headers: {
          "x-user-id": user.id,
          "x-user-name": user.firstName || user.email || "Anonymous",
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(`Failed to load activity: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to load activity: ${response.status} ${response.statusText}`);
      }
      setActivities(data.activities || []);
    } catch (error) {
      console.error("Failed to load activity:", error);
      throw error;
    }
  }, [user?.id, user?.firstName, user?.email, session?.access_token]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadSessions(),
        loadTeams(),
        loadActivity(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [loadSessions, loadTeams, loadActivity]);

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id, loadDashboardData]);

  // Refresh activity when switching to activity tab
  useEffect(() => {
    if (activeTab === "activity" && user?.id) {
      loadActivity();
    }
  }, [activeTab, user?.id, loadActivity]);

  const createSession = async () => {
    if (!newSessionName.trim() || !newFileName.trim()) {
      setError("Session name and filename are required");
      return;
    }

    if (!user?.id) {
      setError("Authentication required");
      return;
    }

    try {
      const response = await fetch("/api/collaboration/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
          "x-user-name": user.firstName || user.email || "Anonymous",
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
        body: JSON.stringify({
          name: newSessionName,
          documentFilename: newFileName,
          documentLanguage: newLanguage,
          isPublic: false,
          documentContent: "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to create session: ${response.status}`);
      }
      setSessions(prev => [data.session, ...prev]);
      setNewSessionName("");
      setNewFileName("");
      setNewLanguage("javascript");
      setIsCreateModalOpen(false);
      setSelectedSessionId(data.session.id);

      // Add activity for session creation
      await addActivity('session_created', data.session.id, undefined, `Created session for ${newSessionName}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create session");
    }
  };

  const joinSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    
    if (user?.id) {
      sendMessage('join', {
        sessionId,
        timestamp: new Date()
      });
      
      await addActivity('session_joined', sessionId, undefined, 'Joined the collaboration session');
    }
  };

  const leaveSession = async () => {
    if (selectedSessionId && user?.id) {
      sendMessage('leave', {
        sessionId: selectedSessionId,
        timestamp: new Date()
      });
      
      await addActivity('session_left', selectedSessionId, undefined, 'Left the collaboration session');
    }
    setSelectedSessionId(null);
  };

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = (session.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (session.document_filename || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "active" && !session.is_locked) ||
                         (statusFilter === "locked" && session.is_locked);
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{
          width: "32px",
          height: "32px",
          border: "2px solid #000000",
          borderTop: "2px solid #ffffff",
          borderRadius: "50%",
          margin: "0 auto 1rem",
          animation: "spin 1s linear infinite"
        }}></div>
        <p>Loading collaboration dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Please log in to access collaboration features.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "0", display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ color: "#ffffff", fontSize: "2rem", fontWeight: "700", margin: "0 0 0.5rem 0" }}>
            Collaboration Dashboard
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.7)", margin: "0", fontSize: "1rem" }}>
            Real-time collaborative code analysis and debugging
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.7)" }}>
            Status: {connectionStatus === 'connected' ? 'Connected' :
                     connectionStatus === 'connecting' ? 'Connecting...' :
                     connectionStatus === 'disconnected' ? 'Disconnected' : 'Error'}
            {lastUpdate && ` • Last update: ${lastUpdate.toLocaleTimeString()}`}
          </div>
          {selectedSessionId && (
            <button 
              onClick={leaveSession}
              style={{
                padding: "0.5rem 1rem",
                background: "rgba(255, 255, 255, 0.1)",
                border: "2px solid #000000",
                borderRadius: "6px",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "0.875rem"
              }}
            >
              Leave Session
            </button>
          )}
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div style={{
          background: "rgba(244, 67, 54, 0.1)",
          border: "1px solid rgba(244, 67, 54, 0.3)",
          borderRadius: "6px",
          padding: "1rem",
          color: "#e53e3e",
          marginBottom: "1rem"
        }}>
          <div style={{ marginBottom: "0" }}>
            Error: {error}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "1rem" }}>
            <button
              onClick={() => setError(null)}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid #ffffff",
                borderRadius: "4px",
                color: "#ffffff",
                cursor: "pointer",
                padding: "0.25rem 0.5rem",
                fontSize: "0.8rem"
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {realtimeError && (
        <div style={{
          background: "rgba(244, 67, 54, 0.1)",
          border: "1px solid rgba(244, 67, 54, 0.3)",
          borderRadius: "6px",
          padding: "1rem",
          color: "#e53e3e",
          marginBottom: "1rem"
        }}>
          Connection Error: {realtimeError}
          <button 
            onClick={reconnect}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid #ffffff",
              borderRadius: "4px",
              color: "#ffffff",
              cursor: "pointer",
              padding: "0.25rem 0.5rem",
              fontSize: "0.8rem",
              marginLeft: "1rem"
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        display: "flex", 
        gap: "0.5rem", 
        background: "rgba(255, 255, 255, 0.05)", 
        border: "2px solid #000000", 
        borderRadius: "8px", 
        padding: "4px"
      }}>
        {[
          { id: "sessions", label: "Sessions", count: sessions.length },
          { id: "teams", label: "Teams", count: teams.length },
          { id: "activity", label: "Activity", count: activities.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "0.75rem 1rem",
              background: activeTab === tab.id ? "rgba(255, 255, 255, 0.1)" : "transparent",
              border: "none",
              borderRadius: "6px",
              color: activeTab === tab.id ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500"
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        background: "rgba(255, 255, 255, 0.05)",
        border: "2px solid #000000",
        borderRadius: "12px",
        padding: "2rem"
      }}>
        {activeTab === "sessions" && (
          <div>
            {/* Controls */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: "1",
                  minWidth: "200px",
                  padding: "0.75rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "2px solid #000000",
                  borderRadius: "6px",
                  color: "#ffffff",
                  fontSize: "0.875rem"
                }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  padding: "0.75rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "2px solid #000000",
                  borderRadius: "6px",
                  color: "#ffffff",
                  fontSize: "0.875rem"
                }}
              >
                <option value="all">All Sessions</option>
                <option value="active">Active</option>
                <option value="locked">Locked</option>
              </select>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "2px solid #000000",
                  borderRadius: "6px",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "500"
                }}
              >
                Create Session
              </button>
            </div>

            {/* Sessions Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1rem" }}>
              {filteredSessions.map(session => {
                const currentParticipants = session.id === selectedSessionId ? (participants || []) : (session.collaboration_participants || []);
                return (
                  <div 
                    key={session.id} 
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: session.id === selectedSessionId ? "2px solid #ffffff" : "2px solid #000000",
                      borderRadius: "8px",
                      padding: "1.5rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                      <h3 style={{ color: "#ffffff", fontSize: "1.1rem", margin: "0" }}>{session.name}</h3>
                      <span style={{
                        padding: "0.25rem 0.5rem",
                        background: session.is_locked ? "rgba(244, 67, 54, 0.2)" : "rgba(76, 175, 80, 0.2)",
                        color: session.is_locked ? "#e53e3e" : "#4caf50",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: "500"
                      }}>
                        {session.is_locked ? "Locked" : "Active"}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: "1rem", fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.7)" }}>
                      <div>{session.document_filename}</div>
                      <div>{session.document_language}</div>
                      {session.is_public && <div style={{ color: "#4caf50" }}>Public Session</div>}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                      {currentParticipants.map(participant => (
                        <div
                          key={participant.id}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "2px solid #000000",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            fontSize: "0.75rem",
                            fontWeight: "600"
                          }}
                          title={`${participant.user_name} (${(participant as any).role || 'participant'})`}
                        >
                          {participant.user_name.charAt(0)}
                        </div>
                      ))}
                      <span style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.6)" }}>
                        {currentParticipants.length} / {session.max_participants} participants
                      </span>
                    </div>

                    <button
                      onClick={() => joinSession(session.id)}
                      disabled={session.id === selectedSessionId}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: session.id === selectedSessionId ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.1)",
                        border: "2px solid #000000",
                        borderRadius: "6px",
                        color: "#ffffff",
                        cursor: session.id === selectedSessionId ? "not-allowed" : "pointer",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        opacity: session.id === selectedSessionId ? 0.5 : 1
                      }}
                    >
                      {session.id === selectedSessionId ? "Joined" : "Join"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "teams" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {teams.map(team => (
              <div key={team.id} style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "2px solid #000000",
                borderRadius: "8px",
                padding: "1.5rem"
              }}>
                <h3 style={{ color: "#ffffff", fontSize: "1.1rem", margin: "0 0 0.5rem 0" }}>{team.name}</h3>
                <p style={{ color: "rgba(255, 255, 255, 0.7)", margin: "0 0 1rem 0", fontSize: "0.875rem" }}>
                  {team.description || "No description"}
                </p>
                <div style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.6)", marginBottom: "1rem" }}>
                  <div>{team.members.length} members</div>
                  <div>Your role: {team.userRole}</div>
                  <div>Created: {new Date(team.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {team.members.slice(0, 5).map(member => (
                    <div
                      key={member.id}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid #000000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        fontSize: "0.6rem",
                        fontWeight: "600"
                      }}
                      title={`${member.user_name || member.user_email || 'User'} (${member.role || ''})`}
                    >
                      {String(member.user_name || member.user_email || 'U').charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {team.members.length > 5 && (
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid #000000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255, 255, 255, 0.6)",
                      fontSize: "0.6rem"
                    }}>
                      +{team.members.length - 5}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "activity" && (
          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            {activities.map(activity => (
              <div key={activity.id} style={{
                display: "flex",
                gap: "1rem",
                padding: "1rem 0",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
              }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "2px solid #000000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  flexShrink: 0
                }}>
                  {activity.user_name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                    <strong>{activity.user_name}</strong> {activity.details?.message || activity.type.replace('_', ' ')}
                  </div>
                  <div style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.75rem" }}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255, 255, 255, 0.6)" }}>
                No activity yet. Join a session or create a team to get started.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {isCreateModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000
        }}>
          <div style={{
            background: "rgba(30, 30, 30, 0.95)",
            border: "2px solid #000000",
            borderRadius: "12px",
            padding: "2rem",
            maxWidth: "500px",
            width: "90vw"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h3 style={{ color: "#ffffff", margin: "0", fontSize: "1.25rem" }}>Create New Session</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.6)",
                  cursor: "pointer",
                  fontSize: "1.5rem"
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", color: "rgba(255, 255, 255, 0.9)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  Session Name
                </label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Enter session name"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "2px solid #000000",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", color: "rgba(255, 255, 255, 0.9)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  File Name
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="component.tsx"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "2px solid #000000",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", color: "rgba(255, 255, 255, 0.9)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  Language
                </label>
                <select
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "2px solid #000000",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    boxSizing: "border-box"
                  }}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="react">React (JSX)</option>
                  <option value="tsx">React (TSX)</option>
                </select>
              </div>
              
              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid #000000",
                    borderRadius: "6px",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "0.875rem"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={createSession}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid #000000",
                    borderRadius: "6px",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "500"
                  }}
                >
                  Create Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
