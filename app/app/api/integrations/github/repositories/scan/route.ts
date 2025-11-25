import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "../../../../../../lib/auth-middleware";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RepositoryScanRequest {
  repositoryId: number;
  repositoryName: string;
  branch: string;
  files: Array<{
    name: string;
    path: string;
    downloadUrl: string;
    size: number;
    sha: string;
  }>;
}

interface AnalysisResult {
  file: string;
  success: boolean;
  layers: number[];
  originalCode: string;
  transformed: string;
  analysis: {
    recommendedLayers: number[];
    detectedIssues: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      line?: number;
      column?: number;
      rule: string;
      fixAvailable: boolean;
    }>;
    confidence: number;
    estimatedImpact: {
      level: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      estimatedFixTime: string;
    };
    components?: Array<{
      name: string;
      type: string;
      hooks: string[];
      props: string[];
      issues: string[];
    }>;
    technicalDebt: {
      score: number; // 0-100 scale
      category: 'excellent' | 'good' | 'moderate' | 'high' | 'critical';
      factors: Array<{
        factor: string;
        impact: number;
        description: string;
      }>;
    };
  };
  totalExecutionTime: number;
  error?: string;
}

interface ScanResult {
  repositoryId: number;
  repositoryName: string;
  branch: string;
  scanId: string;
  startedAt: string;
  completedAt?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  results: AnalysisResult[];
  summary: {
    totalFiles: number;
    analyzedFiles: number;
    issuesFound: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    averageTechnicalDebt: number;
    estimatedFixTime: string;
    modernizationPriority: Array<{
      layer: number;
      description: string;
      files: number;
      priority: 'critical' | 'high' | 'medium' | 'low';
    }>;
  };
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    layers: number[];
  }>;
}

