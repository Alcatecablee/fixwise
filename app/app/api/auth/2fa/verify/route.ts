import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase-client";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { token, code, setupMode = false } = await request.json();

    if (!token || !code) {
      return NextResponse.json(
        { error: "Authentication token and verification code are required" },
        { status: 400 }
      );
    }

    // Verify the user's current session
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user.user) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // Get user profile with 2FA secret
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('two_factor_secret, two_factor_enabled, backup_codes')
      .eq('id', user.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    if (!profile.two_factor_secret) {
      return NextResponse.json(
        { error: "2FA not set up for this user" },
        { status: 400 }
      );
    }

    // Verify TOTP code (simplified - in real implementation use proper TOTP library)
    const isValidCode = verifyTOTP(profile.two_factor_secret, code);
    const isBackupCode = profile.backup_codes?.includes(code);

    if (!isValidCode && !isBackupCode) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    if (setupMode) {
      // Enable 2FA for the first time
      const { error: enableError } = await supabase
        .from('profiles')
        .update({ 
          two_factor_enabled: true,
          two_factor_verified_at: new Date().toISOString()
        })
        .eq('id', user.user.id);

      if (enableError) {
        console.error('2FA enable error:', enableError);
        return NextResponse.json(
          { error: "Failed to enable 2FA" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "2FA successfully enabled for your account"
      });
    }

    // Handle backup code usage
    if (isBackupCode) {
      const updatedBackupCodes = profile.backup_codes.filter((c: string) => c !== code);
      
      await supabase
        .from('profiles')
        .update({ backup_codes: updatedBackupCodes })
        .eq('id', user.user.id);
    }

    // Log successful 2FA verification
    await supabase
      .from('user_security_logs')
      .insert({
        user_id: user.user.id,
        event_type: '2fa_verification_success',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      message: "2FA verification successful",
      backupCodeUsed: isBackupCode,
      remainingBackupCodes: isBackupCode ? (profile.backup_codes?.length - 1) : profile.backup_codes?.length
    });

  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Simplified TOTP verification (in production, use a proper TOTP library like 'otplib')
function verifyTOTP(secret: string, code: string): boolean {
  // This is a simplified version - implement proper TOTP verification
  // For production, use: npm install otplib
  
  const timeStep = Math.floor(Date.now() / 30000);
  const expectedCode = generateTOTP(secret, timeStep);
  const previousCode = generateTOTP(secret, timeStep - 1);
  
  return code === expectedCode || code === previousCode;
}

function generateTOTP(secret: string, timeStep: number): string {
  // Simplified TOTP generation - replace with proper implementation
  const hash = crypto.createHmac('sha1', Buffer.from(secret, 'hex'))
    .update(Buffer.alloc(8))
    .digest();
  
  const offset = hash[hash.length - 1] & 0xf;
  const binary = ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  
  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
