import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const { provider, redirectTo } = await request.json();

    // Validate provider
    const supportedProviders = ['google', 'github', 'microsoft', 'discord'];
    if (!provider || !supportedProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Unsupported provider. Supported providers: ${supportedProviders.join(', ')}` },
        { status: 400 }
      );
    }

    // Set up redirect URL - use callback page to handle OAuth response
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/auth/callback`;

    // Initiate OAuth flow
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error(`${provider} OAuth error:`, error);
      return NextResponse.json(
        { error: `Failed to initiate ${provider} login` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: data.url,
      provider,
    });

  } catch (error) {
    console.error("OAuth API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle OAuth callback
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    if (error) {
      console.error('OAuth callback error:', error, errorDescription);
      
      // Redirect to login with error
      const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_SITE_URL);
      loginUrl.searchParams.set('error', error);
      loginUrl.searchParams.set('message', errorDescription || 'OAuth authentication failed');
      
      return NextResponse.redirect(loginUrl.toString());
    }

    if (!code) {
      return NextResponse.json(
        { error: "No authorization code provided" },
        { status: 400 }
      );
    }

    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('OAuth code exchange error:', exchangeError);
      
      const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_SITE_URL);
      loginUrl.searchParams.set('error', 'oauth_exchange_failed');
      loginUrl.searchParams.set('message', 'Failed to complete OAuth authentication');
      
      return NextResponse.redirect(loginUrl.toString());
    }

    if (!data.session) {
      const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_SITE_URL);
      loginUrl.searchParams.set('error', 'no_session');
      loginUrl.searchParams.set('message', 'No session created from OAuth');
      
      return NextResponse.redirect(loginUrl.toString());
    }

    // Create or update user profile
    try {
      const user = data.session.user;
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          first_name: user.user_metadata.full_name?.split(' ')[0] || '',
          last_name: user.user_metadata.full_name?.split(' ').slice(1).join(' ') || '',
          avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture,
          provider: user.app_metadata.provider,
          email_confirmed: user.email_confirmed_at !== null,
          plan: 'free',
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail OAuth if profile creation fails
      }
    } catch (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail OAuth if profile creation fails
    }

    // Successful OAuth - redirect to dashboard
    const dashboardUrl = new URL('/dashboard', process.env.NEXT_PUBLIC_SITE_URL);
    dashboardUrl.searchParams.set('oauth', 'success');
    
    return NextResponse.redirect(dashboardUrl.toString());

  } catch (error) {
    console.error("OAuth callback error:", error);
    
    const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_SITE_URL);
    loginUrl.searchParams.set('error', 'oauth_error');
    loginUrl.searchParams.set('message', 'OAuth authentication failed');
    
    return NextResponse.redirect(loginUrl.toString());
  }
}
