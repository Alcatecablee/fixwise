import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase-client";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the user's current session
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user.user) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // Generate TOTP secret
    const secret = crypto.randomBytes(20).toString('hex');
    
    // Store the secret temporarily (in real implementation, use secure storage)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        two_factor_secret: secret,
        two_factor_enabled: false // Not enabled until verified
      })
      .eq('id', user.user.id);

    if (updateError) {
      console.error('2FA setup error:', updateError);
      return NextResponse.json(
        { error: "Failed to setup 2FA" },
        { status: 500 }
      );
    }

    // Generate QR code data
    const serviceName = "NeuroLint Pro";
    const accountName = user.user.email || user.user.id;
    const issuer = "neurolint.dev";

    const otpauthUrl = `otpauth://totp/${encodeURIComponent(serviceName)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

    return NextResponse.json({
      success: true,
      secret,
      qrCodeUrl: otpauthUrl,
      backupCodes: generateBackupCodes(), // Generate backup codes
      message: "2FA setup initiated. Please scan the QR code with your authenticator app."
    });

  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Generate backup codes for 2FA recovery
function generateBackupCodes(): string[] {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }
  return codes;
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
