import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// In-memory storage (same as teams route)
const teams = new Map();
const teamMembers = new Map();
const invitations = new Map();

interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: "admin" | "member" | "viewer";
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "declined" | "expired";
  token: string;
}

interface TeamMember {
  userId: string;
  teamId: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: string;
  permissions: string[];
  isActive: boolean;
}

const generateInviteToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

const getRolePermissions = (role: string): string[] => {
  switch (role) {
    case "owner":
      return ["*"];
    case "admin":
      return [
        "projects.*",
        "members.*",
        "settings.read",
        "settings.write",
        "analytics.*",
      ];
    case "member":
      return ["projects.read", "projects.write", "analytics.read"];
    case "viewer":
      return ["projects.read", "analytics.read"];
    default:
      return ["projects.read"];
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } },
) {
  try {
    const { teamId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "demo-user";

    const team = teams.get(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user has permission to view invitations
    const members = teamMembers.get(teamId) || [];
    const userMember = members.find(
      (m: TeamMember) => m.userId === userId && m.isActive,
    );

    if (
      !userMember ||
      (userMember.role !== "owner" && userMember.role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Get all invitations for this team
    const teamInvitations = Array.from(invitations.values())
      .filter((invite: TeamInvitation) => invite.teamId === teamId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return NextResponse.json({
      invitations: teamInvitations,
      total: teamInvitations.length,
    });
  } catch (error) {
    console.error("Team invitations GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } },
) {
  try {
    const { teamId } = params;
    const body = await request.json();
    const { email, role = "member", userId = "demo-user" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!["admin", "member", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const team = teams.get(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user has permission to invite members
    const members = teamMembers.get(teamId) || [];
    const userMember = members.find(
      (m: TeamMember) => m.userId === userId && m.isActive,
    );

    if (!userMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check permissions based on team settings
    const canInvite =
      userMember.role === "owner" ||
      userMember.role === "admin" ||
      (team.settings.allowMemberInvites && userMember.role === "member");

    if (!canInvite) {
      return NextResponse.json(
        { error: "Insufficient permissions to invite members" },
        { status: 403 },
      );
    }

    // Check if email is already a member
    const existingMember = members.find(
      (m: TeamMember) => m.userId === email && m.isActive,
    );
    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 400 },
      );
    }

    // Check if there's already a pending invitation for this email
    const existingInvite = Array.from(invitations.values()).find(
      (invite: TeamInvitation) =>
        invite.teamId === teamId &&
        invite.email === email &&
        invite.status === "pending",
    );

    if (existingInvite) {
      return NextResponse.json(
        { error: "Invitation already sent to this email" },
        { status: 400 },
      );
    }

    const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const token = generateInviteToken();
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString(); // 7 days

    const invitation: TeamInvitation = {
      id: inviteId,
      teamId,
      email,
      role,
      invitedBy: userId,
      createdAt: new Date().toISOString(),
      expiresAt,
      status: "pending",
      token,
    };

    invitations.set(inviteId, invitation);

    // In a real app, you would send an email here
    console.log(`Invitation sent to ${email} for team ${team.name}`);
    console.log(`Invitation link: /invite/${token}`);

    return NextResponse.json(
      {
        invitation: {
          ...invitation,
          inviteLink: `/invite/${token}`, // Include invite link in response
        },
        message: "Invitation sent successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Team invitations POST error:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string } },
) {
  try {
    const { teamId } = params;
    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get("inviteId");
    const userId = searchParams.get("userId") || "demo-user";

    if (!inviteId) {
      return NextResponse.json(
        { error: "Invitation ID is required" },
        { status: 400 },
      );
    }

    const team = teams.get(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const invitation = invitations.get(inviteId);
    if (!invitation || invitation.teamId !== teamId) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    // Check permissions
    const members = teamMembers.get(teamId) || [];
    const userMember = members.find(
      (m: TeamMember) => m.userId === userId && m.isActive,
    );

    if (
      !userMember ||
      (userMember.role !== "owner" && userMember.role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    invitations.delete(inviteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team invitations DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to cancel invitation" },
      { status: 500 },
    );
  }
}

// Accept invitation endpoint
export async function PATCH(
  request: NextRequest,
  { params }: { params: { teamId: string } },
) {
  try {
    const { teamId } = params;
    const body = await request.json();
    const { inviteId, action, userId = "demo-user" } = body;

    if (!inviteId || !action) {
      return NextResponse.json(
        { error: "Invitation ID and action are required" },
        { status: 400 },
      );
    }

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const invitation = invitations.get(inviteId);
    if (!invitation || invitation.teamId !== teamId) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Invitation is no longer pending" },
        { status: 400 },
      );
    }

    // Check if invitation has expired
    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = "expired";
      invitations.set(inviteId, invitation);
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 },
      );
    }

    if (action === "accept") {
      // Add user to team
      const members = teamMembers.get(teamId) || [];

      const newMember: TeamMember = {
        userId,
        teamId,
        role: invitation.role as any,
        joinedAt: new Date().toISOString(),
        permissions: getRolePermissions(invitation.role),
        isActive: true,
      };

      members.push(newMember);
      teamMembers.set(teamId, members);

      // Update team stats
      const team = teams.get(teamId);
      if (team) {
        team.stats.memberCount = members.filter((m: any) => m.isActive).length;
        teams.set(teamId, team);
      }

      invitation.status = "accepted";
    } else {
      invitation.status = "declined";
    }

    invitations.set(inviteId, invitation);

    return NextResponse.json({
      invitation,
      message:
        action === "accept" ? "Invitation accepted" : "Invitation declined",
    });
  } catch (error) {
    console.error("Team invitations PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to process invitation" },
      { status: 500 },
    );
  }
}
