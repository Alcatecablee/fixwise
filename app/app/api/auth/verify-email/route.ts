import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    try {
      // Verify the email confirmation token
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error) {
        console.error("Email verification error:", error);
        
        // Handle specific error cases
        if (error.message.includes('expired')) {
          return NextResponse.json(
            { error: "Verification link has expired. Please request a new one." },
            { status: 400 }
          );
        }
        
        if (error.message.includes('already been used')) {
          return NextResponse.json(
            { error: "This verification link has already been used." },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: "Invalid verification token" },
          { status: 400 }
        );
      }

      if (!data.session) {
        return NextResponse.json(
          { error: "No session data returned from verification" },
          { status: 400 }
        );
      }

      // Update the user's email_confirmed status in the profiles table if needed
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ email_confirmed: true })
          .eq('id', data.session.user.id);

        if (updateError) {
          console.error("Profile update error:", updateError);
          // Don't fail the verification if profile update fails
        }
      } catch (profileError) {
        console.error("Profile update error:", profileError);
        // Don't fail the verification if profile update fails
      }

      return NextResponse.json({
        message: "Email successfully verified",
        user: {
          id: data.session.user.id,
          email: data.session.user.email,
          emailConfirmed: true,
        },
      });
    } catch (supabaseError) {
      console.error("Supabase email verification error:", supabaseError);
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Email verification error:", error);
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
