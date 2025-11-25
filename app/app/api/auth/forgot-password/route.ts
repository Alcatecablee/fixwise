import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    try {
      // Use Supabase to send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${request.nextUrl.origin}/reset-password`,
      });

      if (error) {
        console.error("Supabase password reset error:", error);
        
        // Don't reveal whether email exists or not for security
        // Always return success message
        return NextResponse.json({
          message: "If an account with that email exists, we've sent password reset instructions.",
        });
      }

      return NextResponse.json({
        message: "Password reset instructions have been sent to your email address.",
      });
    } catch (supabaseError) {
      console.error("Error calling Supabase reset:", supabaseError);
      
      // For security, always return success message
      return NextResponse.json({
        message: "If an account with that email exists, we've sent password reset instructions.",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
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
