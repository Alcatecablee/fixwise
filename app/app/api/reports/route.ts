import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, checkTierAccess } from "../../../lib/auth-middleware";
import { ReportGenerator } from "../../../lib/report-generator";
import type { ReportOptions, GeneratedReport, UserTier } from "../../../lib/types";
import { PDFGenerator } from "../../../lib/pdf-generator";
import { dataStore } from "../../../lib/data-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      analysisResult,
      filename,
      projectName,
      reportType = "standard", // standard, executive, technical
      generatePDF = false,
    } = body;

        // Validate input
    if (!analysisResult || !filename) {
      return NextResponse.json(
        { error: "analysisResult and filename are required" },
        { status: 400 },
      );
    }

    // Additional validation
    if (typeof filename !== 'string' || filename.trim().length === 0) {
      return NextResponse.json(
        { error: "filename must be a non-empty string" },
        { status: 400 },
      );
    }

    if (!analysisResult.analysis || typeof analysisResult.analysis !== 'object') {
      return NextResponse.json(
        { error: "analysisResult must contain valid analysis data" },
        { status: 400 },
      );
    }

    // Validate reportType
    const validReportTypes = ['standard', 'executive', 'technical'];
    if (reportType && !validReportTypes.includes(reportType)) {
      return NextResponse.json(
        { error: `reportType must be one of: ${validReportTypes.join(', ')}` },
        { status: 400 },
      );
    }

    // Check if user requests PDF and has access
    if (generatePDF) {
      const pdfAccess = checkTierAccess(authResult.user.tier, ["pdf_export"]);
      if (!pdfAccess.hasAccess) {
        return NextResponse.json(
          {
            error: "PDF export requires premium tier",
            tierInfo: {
              current: authResult.user.tier,
              required: "premium",
              missingFeatures: pdfAccess.missingFeatures,
            },
          },
          { status: 403 },
        );
      }
    }

    // Generate the report
    const reportOptions: ReportOptions = {
      userTier: authResult.user.tier as UserTier,
      analysisResult,
      filename,
      projectName,
      generatePDF,
      includeCodeDiffs: authResult.user.tier !== "free",
    };

    const report = ReportGenerator.generateReport(reportOptions);

    // Generate PDF if requested and user has access
    let pdfResult = null;
    if (generatePDF && authResult.user.tier !== "free") {
      try {
        const { PDFGenerator } = await import("../../../lib/pdf-generator");
        
        // Convert report to HTML for PDF generation
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>NeuroLint Report - ${report.filename}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin: 20px 0; }
        .issue { background: #f5f5f5; padding: 10px; margin: 10px 0; border-left: 4px solid #2196f3; }
    </style>
</head>
<body>
    <div class="header">
        <h1>NeuroLint Analysis Report</h1>
        <p>Generated: ${new Date(report.generatedAt).toLocaleDateString()}</p>
        <p>File: ${report.filename}</p>
        <p>Level: ${report.level}</p>
    </div>
    <div class="section">
        <h2>Summary</h2>
        <p>Total Issues: ${report.summary?.totalIssues || 0}</p>
        <p>Critical Issues: ${report.summary?.criticalIssues || 0}</p>
        <p>Confidence Score: ${report.summary?.confidence || 0}%</p>
    </div>
</body>
</html>`;

        pdfResult = await PDFGenerator.generatePDF(htmlContent, {
          format: 'A4',
          printBackground: true
        });
      } catch (error) {
        console.error('PDF generation failed:', error);
        pdfResult = { success: false, error: 'PDF generation failed' };
      }
    }

    // Store report in memory (in production, save to database)
    const userReports = dataStore.userReports?.get(authResult.user.id) || [];
    userReports.push({
      ...report,
      pdfGenerated: pdfResult?.success || false,
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });

    if (!dataStore.userReports) {
      dataStore.userReports = new Map();
    }
    dataStore.userReports.set(authResult.user.id, userReports.slice(-20)); // Keep last 20 reports

    console.log(`Generated ${report.level} report for user ${authResult.user.id} (tier: ${authResult.user.tier})`);

    // Build response
    const response = {
      success: true,
      report,
      pdfGenerated: pdfResult?.success || false,
      pdfError: pdfResult?.error || null,
      metadata: {
        generatedAt: report.generatedAt,
        reportType,
        userTier: authResult.user.tier as UserTier,
        sectionsCount: report.sections.length,
        pdfAvailable: authResult.user.tier !== "free",
      },
      tierInfo: {
        current: authResult.user.tier,
        reportLevel: report.level,
        pdfAccess: authResult.user.tier !== "free",
        upgradeMessage: authResult.user.tier === "free" 
          ? "Upgrade to premium for detailed reports and PDF export"
          : null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      {
        error: "Report generation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user's report history
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const reportId = url.searchParams.get("reportId");

    if (reportId) {
      // Get specific report
      const userReports = dataStore.userReports?.get(authResult.user.id) || [];
      const report = userReports.find((r: any) => r.reportId === reportId);

      if (!report) {
        return NextResponse.json(
          { error: "Report not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        report,
        isExpired: new Date() > new Date(report.expiresAt),
      });
    } else {
      // Get all user reports
      const userReports = dataStore.userReports?.get(authResult.user.id) || [];
      
      return NextResponse.json({
        reports: userReports
          .filter((report: any) => new Date() < new Date(report.expiresAt)) // Only non-expired
          .map((report: any) => ({
            reportId: report.reportId,
            level: report.level,
            generatedAt: report.generatedAt,
            summary: report.summary,
            pdfGenerated: report.pdfGenerated,
            pdfUrl: report.pdfUrl,
            sectionsCount: report.sections?.length || 0,
          }))
          .sort((a: any, b: any) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()),
        totalReports: userReports.length,
        tierInfo: {
          current: authResult.user.tier,
          pdfLimits: authResult.user.tier === "free" ? { monthly: 0, fileSize: '0MB' } : { monthly: 50, fileSize: '10MB' },
          reportsThisMonth: userReports.filter(
            (r: any) => new Date(r.generatedAt).getMonth() === new Date().getMonth()
          ).length,
        },
      });
    }
  } catch (error) {
    console.error("Report retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve reports" },
      { status: 500 },
    );
  }
}
