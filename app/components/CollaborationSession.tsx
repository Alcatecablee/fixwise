'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import type { CollaborationSession as CollabSession, CollaborationParticipant, CollaborationComment } from '../lib/team-collaboration';

interface CollaborationSessionProps {
  sessionId: string;
  className?: string;
}

export default function CollaborationSession({ sessionId, className = '' }: CollaborationSessionProps) {
  const { user, session } = useAuth();
  const [collabSession, setCollabSession] = useState<CollabSession | null>(null);
  const [participants, setParticipants] = useState<CollaborationParticipant[]>([]);
  const [comments, setComments] = useState<CollaborationComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [activeFile, setActiveFile] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const presenceInterval = useRef<NodeJS.Timeout | null>(null);
  const commentsInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user && session && sessionId) {
      loadSession();
      startPresenceTracking();
      startCommentsPolling();
    }

    return () => {
      if (presenceInterval.current) {
        clearInterval(presenceInterval.current);
      }
      if (commentsInterval.current) {
        clearInterval(commentsInterval.current);
      }
    };
  }, [user, session, sessionId]);

  const loadSession = async () => {
    if (!user || !session) return;

    try {
      const response = await fetch(`/api/collaboration/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCollabSession(data.session);
        setParticipants(data.participants || []);
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  };

  const startPresenceTracking = () => {
    if (presenceInterval.current) {
      clearInterval(presenceInterval.current);
    }

    presenceInterval.current = setInterval(async () => {
      if (!user || !session) return;

      try {
        await fetch(`/api/collaboration/sessions/${sessionId}/presence`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'online',
            currentFile: activeFile,
            cursorPosition
          })
        });

        // Update participants list
        const response = await fetch(`/api/collaboration/sessions/${sessionId}/presence`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setParticipants(data.participants || []);
        }
      } catch (error) {
        console.error('Failed to update presence:', error);
      }
    }, 30000); // Update every 30 seconds
  };

  const startCommentsPolling = () => {
    if (commentsInterval.current) {
      clearInterval(commentsInterval.current);
    }

    commentsInterval.current = setInterval(async () => {
      if (!user || !session) return;

      try {
        const response = await fetch(`/api/collaboration/sessions/${sessionId}/comments`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
        }
      } catch (error) {
        console.error('Failed to load comments:', error);
      }
    }, 5000); // Poll every 5 seconds
  };

  const addComment = async () => {
    if (!user || !session || !newComment.trim()) return;

    try {
      const response = await fetch(`/api/collaboration/sessions/${sessionId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newComment.trim(),
          filePath: activeFile,
          lineNumber: cursorPosition.line
        })
      });

      if (response.ok) {
        const { comment } = await response.json();
        setComments(prev => [...prev, comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const resolveComment = async (commentId: string) => {
    if (!user || !session) return;

    try {
      const response = await fetch(`/api/collaboration/sessions/${sessionId}/comments/${commentId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setComments(prev => prev.map(comment => 
          comment.id === commentId ? { ...comment, resolved: true } : comment
        ));
      }
    } catch (error) {
      console.error('Failed to resolve comment:', error);
    }
  };

  const getPresenceStatus = (participant: any) => {
    if (!participant.presence) return 'offline';
    return participant.presence.status;
  };

  const getPresenceColor = (status: string) => {
    switch (status) {
      case 'online': return 'status-active';
      case 'away': return 'status-warning';
      case 'offline': return 'status-inactive';
      default: return 'status-inactive';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className={`loading-state ${className}`}>
        <div className="loading-spinner"></div>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!collabSession) {
    return (
      <div className={`empty-state ${className}`}>
        <p>Session not found or access denied.</p>
      </div>
    );
  }

  return (
    <div className={`collaborate-overview ${className}`}>
      {/* Session Header */}
      <div className="config-header">
        <div className="config-title">
          <h2>{collabSession.name}</h2>
        </div>
        <div className="config-status">
          <span className={`status ${collabSession.is_active ? 'status-active' : 'status-warning'}`}>
            {collabSession.is_active ? 'Active' : 'Inactive'}
          </span>
          <span>{participants.length} participants</span>
        </div>
      </div>

      <div className="config-layout">
        {/* Participants Panel */}
        <div className="control-group">
          <h3>Participants</h3>
          <div className="history-list">
            {participants.map((participant) => (
              <div key={participant.id} className="history-item">
                <div className="history-main">
                  <div className="project-stats">
                    <span className={`status-dot ${getPresenceColor(getPresenceStatus(participant))}`}></span>
                    <span>{participant.user?.full_name || participant.user?.email}</span>
                    <span className="status">{participant.user?.full_name ? 'Editor' : 'Viewer'}</span>
                  </div>
                  {participant.presence?.current_file && (
                    <div className="project-meta">
                      <span>{participant.presence.current_file}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="config-grid">
          {/* File Editor Area */}
          <div className="control-group">
            <h3>Code Editor</h3>
            <div className="form-group">
              <label>File Path</label>
              <input
                type="text"
                value={activeFile}
                onChange={(e) => setActiveFile(e.target.value)}
                placeholder="Enter file path..."
                className="form-input"
              />
            </div>
            <div className="project-meta">
              <span>Line {cursorPosition.line}, Col {cursorPosition.column}</span>
            </div>
            <div className="code-panel">
              <div className="code-content">
                <p>Code editor area - File: {activeFile || 'No file selected'}</p>
              </div>
            </div>
          </div>

          {/* Comments Panel */}
          <div className="control-group">
            <h3>Comments</h3>
            <div className="history-list">
              {comments.map((comment) => (
                <div key={comment.id} className={`history-item ${comment.resolved ? 'status-inactive' : ''}`}>
                  <div className="history-main">
                    <div className="project-stats">
                      <span>{comment.user?.full_name || comment.user?.email}</span>
                      <span className="timestamp">{formatTime(comment.created_at)}</span>
                      {comment.file_path && (
                        <span className="status">{comment.file_path}:{comment.line_number}</span>
                      )}
                    </div>
                    <p>{comment.content}</p>
                  </div>
                  {!comment.resolved && (
                    <div className="project-actions">
                      <button
                        onClick={() => resolveComment(comment.id)}
                        className="btn btn-sm btn-success"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="form-group">
              <label>Add Comment</label>
              <div className="control-options">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                  placeholder="Add a comment..."
                  className="form-input"
                />
                <button
                  onClick={addComment}
                  disabled={!newComment.trim()}
                  className="btn btn-primary"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 