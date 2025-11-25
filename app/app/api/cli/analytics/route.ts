import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiKeyService } from '../../../lib/api-key-utils';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.warn('Supabase configuration missing. CLI Analytics ingestion will not function.');
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required. Include Authorization: Bearer <api_key> header' },
        { status: 401 }
      );
    }

    const validatedKey = await apiKeyService.validate(apiKey);
    if (!validatedKey || !validatedKey.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired API key' },
        { status: 401 }
      );
    }

    const userId = validatedKey.userId;

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { events, sessionId, platform } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'events array is required and must not be empty' },
        { status: 400 }
      );
    }

    const insertedAnalyses = [];
    const insertedUsageLogs = [];
    const errors = [];

    for (const event of events) {
      try {
        if (event.type === 'analysis') {
          const analysisRecord = {
            user_id: userId,
            filename: event.data.filename || 'unknown',
            result: {
              success: event.data.success,
              analysis: event.data.analysis,
              issues: event.data.issues || [],
              layers: event.data.layers || [],
              summary: event.data.summary || {}
            },
            layers: event.data.layers || [],
            execution_time: event.data.executionTime || 0,
            session_id: sessionId || null,
            project_id: event.data.projectId || null,
            timestamp: event.timestamp || new Date().toISOString()
          };

          const { data, error } = await supabase
            .from('analysis_history')
            .insert(analysisRecord)
            .select()
            .single();

          if (error) {
            errors.push({ event, error: error.message });
          } else {
            insertedAnalyses.push(data);
          }
        } else if (event.type === 'usage') {
          const usageRecord = {
            user_id: userId,
            action: event.data.action || event.data.command || 'unknown',
            metadata: {
              command: event.data.command,
              platform: platform || event.data.platform || 'cli',
              executionTime: event.data.executionTime,
              success: event.data.success,
              ...event.data.metadata
            },
            files_processed: event.data.filesProcessed || 0,
            layers_used: event.data.layersUsed || [],
            execution_time_ms: event.data.executionTime || 0,
            credits_used: event.data.creditsUsed || 0,
            timestamp: event.timestamp || new Date().toISOString()
          };

          const { data, error } = await supabase
            .from('usage_logs')
            .insert(usageRecord)
            .select()
            .single();

          if (error) {
            errors.push({ event, error: error.message });
          } else {
            insertedUsageLogs.push(data);
          }
        } else if (event.type === 'fix') {
          const usageRecord = {
            user_id: userId,
            action: 'fix_applied',
            metadata: {
              appliedFixes: event.data.appliedFixes || [],
              success: event.data.success,
              rollback: event.data.rollback,
              layer: event.data.layer,
              rule: event.data.rule,
              platform: platform || event.data.platform || 'cli'
            },
            files_processed: 1,
            layers_used: event.data.layer ? [event.data.layer] : [],
            execution_time_ms: event.data.executionTime || 0,
            credits_used: event.data.creditsUsed || 0,
            timestamp: event.timestamp || new Date().toISOString()
          };

          const { data, error } = await supabase
            .from('usage_logs')
            .insert(usageRecord)
            .select()
            .single();

          if (error) {
            errors.push({ event, error: error.message });
          } else {
            insertedUsageLogs.push(data);
          }
        } else {
          errors.push({ event, error: 'Unknown event type' });
        }
      } catch (eventError: any) {
        errors.push({ event, error: eventError.message });
      }
    }

    return NextResponse.json({
      success: true,
      inserted: {
        analyses: insertedAnalyses.length,
        usageLogs: insertedUsageLogs.length
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('CLI analytics ingestion error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      message: 'CLI Analytics Ingestion Endpoint',
      version: '1.0.0',
      methods: ['POST'],
      documentation: 'Send analytics events from NeuroLint CLI to sync with dashboard'
    },
    { status: 200 }
  );
}
