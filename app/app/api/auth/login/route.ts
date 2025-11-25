import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateSupabaseConfig } from "../../../../lib/demo-mode";

// Rate limiting for login attempts
const loginAttempts = new Map<
  string,
  { count: number; resetTime: number; lastAttempt: number }
>();

function checkLoginRateLimit(identifier: string): {
  allowed: boolean;
  waitTime?: number;
} {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || {
    count: 0,
    resetTime: now + 900000,
    lastAttempt: 0,
  }; // 15 min window

  if (now > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = now + 900000;
  }

  // Progressive delays: 1s, 2s, 5s, 10s, then 15min lockout
  if (attempts.count >= 5) {
    return { allowed: false, waitTime: Math.max(0, attempts.resetTime - now) };
  }

  if (attempts.count >= 3 && now - attempts.lastAttempt < 10000) {
    // 10s delay after 3 attempts
    return { allowed: false, waitTime: 10000 - (now - attempts.lastAttempt) };
  }

  return { allowed: true };
}

function recordLoginAttempt(identifier: string, success: boolean) {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || {
    count: 0,
    resetTime: now + 900000,
    lastAttempt: 0,
  };

  if (success) {
    loginAttempts.delete(identifier); // Clear on success
  } else {
    attempts.count++;
    attempts.lastAttempt = now;
    loginAttempts.set(identifier, attempts);
  }
}

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

let supabase: any = null;

if (!validateSupabaseConfig()) {
  console.error("Invalid Supabase configuration");
} else {
  supabase = createClient(supabaseUrl!, supabaseAnonKey!);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Rate limiting check
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";
    const identifier = `${ip}:${sanitizedEmail}`;

    const rateCheck = checkLoginRateLimit(identifier);
    if (!rateCheck.allowed) {
      const waitSeconds = rateCheck.waitTime ? Math.ceil(rateCheck.waitTime / 1000) : 0;
      const waitMinutes = Math.ceil(waitSeconds / 60);

      return NextResponse.json(
        {
          error: waitMinutes > 1
            ? `Too many failed attempts. Please try again in ${waitMinutes} minutes.`
            : "Too many attempts. Please wait a moment before trying again.",
          waitTime: waitSeconds,
          rateLimited: true
        },
        { status: 429 },
      );
    }

    // Database mode
    if (!supabase) {
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 500 },
      );
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

    if (authError) {
      console.error("Login error:", authError.message);
      recordLoginAttempt(identifier, false);

      // Generic error message to prevent user enumeration
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (!authData.user || !authData.session) {
      recordLoginAttempt(identifier, false);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 },
      );
    }

    // Record successful login
    recordLoginAttempt(identifier, true);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      // Continue without profile data
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        firstName: profile?.first_name || "",
        lastName: profile?.last_name || "",
        plan: profile?.plan || "free",
        emailConfirmed: authData.user.email_confirmed_at !== null,
      },
      session: authData.session,
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
