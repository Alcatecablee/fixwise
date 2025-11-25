import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { format, data, timeRange, userId, teamId } = body;

    if (!data || !format) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    let exportContent: string;
    let contentType: string;
    let filename: string;

    switch (format.toLowerCase()) {
      case 'csv':
        exportContent = generateCSV(data, timeRange);
        contentType = 'text/csv';
        filename = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      case 'json':
        exportContent = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        filename = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
        break;
      
      case 'pdf':
        exportContent = generatePDF(data, timeRange);
        contentType = 'application/pdf';
        filename = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`;
        break;
      
      default:
        return NextResponse.json(
          { error: 'Unsupported export format' },
          { status: 400 }
        );
    }

    // Create response with appropriate headers
    const response = new NextResponse(exportContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

    return response;

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}

function generateCSV(data: any, timeRange: string): string {
  const csvRows: string[] = [];
  
  // Header
  csvRows.push('Metric,Value,Category');
  
  // Overview metrics
  csvRows.push(`Total Analyses,${data.overview.totalAnalyses},Overview`);
  csvRows.push(`Successful Analyses,${data.overview.successfulAnalyses},Overview`);
  csvRows.push(`Failed Analyses,${data.overview.failedAnalyses},Overview`);
  csvRows.push(`Success Rate,${data.overview.successRate}%,Overview`);
  csvRows.push(`Average Execution Time,${data.overview.avgExecutionTime}ms,Overview`);
  csvRows.push(`Max Execution Time,${data.overview.maxExecutionTime}ms,Overview`);
  csvRows.push(`Min Execution Time,${data.overview.minExecutionTime}ms,Overview`);
  
  // Issue analysis
  csvRows.push(`Total Issues Found,${data.issueAnalysis.totalIssuesFound},Issues`);
  
  Object.entries(data.issueAnalysis.issueTypes).forEach(([type, count]) => {
    csvRows.push(`${type},${count},Issue Types`);
  });
  
  Object.entries(data.issueAnalysis.severityDistribution).forEach(([severity, count]) => {
    csvRows.push(`${severity},${count},Severity`);
  });
  
  // Layer performance
  data.layerPerformance.forEach((layer: any) => {
    csvRows.push(`Layer ${layer.layerId} - ${layer.layerName} - Success Rate,${layer.successRate}%,Layer Performance`);
    csvRows.push(`Layer ${layer.layerId} - ${layer.layerName} - Avg Time,${layer.avgTime}ms,Layer Performance`);
    csvRows.push(`Layer ${layer.layerId} - ${layer.layerName} - Issues,${layer.issues},Layer Performance`);
  });
  
  // Usage patterns
  data.usagePatterns.usageByHour.forEach((hour: any) => {
    csvRows.push(`Hour ${hour.hour},${hour.count},Hourly Usage`);
  });
  
  data.usagePatterns.usageByDay.forEach((day: any) => {
    csvRows.push(`${day.day},${day.count},Daily Usage`);
  });
  
  // File analysis
  Object.entries(data.fileAnalysis.fileTypes).forEach(([fileType, count]) => {
    csvRows.push(`.${fileType},${count},File Types`);
  });
  
  // Code quality metrics (if available)
  if (data.codeQualityMetrics) {
    csvRows.push(`Code Quality Score,${data.codeQualityMetrics.qualityScore},Quality`);
    csvRows.push(`Improvement Rate,${data.codeQualityMetrics.improvementRate}%,Quality`);
    csvRows.push(`Maintainability Index,${data.codeQualityMetrics.maintainabilityIndex},Quality`);
    
    Object.entries(data.codeQualityMetrics.technicalDebt).forEach(([severity, count]) => {
      csvRows.push(`Technical Debt - ${severity},${count},Quality`);
    });
  }
  
  // Recommendations
  if (data.recommendations) {
    data.recommendations.forEach((recommendation: string, index: number) => {
      csvRows.push(`Recommendation ${index + 1},"${recommendation}",Recommendations`);
    });
  }
  
  return csvRows.join('\n');
}

function generatePDF(data: any, timeRange: string): string {
  // For now, return a simple HTML representation that can be converted to PDF
  // In a production environment, you'd use a proper PDF library like jsPDF or puppeteer
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Analytics Report - ${timeRange}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .metric { margin: 10px 0; }
        .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>NeuroLint Analytics Report</h1>
        <p>Time Range: ${timeRange}</p>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="section">
        <h2>Overview</h2>
        <div class="metric">Total Analyses: ${data.overview.totalAnalyses}</div>
        <div class="metric">Success Rate: ${data.overview.successRate}%</div>
        <div class="metric">Average Execution Time: ${data.overview.avgExecutionTime}ms</div>
        <div class="metric">Total Issues Found: ${data.issueAnalysis.totalIssuesFound}</div>
      </div>
      
      <div class="section">
        <h2>Issue Analysis</h2>
        <table class="table">
          <tr><th>Issue Type</th><th>Count</th></tr>
          ${Object.entries(data.issueAnalysis.issueTypes).map(([type, count]) => 
            `<tr><td>${type}</td><td>${count}</td></tr>`
          ).join('')}
        </table>
      </div>
      
      <div class="section">
        <h2>Layer Performance</h2>
        <table class="table">
          <tr><th>Layer</th><th>Success Rate</th><th>Avg Time</th><th>Issues</th></tr>
          ${data.layerPerformance.map((layer: any) => 
            `<tr><td>${layer.layerName}</td><td>${layer.successRate}%</td><td>${layer.avgTime}ms</td><td>${layer.issues}</td></tr>`
          ).join('')}
        </table>
      </div>
      
      ${data.recommendations ? `
        <div class="section">
          <h2>Recommendations</h2>
          <ul>
            ${data.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </body>
    </html>
  `;
  
  // For now, return HTML content
  // In production, you'd convert this to PDF using a library
  return htmlContent;
} 