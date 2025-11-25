import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Rate limiting - simple in-memory store (use Redis in production)
const signupAttempts = new Map<string, { count: number; resetTime: number }>();

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = signupAttempts.get(ip) || {
    count: 0,
    resetTime: now + 60000,
  };

  if (now > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = now + 60000; // 1 minute window
  }

  if (attempts.count >= 5) {
    // Max 5 signup attempts per minute
    return false;
  }

  attempts.count++;
  signupAttempts.set(ip, attempts);
  return true;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.error("Missing Supabase environment variables");
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 500 },
      );
    }
    // Rate limiting check
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 },
      );
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json(
        {
          error:
            "Password must contain uppercase, lowercase, and numeric characters",
        },
        { status: 400 },
      );
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedFirstName = firstName?.trim().substring(0, 50) || "";
    const sanitizedLastName = lastName?.trim().substring(0, 50) || "";

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        data: {
          first_name: sanitizedFirstName,
          last_name: sanitizedLastName,
          plan: "free",
        },
      },
    });

    if (authError) {
      console.error("Supabase auth error:", authError.message);

      // Handle specific error cases
      if (authError.message.includes("already registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 },
        );
      }

      if (authError.message.includes("weak password")) {
        return NextResponse.json(
          { error: "Password is too weak. Please choose a stronger password." },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 400 },
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 },
      );
    }

    // Profile should be created automatically by database trigger
    // But let's ensure it exists with a safe upsert
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: authData.user.id,
        email: authData.user.email,
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
        plan: "free",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    );

    if (profileError) {
      console.error("Profile creation error:", profileError.message);
      // Don't fail the request, but log the error
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        emailConfirmed: authData.user.email_confirmed_at !== null,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        plan: "free",
      },
      session: authData.session,
      message: authData.user.email_confirmed_at
        ? "Account created successfully"
        : "Account created. Please check your email to confirm your account.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
