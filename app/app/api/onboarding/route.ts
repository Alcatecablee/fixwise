import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "../../../lib/auth-middleware";
import { supabase } from "../../../lib/supabase-client";

export const dynamic = "force-dynamic";

interface OnboardingPreferences {
  primaryUse: string;
  teamSize: string;
  experienceLevel: string;
  interestedFeatures: string[];
  completedAt?: string;
  onboardingVersion?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Try to authenticate user, but allow anonymous onboarding
    const authResult = await authenticateRequest(request);
    
    const body = await request.json();
    const {
      primaryUse,
      teamSize,
      experienceLevel,
      interestedFeatures,
      skipOnboarding = false
    } = body;

    // Validate required fields (only if not skipping)
    if (!skipOnboarding) {
      if (!primaryUse || !teamSize || !experienceLevel) {
        return NextResponse.json(
          { 
            error: "Missing required onboarding data",
            details: {
              primaryUse: !primaryUse ? "Primary use is required" : null,
              teamSize: !teamSize ? "Team size is required" : null,
              experienceLevel: !experienceLevel ? "Experience level is required" : null
            }
          },
          { status: 400 }
        );
      }
    }

    const preferences: OnboardingPreferences = {
      primaryUse: primaryUse || "",
      teamSize: teamSize || "",
      experienceLevel: experienceLevel || "",
      interestedFeatures: Array.isArray(interestedFeatures) ? interestedFeatures : [],
      completedAt: new Date().toISOString(),
      onboardingVersion: "v1.0"
    };

