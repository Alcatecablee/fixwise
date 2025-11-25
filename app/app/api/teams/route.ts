import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// In-memory storage for demo purposes
const teams = new Map();
const teamMembers = new Map();
const teamProjects = new Map();
const invitations = new Map();

interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: string;
  updatedAt: string;
  settings: {
    allowMemberInvites: boolean;
    requireApproval: boolean;
    defaultRole: "viewer" | "member" | "admin";
  };
  stats: {
    memberCount: number;
    projectCount: number;
    totalAnalyses: number;
  };
}

interface TeamMember {
  userId: string;
  teamId: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: string;
  permissions: string[];
  isActive: boolean;
}

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

const generateInviteToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "demo-user";
    const teamId = searchParams.get("teamId");

    if (teamId) {
      // Get specific team
      const team = teams.get(teamId);
      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      // Check if user is a member
      const members = teamMembers.get(teamId) || [];
      const userMember = members.find(
        (m: TeamMember) => m.userId === userId && m.isActive,
      );

      if (!userMember) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Get team members with user info
      const teamMembersList = members.filter((m: TeamMember) => m.isActive);
      const projects = teamProjects.get(teamId) || [];

      return NextResponse.json({
        team,
        members: teamMembersList,
        projects,
        userRole: userMember.role,
        userPermissions: userMember.permissions,
      });
    }

    // Get all teams where user is a member
    const userTeams = [];

    for (const [tId, members] of teamMembers.entries()) {
      const userMember = members.find(
        (m: TeamMember) => m.userId === userId && m.isActive,
      );
      if (userMember) {
        const team = teams.get(tId);
        if (team) {
          userTeams.push({
            ...team,
            userRole: userMember.role,
            memberCount: members.filter((m: TeamMember) => m.isActive).length,
          });
        }
      }
    }

    return NextResponse.json({
      teams: userTeams,
      total: userTeams.length,
    });
  } catch (error) {
    console.error("Teams GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description = "",
      plan = "free",
      userId = "demo-user",
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 },
      );
    }

    const teamId = `team_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    const team: Team = {
      id: teamId,
      name,
      description,
      ownerId: userId,
      plan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        allowMemberInvites: true,
        requireApproval: false,
        defaultRole: "member",
      },
      stats: {
        memberCount: 1,
        projectCount: 0,
        totalAnalyses: 0,
      },
    };

    teams.set(teamId, team);

    // Add owner as first member
    const ownerMember: TeamMember = {
      userId,
      teamId,
      role: "owner",
      joinedAt: new Date().toISOString(),
      permissions: ["*"], // All permissions
      isActive: true,
    };

    teamMembers.set(teamId, [ownerMember]);
    teamProjects.set(teamId, []);

    return NextResponse.json(
      {
        team,
        member: ownerMember,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Teams POST error:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, updates, userId = "demo-user" } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 },
      );
    }

    const team = teams.get(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user has admin permissions
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

    const updatedTeam = {
      ...team,
      ...updates,
      // Prevent updating sensitive fields
      id: team.id,
      ownerId: team.ownerId,
      createdAt: team.createdAt,
      updatedAt: new Date().toISOString(),
    };

    teams.set(teamId, updatedTeam);

    return NextResponse.json({ team: updatedTeam });
  } catch (error) {
    console.error("Teams PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");
    const userId = searchParams.get("userId") || "demo-user";

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 },
      );
    }

    const team = teams.get(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Only team owner can delete the team
    if (team.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only team owner can delete the team" },
        { status: 403 },
      );
    }

    teams.delete(teamId);
    teamMembers.delete(teamId);
    teamProjects.delete(teamId);

    // Delete associated invitations
    for (const [inviteId, invite] of invitations.entries()) {
      if ((invite as TeamInvitation).teamId === teamId) {
        invitations.delete(inviteId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Teams DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 },
    );
  }
}
