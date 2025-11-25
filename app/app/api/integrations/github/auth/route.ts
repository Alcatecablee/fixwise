import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "../../../../../lib/auth-middleware";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI =
  process.env.GITHUB_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/github/callback`;

// GET /api/integrations/github/auth - Initiate GitHub OAuth
export const GET = createAuthenticatedHandler(async (request, user) => {
  if (!GITHUB_CLIENT_ID) {
    return NextResponse.json(
      { error: "GitHub integration not configured" },
      { status: 500 },
    );
  }

  const state = `${user.id}-${Date.now()}`;
  const scope = "repo,user:email,read:org"; // repo scope allows repository access for scanning

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
  githubAuthUrl.searchParams.set("redirect_uri", GITHUB_REDIRECT_URI);
  githubAuthUrl.searchParams.set("scope", scope);
  githubAuthUrl.searchParams.set("state", state);
  githubAuthUrl.searchParams.set("allow_signup", "false");

  // Store state in session/database for validation
  // For now, we'll include it in the redirect for simplicity

  return NextResponse.json({
    authUrl: githubAuthUrl.toString(),
    state,
  });
});

// POST /api/integrations/github/auth - Exchange code for access token
export const POST = createAuthenticatedHandler(async (request, user) => {
  try {
    const { code, state } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code required" },
        { status: 400 },
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "NeuroLint-Pro/1.0",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: GITHUB_REDIRECT_URI,
        }),
      },
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.json(
        {
          error: tokenData.error_description || "Failed to obtain access token",
        },
        { status: 400 },
      );
    }

    // Get GitHub user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "NeuroLint-Pro/1.0",
      },
    });

    const githubUser = await userResponse.json();

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch GitHub user data" },
        { status: 400 },
      );
    }

    // Store GitHub integration data
    // In a real app, you'd save this to your database
    const integrationData = {
      userId: user.id,
      githubUserId: githubUser.id,
      githubUsername: githubUser.login,
      githubEmail: githubUser.email,
      accessToken: tokenData.access_token, // Encrypt this in production
      scope: tokenData.scope,
      connectedAt: new Date().toISOString(),
      avatar: githubUser.avatar_url,
      name: githubUser.name,
      publicRepos: githubUser.public_repos,
      privateRepos: githubUser.total_private_repos || 0,
    };

    return NextResponse.json({
      success: true,
      integration: {
        ...integrationData,
        accessToken: undefined, // Don't return the token
      },
    });
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
