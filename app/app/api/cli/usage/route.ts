import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { userId, action, metadata } = await request.json();
    
    if (!userId || !action) {
      return NextResponse.json(
        { error: "Missing userId or action" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Record usage event
    const { error: usageError } = await supabase
      .from('usage_logs')
      .insert({
        user_id: userId,
        action,
        metadata,
        timestamp: new Date().toISOString()
      });

    if (usageError) {
      console.error('Failed to record usage:', usageError);
    }

    // Update user usage limits if it's a fix action
    if (action === 'fix') {
      const { error: updateError } = await supabase.rpc('decrement_user_fixes', {
        p_user_id: userId,
        p_count: metadata?.filesFixed || 1
      });

      if (updateError) {
        console.error('Failed to update usage limits:', updateError);
        return NextResponse.json(
          { error: "Failed to update usage limits" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Usage recorded successfully"
    });

  } catch (error) {
    console.error("CLI usage endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's current usage and limits
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('tier, usage')
      .eq('id', userId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Define tier limits based on your plan - all plans now have unlimited fixes
    const tierLimits = {
      free: { maxFixes: -1, maxAnalyzes: -1 },
      professional: { maxFixes: -1, maxAnalyzes: -1 },
      business: { maxFixes: -1, maxAnalyzes: -1 },
      enterprise: { maxFixes: -1, maxAnalyzes: -1 },
    };

    const limits = tierLimits[user.tier as keyof typeof tierLimits] || tierLimits.free;
    
    return NextResponse.json({
      tier: user.tier,
      usage: user.usage,
      limits,
      canUseFixes: limits.maxFixes === -1 || (user.usage?.remainingFixes || 0) > 0
    });

  } catch (error) {
    console.error("CLI usage GET endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
