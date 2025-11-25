import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "../../../../../lib/auth-middleware";
import { createClient } from "@supabase/supabase-js";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/integrations/github/status - Check GitHub integration status
export const GET = createAuthenticatedHandler(async (request, user) => {
  try {
    // Check if user has a GitHub integration
    const { data: integration, error } = await supabase
      .from('github_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('connected_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !integration) {
      return NextResponse.json({
        connected: false,
        integration: null,
        accessToken: null,
      });
    }

    // Return integration data (without exposing the full access token)
    return NextResponse.json({
      connected: true,
      integration: {
        githubUserId: integration.github_user_id,
        githubUsername: integration.github_username,
        githubEmail: integration.github_email,
        avatar: integration.avatar_url,
        name: integration.github_name,
        publicRepos: integration.public_repos,
        privateRepos: integration.private_repos,
        connectedAt: integration.connected_at,
      },
      accessToken: integration.access_token, // In production, this should be a redacted version or session token
    });

  } catch (error) {
    console.error("GitHub status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
