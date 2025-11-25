import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// GET /api/integrations/github/callback - Handle GitHub OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard?error=missing_code_or_state', request.url)
      );
    }

    // Extract user ID from state
    // State format is: ${userId}-${timestamp}
    // Since UUIDs contain hyphens, we need to find the last hyphen and extract everything before it
    const lastHyphenIndex = state.lastIndexOf('-');
    if (lastHyphenIndex === -1) {
      return NextResponse.redirect(
        new URL('/dashboard?error=invalid_state', request.url)
      );
    }

    const userId = state.substring(0, lastHyphenIndex);
    if (!userId || userId.length < 36) { // UUID should be at least 36 characters
      return NextResponse.redirect(
        new URL('/dashboard?error=invalid_state', request.url)
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
        }),
      },
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent(tokenData.error_description)}`, request.url)
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
      return NextResponse.redirect(
        new URL('/dashboard?error=github_user_fetch_failed', request.url)
      );
    }

    // Store GitHub integration in database
    const { error: dbError } = await supabase
      .from('github_integrations')
      .upsert({
        user_id: userId,
        github_user_id: githubUser.id,
        github_username: githubUser.login,
        github_email: githubUser.email,
        github_name: githubUser.name,
        avatar_url: githubUser.avatar_url,
        access_token: tokenData.access_token, // Should be encrypted in production
        scope: tokenData.scope,
        public_repos: githubUser.public_repos || 0,
        private_repos: githubUser.total_private_repos || 0,
        connected_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
        is_active: true,
      }, {
        onConflict: 'user_id,github_user_id'
      });

    if (dbError) {
      console.error('Failed to store GitHub integration:', {
        error: dbError,
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        userId: userId,
        githubUserId: githubUser.id,
        githubUsername: githubUser.login
      });

      // Add more specific error messaging
      let errorParam = 'database_error';
      if (dbError.code === 'PGRST116') {
        errorParam = 'table_not_found';
      } else if (dbError.code === '23505') {
        errorParam = 'duplicate_integration';
      } else if (dbError.message?.includes('RLS')) {
        errorParam = 'permission_denied';
      }

      return NextResponse.redirect(
        new URL(`/dashboard?error=${errorParam}&details=${encodeURIComponent(dbError.message || '')}`, request.url)
      );
    }

    // Redirect to dashboard with success
    return NextResponse.redirect(
      new URL('/dashboard?github_connected=true', request.url)
    );

  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    return NextResponse.redirect(
      new URL('/dashboard?error=callback_error', request.url)
    );
  }
}