    // If user is authenticated, save to Supabase
    if (authResult.success && authResult.user) {
      try {
        // First check if user settings already exist
        const { data: existingSettings, error: checkError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', authResult.user.id)
          .maybeSingle();

        // Only log actual errors, not "no rows" cases
        if (checkError && checkError.code !== 'PGRST116' && checkError.code !== 'PGRST004') {
          console.error('Error checking existing user settings:', checkError);
        }

        if (existingSettings) {
          // Update existing settings with onboarding data
          const { error: updateError } = await supabase
            .from('user_settings')
            .update({
              onboarding_completed: true,
              onboarding_data: preferences,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', authResult.user.id);

          if (updateError) {
            console.error('Error updating user settings:', updateError);
          }
        } else {
          // Create new settings record with smart defaults based on onboarding
          const defaultLayers = getDefaultLayersFromPreferences(preferences);
          
          const { error: insertError } = await supabase
            .from('user_settings')
            .insert({
              user_id: authResult.user.id,
              default_layers: defaultLayers,
              auto_save: true,
              notifications: true,
              theme: 'dark',
              onboarding_completed: true,
              onboarding_data: preferences,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Error inserting user settings:', insertError);
            throw insertError;
          }
        }

        // Track onboarding completion for analytics
        const { error: analyticsError } = await supabase
          .from('user_analytics')
          .insert({
            user_id: authResult.user.id,
            event_type: 'onboarding_completed',
            event_data: {
              ...preferences,
              skipped: skipOnboarding,
              timestamp: new Date().toISOString()
            },
            created_at: new Date().toISOString()
          });

        if (analyticsError) {
          console.error('Error tracking onboarding analytics:', analyticsError);
          // Don't fail the request if analytics fails
        }

        return NextResponse.json({
          success: true,
          message: "Onboarding preferences saved successfully",
          preferences,
          userId: authResult.user.id,
          personalizedSettings: {
            defaultLayers: getDefaultLayersFromPreferences(preferences),
            recommendations: getPersonalizedRecommendations(preferences)
          }
        });

      } catch (supabaseError) {
        console.error('Supabase error:', supabaseError);
        
        // Fall back to localStorage recommendation
        return NextResponse.json({
          success: true,
          message: "Onboarding completed (saved locally)",
          preferences,
          userId: authResult.user?.id || null,
          fallbackToLocalStorage: true,
          personalizedSettings: {
            defaultLayers: getDefaultLayersFromPreferences(preferences),
            recommendations: getPersonalizedRecommendations(preferences)
          }
        });
      }
    } else {
      // Anonymous user - provide recommendations but can't save to database
      return NextResponse.json({
        success: true,
        message: "Onboarding completed (anonymous)",
        preferences,
        userId: null,
        anonymous: true,
        personalizedSettings: {
          defaultLayers: getDefaultLayersFromPreferences(preferences),
          recommendations: getPersonalizedRecommendations(preferences)
        }
      });
    }

  } catch (error) {
    console.error('Onboarding API error:', error);
    return NextResponse.json(
      { 
        error: "Failed to save onboarding preferences",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user's onboarding status and preferences
    const authResult = await authenticateRequest(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch user settings from Supabase
    const { data: userSettings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', authResult.user.id)
      .maybeSingle(); // Use maybeSingle to avoid error on no rows

    // Only return error if it's not a "no rows" error
    if (error && error.code !== 'PGRST116' && error.code !== 'PGRST004') {
      console.error('Error fetching user settings:', error);
      return NextResponse.json(
        { error: "Failed to fetch onboarding status" },
        { status: 500 }
      );
    }

    // If no user settings exist, create default ones
    let finalUserSettings = userSettings;
    if (!userSettings) {
      console.log('Creating default user settings for user:', authResult.user.id);
      const { data: newSettings, error: createError } = await supabase
        .from('user_settings')
        .insert({
          user_id: authResult.user.id,
          default_layers: [1, 2, 3],
          auto_save: true,
          notifications: true,
          theme: 'dark'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating default user settings:', createError);
        // Continue with defaults in memory
        finalUserSettings = {
          user_id: authResult.user.id,
          default_layers: [1, 2, 3],
          auto_save: true,
          notifications: true,
          theme: 'dark',
          onboarding_data: null
        };
      } else {
        finalUserSettings = newSettings;
      }
    }

    const onboardingCompleted = finalUserSettings?.onboarding_completed || false;
    const onboardingData = finalUserSettings?.onboarding_data || null;

    return NextResponse.json({
      onboardingCompleted,
      onboardingData,
      userSettings: finalUserSettings ? {
        defaultLayers: finalUserSettings.default_layers,
        autoSave: finalUserSettings.auto_save,
        notifications: finalUserSettings.notifications,
        theme: finalUserSettings.theme
      } : {
        defaultLayers: [1, 2, 3],
        autoSave: true,
        notifications: true,
        theme: 'dark'
      }
    });

  } catch (error) {
    console.error('Onboarding GET API error:', error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding status" },
      { status: 500 }
    );
  }
}

// Helper function to determine default layers based on user preferences
function getDefaultLayersFromPreferences(preferences: OnboardingPreferences): number[] {
  const { experienceLevel, interestedFeatures } = preferences;
  
  // Base layers everyone gets
  let layers = [1, 2]; // Configuration and basic patterns
  
  // Add layers based on experience level
  if (experienceLevel === 'Beginner') {
    layers = [1, 2, 3]; // Add component fixes for beginners
  } else if (experienceLevel === 'Intermediate') {
    layers = [1, 2, 3, 4]; // Add hydration fixes
  } else if (experienceLevel === 'Advanced') {
    layers = [1, 2, 3, 4, 5]; // Add Next.js optimizations
  }
  
  // Add specific layers based on interested features
  if (interestedFeatures.includes('missing-keys')) {
    if (!layers.includes(3)) layers.push(3);
  }
  
  if (interestedFeatures.includes('hydration-errors')) {
    if (!layers.includes(4)) layers.push(4);
  }
  
  if (interestedFeatures.includes('nextjs-issues')) {
    if (!layers.includes(5)) layers.push(5);
  }
  
  if (interestedFeatures.includes('typescript-errors')) {
    if (!layers.includes(1)) layers.push(1); // Already included but emphasize
  }
  
  return layers.sort();
}

// Helper function to generate personalized recommendations
function getPersonalizedRecommendations(preferences: OnboardingPreferences): string[] {
  const { primaryUse, teamSize, experienceLevel, interestedFeatures } = preferences;
  const recommendations: string[] = [];
  
  // Recommendations based on primary use
  if (primaryUse === 'team-development') {
    recommendations.push("Enable real-time collaboration features for your team");
    recommendations.push("Set up project templates for consistent code standards");
  } else if (primaryUse === 'client-work') {
    recommendations.push("Use dry-run mode to preview fixes before applying");
    recommendations.push("Generate reports to show clients code quality improvements");
  } else if (primaryUse === 'learning') {
    recommendations.push("Start with beginner-friendly layers (1-3)");
    recommendations.push("Review fix explanations to understand React best practices");
  }
  
  // Recommendations based on team size
  if (teamSize === '2-5 people' || teamSize === '6-20 people' || teamSize === '20+ people') {
    recommendations.push("Consider upgrading to Professional plan for team features");
    recommendations.push("Set up webhook notifications for team collaboration");
  }
  
  // Recommendations based on experience level
  if (experienceLevel === 'Beginner') {
    recommendations.push("Start with the sample files to understand how NeuroLint works");
    recommendations.push("Focus on Layer 3 fixes (component best practices) to improve your React skills");
  } else if (experienceLevel === 'Advanced') {
    recommendations.push("Explore Layer 5 and 6 for advanced Next.js and testing optimizations");
    recommendations.push("Consider using the CLI tool for automated workflow integration");
  }
  
  // Recommendations based on interested features
  if (interestedFeatures.includes('hydration-errors')) {
    recommendations.push("Upload components with localStorage or theme providers to see hydration fixes in action");
  }
  
  if (interestedFeatures.includes('nextjs-issues')) {
    recommendations.push("Try analyzing App Router components to see Next.js specific optimizations");
  }
  
  return recommendations;
}
