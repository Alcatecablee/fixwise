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
      // Resend confirmation email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${request.nextUrl.origin}/verify-email`,
        }
      });

      if (error) {
        console.error("Supabase resend verification error:", error);
        
        // Handle specific error cases
        if (error.message.includes('rate limit')) {
          return NextResponse.json(
            { error: "Too many requests. Please wait before requesting another verification email." },
            { status: 429 }
          );
        }
        
        if (error.message.includes('already confirmed')) {
          return NextResponse.json(
            { error: "This email address is already verified." },
            { status: 400 }
          );
        }

        // For security, don't reveal if email doesn't exist
        // Always return success message
        return NextResponse.json({
          message: "If an unverified account with that email exists, we've sent a verification email.",
        });
      }

      return NextResponse.json({
        message: "Verification email has been sent. Please check your inbox.",
      });
    } catch (supabaseError) {
      console.error("Error calling Supabase resend:", supabaseError);
      
      // For security, always return success message
      return NextResponse.json({
        message: "If an unverified account with that email exists, we've sent a verification email.",
      });
    }
  } catch (error) {
    console.error("Resend verification error:", error);
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
