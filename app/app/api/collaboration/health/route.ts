import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "../../../../lib/data-store";

export async function GET(request: NextRequest) {
  try {
    // Basic health check for collaboration system
    const sessionCount = dataStore.collaborationSessions?.size || 0;
    const participantCount = dataStore.collaborationParticipants?.size || 0;
    const commentCount = dataStore.collaborationComments?.size || 0;
    const analysisCount = dataStore.collaborationAnalysis?.size || 0;

    // Count active sessions (not expired)
    let activeSessions = 0;
    let activeParticipants = 0;

    if (dataStore.collaborationSessions) {
      for (const session of dataStore.collaborationSessions.values()) {
        if (new Date(session.expires_at) > new Date()) {
          activeSessions++;
        }
      }
    }

    if (dataStore.collaborationParticipants) {
      for (const participant of dataStore.collaborationParticipants.values()) {
        if (participant.is_active) {
          activeParticipants++;
        }
      }
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      stats: {
        totalSessions: sessionCount,
        activeSessions,
        totalParticipants: participantCount,
        activeParticipants,
        totalComments: commentCount,
        totalAnalyses: analysisCount,
      },
      version: "1.0.0",
      features: [
        "real-time-collaboration",
        "neurolint-integration",
        "session-management",
        "chat-comments",
        "analysis-sharing",
      ],
    });
  } catch (error) {
    console.error("Collaboration health check error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
