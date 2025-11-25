import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest } from "../../../lib/auth-middleware";

const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.warn('Supabase configuration missing. User Settings API will not function properly.');
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

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Validate UUID format for userId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      // Return default settings for invalid UUIDs
      return NextResponse.json({
        user_id: userId,
        theme: 'dark',
        language: 'en',
        notifications: true,
        auto_save: true,
        default_layers: [1, 2, 3],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user settings' },
        { status: 500 }
      );
    }

    // If no settings found, return default settings
    if (!settings) {
      const defaultSettings = {
        user_id: userId,
        theme: 'dark',
        language: 'en',
        notifications: true,
        auto_save: true,
        default_layers: [1, 2, 3],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);

  } catch (error) {
    console.error('User Settings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable - configuration missing' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { userId, settings } = body;

    if (!userId || !settings) {
      return NextResponse.json(
        { error: 'User ID and settings are required' },
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

    const { data: updatedSettings, error } = await supabase
      .from('user_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user settings:', error);
      return NextResponse.json(
        { error: 'Failed to update user settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: updatedSettings,
      message: 'User settings updated successfully'
    });

  } catch (error) {
    console.error('User Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
} 