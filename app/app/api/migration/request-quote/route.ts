import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    const {
      projectName,
      projectDescription,
      currentStack,
      targetStack,
      codebaseSize,
      timeline,
      customRequirements,
      contactEmail,
      companyName,
      budget,
      timestamp,
      source
    } = formData;

    if (!projectName || !contactEmail || !codebaseSize) {
      return NextResponse.json(
        { error: 'Missing required fields: projectName, contactEmail, and codebaseSize are required' },
        { status: 400 }
      );
    }

    // Calculate estimated pricing based on codebase size
    const pricingMap: Record<string, { min: number; max: number }> = {
      'small': { min: 999, max: 1999 },      // < 50 files
      'medium': { min: 2000, max: 4999 },    // 50-200 files
      'large': { min: 5000, max: 7999 },     // 200-500 files
      'enterprise': { min: 8000, max: 9999 } // 500+ files
    };

    const pricing = pricingMap[codebaseSize] || pricingMap['medium'];
    const estimatedPrice = Math.round((pricing.min + pricing.max) / 2);

    // Timeline multiplier
    const timelineMultipliers: Record<string, number> = {
      'urgent': 1.3,    // 1-2 weeks
      'normal': 1.0,    // 2-4 weeks
      'flexible': 0.9   // 1-2 months
    };

    const finalPrice = Math.round(estimatedPrice * (timelineMultipliers[timeline] || 1.0));

    // Store migration request in database
    if (supabase) {
      try {
        const { data: migrationRequest, error } = await supabase
          .from('migration_requests')
          .insert({
            user_email: contactEmail,
            user_name: contactEmail.split('@')[0], // Extract name from email
            company: companyName || 'Not specified',
            project_name: projectName,
            project_description: projectDescription,
            current_framework: currentStack,
            target_framework: targetStack,
            estimated_codebase: codebaseSize,
            timeline_preference: timeline,
            special_requirements: customRequirements || '',
            budget_range: budget || '',
            estimated_price: finalPrice,
            status: 'pending_review',
            source: source || 'dashboard',
            created_at: timestamp || new Date().toISOString(),
            form_data: formData, // Store complete form data as JSON
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to store migration request:', error);
        } else {
          // Send notification email (implement with your email service)
          console.log('Migration request stored:', migrationRequest.id);
        }
      } catch (dbError) {
        console.warn('Database storage failed:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      estimatedPrice: finalPrice,
      priceRange: pricing,
      timeline: calculateEstimatedTimeline(codebaseSize, timeline),
      nextSteps: [
        'Our team will review your project requirements',
        'We\'ll provide a detailed migration plan within 24 hours',
        'Schedule a consultation call to discuss the approach',
        'Receive final quote with timeline and deliverables'
      ],
      message: 'Migration request submitted successfully. We\'ll contact you within 24 hours with a detailed quote.',
      requestData: {
        projectName,
        codebaseSize,
        timeline,
        estimatedPrice: finalPrice
      }
    });

  } catch (error) {
    console.error('Migration request error:', error);
    return NextResponse.json(
      { error: 'Failed to process migration request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function calculateEstimatedTimeline(codebaseSize: string, timeline: string) {
  const baseWeeks: Record<string, number> = {
    'small': 1,      // < 50 files
    'medium': 2,     // 50-200 files
    'large': 4,      // 200-500 files
    'enterprise': 8  // 500+ files
  };

  const timelineAdjustments: Record<string, number> = {
    'urgent': 0.7,    // Compressed timeline
    'normal': 1.0,    // Standard timeline
    'flexible': 1.3   // Extended timeline
  };

  const baseWeekEstimate = baseWeeks[codebaseSize] || 2;
  const adjustment = timelineAdjustments[timeline] || 1.0;
  const totalWeeks = Math.ceil(baseWeekEstimate * adjustment);

  return {
    estimatedWeeks: totalWeeks,
    estimatedDays: totalWeeks * 5,
    description: `${totalWeeks} ${totalWeeks === 1 ? 'week' : 'weeks'} for complete migration with testing and documentation`,
    urgency: timeline === 'urgent' ? 'Expedited delivery' : timeline === 'flexible' ? 'Standard delivery' : 'Flexible timeline'
  };
}
