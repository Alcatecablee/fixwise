import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest } from "../../../lib/auth-middleware";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.warn('Supabase configuration missing. Analysis History API will not function properly.');
}

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable - configuration missing' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Validate UUID format for userId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({
        analysisHistory: [],
        total: 0
      });
    }

    const { data: analysisHistory, error } = await supabase
      .from('analysis_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching analysis history:', error);
      return NextResponse.json({
        analysisHistory: [],
        total: 0
      });
    }

    return NextResponse.json({
      analysisHistory: analysisHistory || [],
      total: analysisHistory?.length || 0
    });

  } catch (error) {
    console.error('Analysis History GET error:', error);
    return NextResponse.json({
      analysisHistory: [],
      total: 0
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable - configuration missing' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { userId, analysisData } = body;

    if (!userId || !analysisData) {
      return NextResponse.json(
        { error: 'User ID and analysis data are required' },
        { status: 400 }
      );
    }

    // Validate UUID format for userId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const { data: analysis, error } = await supabase
      .from('analysis_history')
      .insert({
        user_id: userId,
        filename: analysisData.filename,
        result: analysisData.result,
        layers: analysisData.layers,
        execution_time: analysisData.execution_time,
        project_id: analysisData.project_id || null,
        timestamp: analysisData.timestamp || new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving analysis history:', error);
      return NextResponse.json(
        { error: 'Failed to save analysis history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      analysis,
      message: 'Analysis history saved successfully'
    });

  } catch (error) {
    console.error('Analysis History POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save analysis history' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable - configuration missing' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Validate UUID format for userId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('analysis_history')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing analysis history:', error);
      return NextResponse.json(
        { error: 'Failed to clear analysis history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Analysis history cleared successfully'
    });

  } catch (error) {
    console.error('Analysis History DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to clear analysis history' },
      { status: 500 }
    );
  }
} 