import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "../../../../lib/data-store";

export async function GET(request: NextRequest) {
  console.log("[DEBUG] Session count:", dataStore.collaborationSessions.size);
  console.log(
    "[DEBUG] Available sessions:",
    Array.from(dataStore.collaborationSessions.keys()),
  );
  console.log(
    "[DEBUG] Participant count:",
    dataStore.collaborationParticipants.size,
  );
  console.log(
    "[DEBUG] Available participants:",
    Array.from(dataStore.collaborationParticipants.keys()),
  );

  return NextResponse.json({
    sessionCount: dataStore.collaborationSessions.size,
    sessions: Array.from(dataStore.collaborationSessions.keys()),
    participantCount: dataStore.collaborationParticipants.size,
    participants: Array.from(dataStore.collaborationParticipants.keys()),
    dataStoreType: typeof dataStore,
  });
}

export async function POST(request: NextRequest) {
  // Force create a test session to check persistence
  const testSessionId = "test_session_" + Date.now();
  const testSession = {
    id: testSessionId,
    name: "Test Session",
    document_content: "console.log('test');",
    created_at: new Date().toISOString(),
  };

  dataStore.collaborationSessions.set(testSessionId, testSession);

  console.log("[DEBUG POST] Created test session:", testSessionId);
  console.log(
    "[DEBUG POST] Total sessions:",
    dataStore.collaborationSessions.size,
  );

  return NextResponse.json({
    message: "Test session created",
    sessionId: testSessionId,
    totalSessions: dataStore.collaborationSessions.size,
  });
}