// POST /api/integrations/github/repositories/scan - Start comprehensive repository scan
export const POST = createAuthenticatedHandler(async (request, user) => {
  try {
    const {
      repositoryId,
      repositoryName,
      branch,
      files
    }: RepositoryScanRequest = await request.json();

    if (!repositoryId || !repositoryName || !files?.length) {
      return NextResponse.json(
        { error: "Repository details and files are required" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("x-github-token");
    if (!authHeader) {
      return NextResponse.json(
        { error: "GitHub access token required" },
        { status: 401 }
      );
    }

    // Check user's plan limits
    const planLimits = getPlanLimits(user.plan || 'free');
    if (planLimits.maxFilesPerScan > 0 && files.length > planLimits.maxFilesPerScan) {
      return NextResponse.json(
        {
          error: `File limit exceeded. Your ${user.plan || 'free'} plan allows ${planLimits.maxFilesPerScan} files per scan, but ${files.length} files were found.`,
          planDescription: planLimits.description,
          upgradeUrl: "https://neurolint.dev/pricing"
        },
        { status: 403 }
      );
    }

    // Check monthly usage limits (if applicable)
    if (planLimits.monthlyFixLimit > 0) {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      const { data: monthlyUsage, error: usageError } = await supabase
        .from('github_scanner_usage')
        .select('files_analyzed')
        .eq('user_id', user.id)
        .gte('created_at', `${currentMonth}-01T00:00:00.000Z`)
        .lt('created_at', `${currentMonth}-31T23:59:59.999Z`);

      if (!usageError && monthlyUsage) {
        const currentMonthUsage = monthlyUsage.reduce((sum, record) => sum + (record.files_analyzed || 0), 0);
        const remainingFixes = planLimits.monthlyFixLimit - currentMonthUsage;

        if (files.length > remainingFixes) {
          return NextResponse.json(
            {
              error: `Monthly fix limit would be exceeded. You have ${remainingFixes} fixes remaining this month (${planLimits.monthlyFixLimit} total for ${user.plan || 'free'} plan).`,
              remainingFixes,
              monthlyLimit: planLimits.monthlyFixLimit,
              currentUsage: currentMonthUsage,
              upgradeUrl: "https://neurolint.dev/pricing"
            },
            { status: 403 }
          );
        }
      }
    }

    // Generate scan ID and create initial scan record
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scanResult: ScanResult = {
      repositoryId,
      repositoryName,
      branch,
      scanId,
      startedAt: new Date().toISOString(),
      status: 'running',
      progress: { current: 0, total: files.length, percentage: 0 },
      results: [],
      summary: {
        totalFiles: files.length,
        analyzedFiles: 0,
        issuesFound: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        averageTechnicalDebt: 0,
        estimatedFixTime: '0m',
        modernizationPriority: []
      },
      recommendations: []
    };

    // Store initial scan record in database
    await supabase.from('repository_scans').insert({
      id: scanId,
      user_id: user.id,
      repository_id: repositoryId,
      repository_name: repositoryName,
      repository_full_name: repositoryName,
      branch,
      status: 'running',
      started_at: scanResult.startedAt,
      progress: scanResult.progress,
      scan_data: scanResult
    });

    // Start background scan process with user context
    processRepositoryScan(scanId, files, authHeader, user.plan || 'free', user.id).catch(error => {
      console.error(`Background scan failed for ${scanId}:`, error);
    });

    return NextResponse.json({
      scanId,
      status: 'started',
      message: 'Repository scan started successfully',
      estimatedTime: Math.ceil(files.length * 2), // 2 seconds per file estimate
      progress: scanResult.progress
    });

  } catch (error) {
    console.error("Repository scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

// GET /api/integrations/github/repositories/scan?scanId=... - Get scan progress/results
export const GET = createAuthenticatedHandler(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const scanId = searchParams.get('scanId');

    if (!scanId) {
      return NextResponse.json(
        { error: 'Scan ID is required' },
        { status: 400 }
      );
    }

    // Fetch scan from database
    const { data: scan, error } = await supabase
      .from('repository_scans')
      .select('*')
      .eq('id', scanId)
      .eq('user_id', user.id)
      .single();

    if (error || !scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(scan.scan_data);

  } catch (error) {
    console.error("Get scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

async function processRepositoryScan(
  scanId: string,
  files: any[],
  githubToken: string,
  userPlan: string,
  userId: string
) {
  try {
    const results: AnalysisResult[] = [];
    let processedFiles = 0;

    for (const file of files) {
      try {
        // Fetch file content from GitHub
        const fileResponse = await fetch(file.downloadUrl, {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'User-Agent': 'NeuroLint-Pro/1.0'
          }
        });

        if (!fileResponse.ok) {
          throw new Error(`Failed to fetch file: ${file.path}`);
        }

        const fileContent = await fileResponse.text();

        // Run NeuroLint analysis
        const analysisResult = await analyzeFileWithNeuroLint(
          fileContent,
          file.path,
          userPlan
        );

        results.push(analysisResult);
        processedFiles++;

        // Update progress in database
        const progress = {
          current: processedFiles,
          total: files.length,
          percentage: Math.round((processedFiles / files.length) * 100)
        };

        await updateScanProgress(scanId, progress, results);

      } catch (error) {
        console.error(`Failed to analyze ${file.path}:`, error);
        results.push({
          file: file.path,
          success: false,
          layers: [],
          originalCode: '',
          transformed: '',
          analysis: {
            recommendedLayers: [],
            detectedIssues: [],
            confidence: 0,
            estimatedImpact: {
              level: 'low',
              description: 'Analysis failed',
              estimatedFixTime: '0m'
            },
            technicalDebt: {
              score: 0,
              category: 'excellent',
              factors: []
            }
          },
          totalExecutionTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        processedFiles++;
      }
    }

    // Calculate final summary and recommendations
    const summary = calculateScanSummary(results);
    const recommendations = generateRecommendations(results);

    // Calculate usage metrics for billing
    const successfulAnalyses = results.filter(r => r.success).length;
    const creditsUsed = calculateCreditsUsed(successfulAnalyses, userPlan);
    const costUsd = creditsUsed * 0.01; // $0.01 per credit

    // Store usage data
    await supabase.from('github_scanner_usage').insert({
      user_id: userId,
      scan_id: scanId,
      files_analyzed: successfulAnalyses,
      credits_used: creditsUsed,
      cost_usd: costUsd,
      plan_type: userPlan
    });

    // Mark scan as completed with full scan data
    const completedScanData = {
      repositoryId: scanId,
      repositoryName: files[0]?.path?.split('/')[0] || 'unknown',
      branch: 'main',
      scanId,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'completed' as const,
      progress: { current: files.length, total: files.length, percentage: 100 },
      results,
      summary,
      recommendations
    };

    await supabase.from('repository_scans').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      scan_data: completedScanData
    }).eq('id', scanId);

  } catch (error) {
    console.error(`Scan processing failed for ${scanId}:`, error);
    
    // Mark scan as failed
    await supabase.from('repository_scans').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : 'Unknown error'
    }).eq('id', scanId);
  }
}

async function analyzeFileWithNeuroLint(
  code: string,
  filePath: string,
  userPlan: string
): Promise<AnalysisResult> {
  const startTime = Date.now();

  try {
    // Import NeuroLint engine dynamically
    const NeuroLintProEnhanced = require('../../../../../../neurolint-pro.js');

    // Determine available layers based on user plan
    const availableLayers = getAvailableLayersForPlan(userPlan);

    // Run NeuroLint analysis with dry-run mode
    const result = await NeuroLintProEnhanced(
      code,
      filePath,
      true, // dry run for analysis only
      availableLayers,
      {
        verbose: true,
        userTier: userPlan,
        enhanced: true,
        githubScan: true
      }
    );

    const executionTime = Date.now() - startTime;

    // Process and structure the analysis results
    const detectedIssues = processDetectedIssues(result.analysis?.detectedIssues || []);
    const technicalDebtScore = calculateTechnicalDebtScore(detectedIssues);
    const recommendedLayers = result.analysis?.recommendedLayers || result.layers || [];
    const confidence = calculateConfidenceScore(result.analysis);
    const estimatedImpact = calculateEstimatedImpact(detectedIssues);

    return {
      file: filePath,
      success: result.success || false,
      layers: result.layers || [],
      originalCode: code,
      transformed: result.transformed || code,
      analysis: {
        recommendedLayers,
        detectedIssues,
        confidence,
        estimatedImpact,
        components: result.analysis?.components || [],
        technicalDebt: technicalDebtScore
      },
      totalExecutionTime: executionTime,
      error: result.error
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error';

    console.error(`NeuroLint analysis failed for ${filePath}:`, error);

    return {
      file: filePath,
      success: false,
      layers: [],
      originalCode: code,
      transformed: code,
      analysis: {
        recommendedLayers: [],
        detectedIssues: [],
        confidence: 0,
        estimatedImpact: {
          level: 'low',
          description: 'Analysis failed',
          estimatedFixTime: '0m'
        },
        technicalDebt: {
          score: 0,
          category: 'excellent',
          factors: [{ factor: 'Analysis Error', impact: 0, description: errorMessage }]
        }
      },
      totalExecutionTime: executionTime,
      error: errorMessage
    };
  }
}

function processDetectedIssues(issues: any[]): Array<{
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  line?: number;
  column?: number;
  rule: string;
  fixAvailable: boolean;
}> {
  return issues.map(issue => ({
    type: issue.type || issue.rule || 'Unknown Issue',
    severity: issue.severity || 'medium',
    description: issue.description || issue.message || 'No description available',
    line: issue.line || issue.loc?.line,
    column: issue.column || issue.loc?.column,
    rule: issue.rule || issue.type || 'unknown-rule',
    fixAvailable: issue.fixAvailable !== false // Default to true unless explicitly false
  }));
}

function calculateTechnicalDebtScore(detectedIssues: any[]) {
  let score = 100; // Start with perfect score
  const factors: Array<{ factor: string; impact: number; description: string }> = [];

  detectedIssues.forEach((issue) => {
    let impact = 0;
    switch (issue.severity) {
      case 'critical': impact = 25; break;
      case 'high': impact = 15; break;
      case 'medium': impact = 8; break;
      case 'low': impact = 3; break;
      default: impact = 5; break;
    }
    score = Math.max(0, score - impact);
    factors.push({
      factor: issue.type || 'Unknown Issue',
      impact,
      description: issue.description || 'No description available'
    });
  });

  let category: 'excellent' | 'good' | 'moderate' | 'high' | 'critical';
  if (score >= 90) category = 'excellent';
  else if (score >= 75) category = 'good';
  else if (score >= 60) category = 'moderate';
  else if (score >= 40) category = 'high';
  else category = 'critical';

  return { score: Math.round(score), category, factors };
}

function calculateConfidenceScore(analysis: any): number {
  if (!analysis) return 0;

  let confidence = 50; // Base confidence

  // Increase confidence based on successful analysis components
  if (analysis.components?.length > 0) confidence += 20;
  if (analysis.detectedIssues?.length > 0) confidence += 15;
  if (analysis.performanceMetrics) confidence += 10;
  if (analysis.dataFlow?.length > 0) confidence += 5;

  return Math.min(100, confidence) / 100;
}

function calculateEstimatedImpact(detectedIssues: any[]) {
  const criticalCount = detectedIssues.filter(i => i.severity === 'critical').length;
  const highCount = detectedIssues.filter(i => i.severity === 'high').length;
  const totalIssues = detectedIssues.length;

  let level: 'low' | 'medium' | 'high' | 'critical';
  let description: string;
  let estimatedFixTime: string;

  if (criticalCount > 0) {
    level = 'critical';
    description = `${criticalCount} critical issues requiring immediate attention`;
    estimatedFixTime = `${Math.ceil(criticalCount * 30 + highCount * 15 + (totalIssues - criticalCount - highCount) * 5 / 60)}h`;
  } else if (highCount > 2) {
    level = 'high';
    description = `${highCount} high priority issues affecting code quality`;
    estimatedFixTime = `${Math.ceil(highCount * 15 + (totalIssues - highCount) * 5 / 60)}h`;
  } else if (totalIssues > 5) {
    level = 'medium';
    description = `${totalIssues} issues found, moderate modernization needed`;
    estimatedFixTime = `${Math.ceil(totalIssues * 5)}m`;
  } else {
    level = 'low';
    description = totalIssues > 0 ? `${totalIssues} minor issues` : 'Code appears to be well-structured';
    estimatedFixTime = totalIssues > 0 ? `${totalIssues * 5}m` : '0m';
  }

  return { level, description, estimatedFixTime };
}

function calculateScanSummary(results: AnalysisResult[]) {
  const totalFiles = results.length;
  const analyzedFiles = results.filter(r => r.success).length;
  
  let issuesFound = 0;
  let criticalIssues = 0;
  let highIssues = 0;
  let mediumIssues = 0;
  let lowIssues = 0;
  let totalDebtScore = 0;

  results.forEach(result => {
    if (result.analysis?.detectedIssues) {
      issuesFound += result.analysis.detectedIssues.length;
      result.analysis.detectedIssues.forEach(issue => {
        switch (issue.severity) {
          case 'critical': criticalIssues++; break;
          case 'high': highIssues++; break;
          case 'medium': mediumIssues++; break;
          case 'low': lowIssues++; break;
        }
      });
    }
    totalDebtScore += result.analysis?.technicalDebt?.score || 100;
  });

  const averageTechnicalDebt = analyzedFiles > 0 ? Math.round(totalDebtScore / analyzedFiles) : 100;
  const estimatedFixTime = calculateEstimatedFixTime(issuesFound, criticalIssues, highIssues);

  return {
    totalFiles,
    analyzedFiles,
    issuesFound,
    criticalIssues,
    highIssues,
    mediumIssues,
    lowIssues,
    averageTechnicalDebt,
    estimatedFixTime,
    modernizationPriority: generateModernizationPriority(results)
  };
}

function generateRecommendations(results: AnalysisResult[]) {
  const recommendations = [];

  // Analyze patterns across all files
  const layerFrequency = new Map<number, number>();
  const issueTypes = new Map<string, number>();

  results.forEach(result => {
    result.analysis?.recommendedLayers?.forEach(layer => {
      layerFrequency.set(layer, (layerFrequency.get(layer) || 0) + 1);
    });
    
    result.analysis?.detectedIssues?.forEach(issue => {
      issueTypes.set(issue.type, (issueTypes.get(issue.type) || 0) + 1);
    });
  });

  // Generate recommendations based on patterns
  if (layerFrequency.get(5) && layerFrequency.get(5)! > results.length * 0.3) {
    recommendations.push({
      title: 'Migrate to Next.js App Router',
      description: 'Over 30% of your files could benefit from App Router migration for better performance and developer experience.',
      priority: 'high' as const,
      effort: 'high' as const,
      impact: 'high' as const,
      layers: [5]
    });
  }

  if (layerFrequency.get(3) && layerFrequency.get(3)! > results.length * 0.4) {
    recommendations.push({
      title: 'Fix Component Issues',
      description: 'Many components have missing keys, accessibility issues, or missing React imports.',
      priority: 'medium' as const,
      effort: 'medium' as const,
      impact: 'medium' as const,
      layers: [3]
    });
  }

  return recommendations;
}

function getPlanLimits(plan: string) {
  // Limits based on Final NeuroLint Pro Development and Deployment Roadmap
  const limits = {
    free: {
      maxFilesPerScan: 200,
      availableLayers: [1], // Free tier: Layer 1 only (regex)
      monthlyFixLimit: 50,
      costPerFix: 0,
      description: "50 fixes/month, Layer 1 regex only"
    },
    basic: {
      maxFilesPerScan: 100,
      availableLayers: [1, 2], // Basic: Layers 1-2 (regex)
      monthlyFixLimit: 2000,
      costPerFix: 0.005, // $9/month ÷ 2000 fixes
      description: "2,000 fixes/month, Layers 1-2 regex"
    },
    professional: {
      maxFilesPerScan: 500,
      availableLayers: [1, 2, 3, 4], // Professional: Layers 1-4 (AST-based)
      monthlyFixLimit: -1, // Unlimited
      costPerFix: 0.01,
      description: "Unlimited fixes, Layers 1-4 AST-based"
    },
    business: {
      maxFilesPerScan: 1000,
      availableLayers: [1, 2, 3, 4, 5], // Business: Add Layer 5, API access
      monthlyFixLimit: -1, // Unlimited
      costPerFix: 0.007,
      description: "Unlimited fixes, Layers 1-5, API access"
    },
    enterprise: {
      maxFilesPerScan: -1,
      availableLayers: [1, 2, 3, 4, 5, 6], // Enterprise: All layers, custom rules
      monthlyFixLimit: -1, // Unlimited
      costPerFix: 0.005,
      description: "Unlimited fixes, all layers, custom rules"
    },
    premium: {
      maxFilesPerScan: -1,
      availableLayers: [1, 2, 3, 4, 5, 6], // Premium: Unlimited, white-glove support
      monthlyFixLimit: -1, // Unlimited
      costPerFix: 0.003,
      description: "Unlimited fixes, white-glove support"
    }
  };
  return limits[plan as keyof typeof limits] || limits.free;
}

function calculateCreditsUsed(filesAnalyzed: number, userPlan: string): number {
  const planLimits = getPlanLimits(userPlan);

  // Each file analysis counts as one "fix" for billing purposes
  const fixesUsed = filesAnalyzed;

  // Check monthly limits
  if (planLimits.monthlyFixLimit > 0 && fixesUsed > planLimits.monthlyFixLimit) {
    throw new Error(
      `Monthly fix limit exceeded. Your ${userPlan} plan allows ${planLimits.monthlyFixLimit} fixes per month, but ${fixesUsed} files were requested.`
    );
  }

  // For free tier, first 5 fixes are free per month
  if (userPlan === 'free') {
    return Math.max(0, fixesUsed - 5);
  }

  // For paid plans, calculate cost based on plan pricing
  return Math.ceil(fixesUsed * planLimits.costPerFix * 100); // Convert to credits (cents)
}

function getAvailableLayersForPlan(plan: string): number[] {
  return getPlanLimits(plan).availableLayers;
}

function calculateEstimatedFixTime(total: number, critical: number, high: number): string {
  const minutes = (critical * 30) + (high * 15) + ((total - critical - high) * 5);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60 * 10) / 10;
  return `${hours}h`;
}

function generateModernizationPriority(results: AnalysisResult[]) {
  const layerStats = new Map<number, { files: number; priority: string }>();
  
  results.forEach(result => {
    result.analysis?.recommendedLayers?.forEach(layer => {
      const current = layerStats.get(layer) || { files: 0, priority: 'low' };
      current.files++;
      layerStats.set(layer, current);
    });
  });

  const layerDescriptions = {
    1: 'Configuration modernization',
    2: 'Code patterns & imports',
    3: 'Component fixes',
    4: 'Hydration safety',
    5: 'Next.js App Router',
    6: 'Testing & TypeScript'
  };

  return Array.from(layerStats.entries()).map(([layer, stats]) => ({
    layer,
    description: layerDescriptions[layer as keyof typeof layerDescriptions] || 'Unknown',
    files: stats.files,
    priority: stats.files > results.length * 0.3 ? 'high' : 
             stats.files > results.length * 0.1 ? 'medium' : 'low'
  })) as Array<{
    layer: number;
    description: string;
    files: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
  }>;
}

async function updateScanProgress(scanId: string, progress: any, results: AnalysisResult[]) {
  await supabase.from('repository_scans').update({
    progress,
    scan_data: { progress, results }
  }).eq('id', scanId);
}
