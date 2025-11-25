'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { Team, CollaborationSession, TeamMember } from '../lib/team-collaboration';

interface TeamDashboardProps {
  className?: string;
}

export default function TeamDashboard({ className = '' }: TeamDashboardProps) {
  const { user, session } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'teams' | 'sessions'>('teams');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');

  useEffect(() => {
    if (user && session) {
      loadData();
    }
  }, [user, session]);

  const loadData = async () => {
    if (!user || !session) return;
    
    setLoading(true);
    try {
      const [teamsResponse, sessionsResponse] = await Promise.all([
        fetch('/api/collaboration/teams', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/collaboration/sessions?includeParticipants=true', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTeams(teamsData.teams || []);
      }

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    if (!user || !session || !newTeamName.trim()) return;

    try {
      const response = await fetch('/api/collaboration/teams', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newTeamName.trim(),
          description: newTeamDescription.trim()
        })
      });

      if (response.ok) {
        const { team } = await response.json();
        setTeams(prev => [...prev, team]);
        setNewTeamName('');
        setNewTeamDescription('');
        setShowCreateTeam(false);
      }
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const createSession = async () => {
    if (!user || !session || !newSessionName.trim()) return;

    try {
      const response = await fetch('/api/collaboration/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newSessionName.trim(),
          description: newSessionDescription.trim()
        })
      });

      if (response.ok) {
        const { session: newSession } = await response.json();
        setSessions(prev => [...prev, newSession]);
        setNewSessionName('');
        setNewSessionDescription('');
        setShowCreateSession(false);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
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

  if (loading) {
    return (
      <div className={`loading-state ${className}`}>
        <div className="loading-spinner"></div>
        <p>Loading team data...</p>
      </div>
    );
  }

  return (
    <div className={`collaborate-overview ${className}`}>
      <div className="collaborate-actions">
        <button
          onClick={() => setActiveTab('teams')}
          className={`btn ${activeTab === 'teams' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Teams ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`btn ${activeTab === 'sessions' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Sessions ({sessions.length})
        </button>
      </div>

      {activeTab === 'teams' && (
        <div>
          <div className="collaborate-actions">
            <h3>Your Teams</h3>
            <button
              onClick={() => setShowCreateTeam(true)}
              className="btn btn-primary"
            >
              Create Team
            </button>
          </div>

          {teams.length === 0 ? (
            <div className="empty-state">
              <p>No teams yet. Create your first team to start collaborating!</p>
            </div>
          ) : (
            <div className="feature-grid">
              {teams.map((team) => (
                <div key={team.id} className="feature-card">
                  <div className="feature-icon">
                    <span>{team.name[0]}</span>
                  </div>
                  <h4>{team.name}</h4>
                  {team.description && (
                    <p>{team.description}</p>
                  )}
                  <div className="project-meta">
                    <span className="status">
                      {team.members?.length || 0} members
                    </span>
                  </div>
                  <div className="project-actions">
                    {team.members?.slice(0, 3).map((member) => (
                      <div key={member.id} className="project-stats">
                        <span>{member.user?.full_name || member.user?.email}</span>
                        <span className="status">{member.role}</span>
                      </div>
                    ))}
                    {team.members && team.members.length > 3 && (
                      <p>+{team.members.length - 3} more members</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div>
          <div className="collaborate-actions">
            <h3>Active Sessions</h3>
            <button
              onClick={() => setShowCreateSession(true)}
              className="btn btn-success"
            >
              Start Session
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="empty-state">
              <p>No active sessions. Start a collaboration session to work together!</p>
            </div>
          ) : (
            <div className="feature-grid">
              {sessions.map((session) => (
                <div key={session.id} className="feature-card">
                  <div className="feature-icon">
                    <span>{session.name[0]}</span>
                  </div>
                  <h4>{session.name}</h4>
                  <div className="project-meta">
                    <span className={`status ${session.is_active ? 'status-active' : 'status-warning'}`}>
                      {session.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span>{session.participants?.length || 0} participants</span>
                  </div>
                  <div className="project-actions">
                    {session.participants?.slice(0, 3).map((participant) => (
                      <div key={participant.id} className="project-stats">
                        <span className={`status-dot ${getPresenceColor(getPresenceStatus(participant))}`}></span>
                        <span>{participant.user?.full_name || participant.user?.email}</span>
                        <span className="status">{participant.user?.full_name ? 'Editor' : 'Viewer'}</span>
                      </div>
                    ))}
                    {session.participants && session.participants.length > 3 && (
                      <p>+{session.participants.length - 3} more participants</p>
                    )}
                  </div>
                  <button className="btn btn-primary" onClick={() => { window.location.href = `/collaborate?session=${session.id}`; }}>
                    Join Session
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="modal-overlay">
          <div className="feature-card">
            <h3>Create New Team</h3>
            <div className="form-group">
              <label>Team Name</label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="form-input"
                placeholder="Enter team name"
              />
            </div>
            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                className="form-input"
                placeholder="Enter team description"
                rows={3}
              />
            </div>
            <div className="collaborate-actions">
              <button
                onClick={createTeam}
                className="btn btn-primary"
              >
                Create Team
              </button>
              <button
                onClick={() => setShowCreateTeam(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateSession && (
        <div className="modal-overlay">
          <div className="feature-card">
            <h3>Start Collaboration Session</h3>
            <div className="form-group">
              <label>Session Name</label>
              <input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="form-input"
                placeholder="Enter session name"
              />
            </div>
            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                value={newSessionDescription}
                onChange={(e) => setNewSessionDescription(e.target.value)}
                className="form-input"
                placeholder="Enter session description"
                rows={3}
              />
            </div>
            <div className="collaborate-actions">
              <button
                onClick={createSession}
                className="btn btn-success"
              >
                Start Session
              </button>
              <button
                onClick={() => setShowCreateSession(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 