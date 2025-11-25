import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "../../../../lib/data-store";

interface PresenceInfo {
  userId: string;
  userName: string;
  userColor: string;
  sessionId?: string;
  status: "online" | "away" | "offline";
  lastSeen: string;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

// In-memory presence store (would use Redis or similar in production)
const presenceStore = new Map<string, PresenceInfo>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    let presenceData: PresenceInfo[] = [];

    if (sessionId) {
      // Get presence for specific session
      for (const presence of presenceStore.values()) {
        if (presence.sessionId === sessionId && presence.status !== "offline") {
          presenceData.push(presence);
        }
      }
    } else {
      // Get all online users
      for (const presence of presenceStore.values()) {
        if (presence.status !== "offline") {
          presenceData.push(presence);
        }
      }
    }

    // Clean up stale presence (older than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    for (const [key, presence] of presenceStore.entries()) {
      if (new Date(presence.lastSeen) < fiveMinutesAgo) {
        presenceStore.delete(key);
      }
    }

    return NextResponse.json({ presence: presenceData });
  } catch (error) {
    console.error("Presence API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, status, cursor, selection } = body;
    const userId = request.headers.get("x-user-id");
    const userName = request.headers.get("x-user-name") || "Anonymous";

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Generate consistent color for user
    const userColor = generateUserColor(userId);

    const presenceKey = sessionId ? `${sessionId}_${userId}` : userId;
    const presence: PresenceInfo = {
      userId,
      userName,
      userColor,
      sessionId,
      status: status || "online",
      lastSeen: new Date().toISOString(),
      cursor,
      selection,
    };

    presenceStore.set(presenceKey, presence);

    // Broadcast presence update to other participants
    const otherParticipants: PresenceInfo[] = [];
    if (sessionId) {
      for (const [key, p] of presenceStore.entries()) {
        if (
          key.startsWith(`${sessionId}_`) &&
          p.userId !== userId &&
          p.status !== "offline"
        ) {
          otherParticipants.push(p);
        }
      }
    }

    return NextResponse.json({
      presence,
      otherParticipants,
    });
  } catch (error) {
    console.error("Presence update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const presenceKey = sessionId ? `${sessionId}_${userId}` : userId;

    // Mark as offline instead of deleting
    const presence = presenceStore.get(presenceKey);
    if (presence) {
      presence.status = "offline";
      presence.lastSeen = new Date().toISOString();
      presenceStore.set(presenceKey, presence);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Presence deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function generateUserColor(userId: string): string {
  const colors = [
    "#2196f3",
    "#4caf50",
    "#ff9800",
    "#e91e63",
    "#9c27b0",
    "#00bcd4",
    "#ff5722",
    "#795548",
    "#607d8b",
    "#f44336",
    "#cddc39",
    "#ffc107",
  ];

  const hash = userId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}
