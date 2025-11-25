import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "../../../../../lib/auth-middleware";
import { dataStore } from "../../../../../lib/data-store";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { reportId } = params;

    // Check if user has access to PDF downloads
    if (authResult.user.tier === "free") {
      return NextResponse.json(
        {
          error: "PDF download requires premium tier",
          upgradeMessage: "Upgrade to premium for PDF report downloads",
        },
        { status: 403 },
      );
    }

    // Find the report
    const userReports = dataStore.userReports?.get(authResult.user.id) || [];
    const report = userReports.find((r: any) => r.reportId === reportId);

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 },
      );
    }

    // Check if report has expired
    if (new Date() > new Date(report.expiresAt)) {
      return NextResponse.json(
        { error: "Report has expired. Please generate a new report." },
        { status: 410 }, // Gone
      );
    }

    // Check if PDF was generated
    if (!report.pdfGenerated || !report.pdfUrl) {
      return NextResponse.json(
        { error: "PDF not available for this report" },
        { status: 404 },
      );
    }

    // In a real implementation, this would:
    // 1. Retrieve the PDF file from cloud storage
    // 2. Stream it to the user
    // 3. Handle proper content-type headers
    
    // For now, we'll return the PDF URL and metadata
    return NextResponse.json({
      downloadUrl: report.pdfUrl,
      reportId: report.reportId,
      filename: `neurolint-report-${reportId}.pdf`,
      generatedAt: report.generatedAt,
      fileSize: "1.2MB", // Mock file size
      expiresAt: report.expiresAt,
      downloadInstructions: "Use the downloadUrl to retrieve the PDF file",
    });

    // In production, this would return the actual PDF file:
    /*
    const pdfBuffer = await retrievePDFFromStorage(report.pdfUrl);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="neurolint-report-${reportId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
    */

  } catch (error) {
    console.error("PDF download error:", error);
    return NextResponse.json(
      {
        error: "PDF download failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    // Regenerate PDF for an existing report
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { reportId } = params;

    // Check tier access
    if (authResult.user.tier === "free") {
      return NextResponse.json(
        { error: "PDF generation requires premium tier" },
        { status: 403 },
      );
    }

    // Find the report
    const userReports = dataStore.userReports?.get(authResult.user.id) || [];
    const reportIndex = userReports.findIndex((r: any) => r.reportId === reportId);

    if (reportIndex === -1) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 },
      );
    }

    const report = userReports[reportIndex];

    // Check if report has expired
    if (new Date() > new Date(report.expiresAt)) {
      return NextResponse.json(
        { error: "Report has expired. Please generate a new report." },
        { status: 410 },
      );
    }

    // Regenerate PDF
    const { PDFGenerator } = await import("../../../../../lib/pdf-generator");
    
    const body = await request.json();
    const { template = "standard" } = body;

    // Convert report to HTML content for PDF generation
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
    </div>
    <div class="section">
        <h2>Summary</h2>
        <p>Total Issues: ${report.metadata?.totalIssues || 0}</p>
        <p>Critical Issues: ${report.metadata?.criticalIssues || 0}</p>
        <p>Confidence Score: ${report.metadata?.confidence || 0}%</p>
    </div>
</body>
</html>`;

    const pdfResult = await PDFGenerator.generatePDF(htmlContent, {
      format: 'A4',
      printBackground: true
    });

    if (pdfResult.success && pdfResult.pdfBuffer) {
      // Update report with new PDF info
      report.pdfGenerated = true;
      report.pdfRegeneratedAt = new Date().toISOString();
      
      userReports[reportIndex] = report;
      dataStore.userReports?.set(authResult.user.id, userReports);

      // Return PDF buffer as base64
      const pdfBase64 = pdfResult.pdfBuffer.toString('base64');

      return NextResponse.json({
        success: true,
        pdfData: pdfBase64,
        fileSize: pdfResult.pdfBuffer.length,
        regeneratedAt: report.pdfRegeneratedAt,
      });
    } else {
      return NextResponse.json(
        {
          error: "PDF regeneration failed",
          details: pdfResult.error,
        },
        { status: 500 },
      );
    }

  } catch (error) {
    console.error("PDF regeneration error:", error);
    return NextResponse.json(
      {
        error: "PDF regeneration failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
