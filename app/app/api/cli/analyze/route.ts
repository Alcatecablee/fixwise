import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { userId, results } = await request.json();
    
    if (!userId || !results) {
      return NextResponse.json(
        { error: "Missing userId or results" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service key for server operations
    );

    // Verify user exists and get tier
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('tier, usage')
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    // Store analysis results
    const analysisRecords = results.map((result: any) => ({
      user_id: userId,
      file_path: result.file,
      analysis_data: result.analysis,
      layers_applied: result.layers,
      execution_time: result.executionTime,
      success: result.success,
      created_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('analysis_results')
      .insert(analysisRecords);

    if (insertError) {
      console.error('Failed to store analysis results:', insertError);
      return NextResponse.json(
        { error: "Failed to store results" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      stored: analysisRecords.length,
      message: "Analysis results stored successfully"
    });

  } catch (error) {
    console.error("CLI analyze endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
