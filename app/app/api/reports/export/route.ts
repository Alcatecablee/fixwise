import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateRequest } from "../../../../lib/auth-middleware";
import { EnhancedReportGenerator, EnhancedReportData, EnhancedReportOptions } from "../../../../lib/enhanced-report-generator";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { 
      format, 
      reportType = 'comprehensive', 
      filters, 
      analysisIds,
      includeCodeSamples = true,
      includeRecommendations = true,
      projectInfo
    } = await request.json();

    if (!format || !['pdf', 'csv', 'html'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be "pdf", "csv", or "html"' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Build query for analysis data
    let query = supabase
      .from('analysis_results')
      .select('*')
      .eq('user_id', authResult.user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (analysisIds && analysisIds.length > 0) {
      query = query.in('id', analysisIds);
    } else {
      // Default to last 100 analyses if no specific IDs provided
      query = query.limit(100);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    if (filters?.filePattern) {
      query = query.ilike('file_path', `%${filters.filePattern}%`);
    }

    const { data: analysisData, error } = await query;

    if (error) {
      console.error('Failed to fetch analysis data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analysis data' },
        { status: 500 }
      );
    }

    if (!analysisData || analysisData.length === 0) {
      return NextResponse.json(
        { error: 'No analysis data found' },
        { status: 404 }
      );
    }

    // Calculate metadata
    const totalFiles = analysisData.length;
    const totalIssues = analysisData.reduce((sum: number, analysis: any) => {
      return sum + (analysis.analysis_data?.detectedIssues?.length || 0);
    }, 0);
    const executionTime = analysisData.reduce((sum: number, analysis: any) => {
      return sum + (analysis.execution_time || 0);
    }, 0);

    // Prepare report data
    const reportData: EnhancedReportData = {
      analysisResults: analysisData,
      userInfo: authResult.user,
      projectInfo: projectInfo || {
        name: 'NeuroLint Analysis',
        description: 'Code quality analysis report'
      },
      metadata: {
        generatedAt: new Date(),
        reportType: reportType as any,
        totalFiles,
        totalIssues,
        executionTime
      }
    };

    // Prepare report options
    const reportOptions: EnhancedReportOptions = {
      type: reportType as any,
      includeCodeSamples,
      includeRecommendations,
      format: format as any,
      customStyling: true
    };

    // Generate report using the new EnhancedReportGenerator
    const reportResult = await EnhancedReportGenerator.generateReport(reportData, reportOptions);

    if (!reportResult.success) {
      return NextResponse.json(
        { error: reportResult.error || 'Failed to generate report' },
        { status: 500 }
      );
    }

    // Return the generated report
    return new NextResponse(reportResult.content, {
      status: 200,
      headers: {
        'Content-Type': reportResult.contentType,
        'Content-Disposition': `attachment; filename="${reportResult.filename}"`,
        'Cache-Control': 'no-cache',
        'Content-Length': reportResult.size.toString()
      },
    });

  } catch (error) {
    console.error('Export generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get summary of available data for export
    const { data: analysisCount } = await supabase
      .from('analysis_results')
      .select('id', { count: 'exact' })
      .eq('user_id', authResult.user.id);

    const { data: recentAnalyses } = await supabase
      .from('analysis_results')
      .select('id, file_path, created_at, success')
      .eq('user_id', authResult.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      totalAnalyses: analysisCount?.length || 0,
      recentAnalyses: recentAnalyses || [],
      supportedFormats: ['pdf', 'csv', 'html'],
      supportedReportTypes: ['executive', 'technical', 'comprehensive', 'issues-only', 'summary'],
      availableReports: [
        {
          type: 'executive',
          title: 'Executive Summary Report',
          description: 'High-level overview for stakeholders',
          bestFor: 'Management, stakeholders'
        },
        {
          type: 'technical',
          title: 'Technical Analysis Report',
          description: 'Detailed technical findings for developers',
          bestFor: 'Development teams, code reviews'
        },
        {
          type: 'comprehensive',
          title: 'Comprehensive Analysis Report',
          description: 'Complete analysis with all details',
          bestFor: 'Full project analysis, documentation'
        },
        {
          type: 'issues-only',
          title: 'Issues Report',
          description: 'Focus on detected issues only',
          bestFor: 'Quick issue review, bug tracking'
        },
        {
          type: 'summary',
          title: 'Analysis Summary',
          description: 'Brief overview of findings',
          bestFor: 'Quick overview, status updates'
        }
      ]
    });

  } catch (error) {
    console.error('Export info error:', error);
    return NextResponse.json(
      { error: 'Failed to get export information' },
      { status: 500 }
    );
  }
}
