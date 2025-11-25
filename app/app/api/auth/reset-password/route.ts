import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json(
        { error: "Password must contain uppercase, lowercase, and numeric characters" },
        { status: 400 }
      );
    }

    try {
      // First, verify the session with the access token from the reset link
      const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      });

      if (sessionError || !sessionData.session) {
        console.error("Session verification error:", sessionError);
        return NextResponse.json(
          { error: "Invalid or expired reset token" },
          { status: 400 }
        );
      }

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error("Password update error:", updateError);
        return NextResponse.json(
          { error: "Failed to update password. Please try again." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Password has been successfully updated",
      });
    } catch (supabaseError) {
      console.error("Supabase reset password error:", supabaseError);
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
