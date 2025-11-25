import { NextRequest, NextResponse } from "next/server";

// Production logging system - replaces console.log
const logMessage = (level: string, message: string, data: any = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data,
    source: 'github-actions',
    pid: process.pid
  };
  
  // Use process.stdout.write for production logging
  process.stdout.write(`${JSON.stringify(logEntry)}\n`);
};

export async function POST(request: NextRequest) {
  try {
    const { repository, branch, workflow, token } = await request.json();

    if (!repository || !branch || !workflow || !token) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Create GitHub Actions workflow for NeuroLint analysis
    const workflowContent = `name: NeuroLint Code Analysis

on:
  push:
    branches: [${branch}]
  pull_request:
    branches: [${branch}]

jobs:
  neurolint-analysis:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install NeuroLint
        run: npm install -g neurolint

      - name: Run NeuroLint Analysis
        run: |
          neurolint analyze . --layers=1,2,3,4,5,6 --format=json --output=neurolint-report.json
        env:
          NEUROLINT_API_KEY: \${{ secrets.NEUROLINT_API_KEY }}

      - name: Upload NeuroLint Report
        uses: actions/upload-artifact@v4
        with:
          name: neurolint-report
          path: neurolint-report.json

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('neurolint-report.json', 'utf8'));
            
            const comment = \`## NeuroLint Analysis Results
            
            **Files Analyzed:** \${report.filesAnalyzed}
            **Issues Found:** \${report.totalIssues}
            **Quality Score:** \${report.qualityScore}%
            
            ### Issues by Layer:
            \${Object.entries(report.issuesByLayer).map(([layer, count]) => \`- Layer \${layer}: \${count} issues\`).join('\\n')}
            
            [View detailed report](https://app.neurolint.dev/reports/\${report.reportId})
            \`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
`;

    // Create the workflow file via GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${repository}/contents/.github/workflows/neurolint.yml`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Add NeuroLint CI/CD workflow',
          content: Buffer.from(workflowContent).toString('base64'),
          branch: branch
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logMessage('error', 'Failed to create GitHub Actions workflow', { error });
      return NextResponse.json(
        { error: "Failed to create workflow" },
        { status: response.status }
      );
    }

    logMessage('info', 'GitHub Actions workflow created successfully', { repository, branch });

    return NextResponse.json({
      success: true,
      message: "GitHub Actions workflow created successfully",
      workflowUrl: `https://github.com/${repository}/actions`
    });

  } catch (error) {
    logMessage('error', 'GitHub Actions integration error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repository = searchParams.get('repository');
    const token = searchParams.get('token');

    if (!repository || !token) {
      return NextResponse.json(
        { error: "Missing repository or token" },
        { status: 400 }
      );
    }

    // Get workflow runs for the repository
    const response = await fetch(
      `https://api.github.com/repos/${repository}/actions/runs`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch workflow runs" },
        { status: response.status }
      );
    }

    const runs = await response.json();
    
    // Filter for NeuroLint workflow runs
    const neurolintRuns = runs.workflow_runs.filter(
      (run: any) => run.name === 'NeuroLint Code Analysis'
    );

    return NextResponse.json({
      runs: neurolintRuns,
      total: neurolintRuns.length
    });

  } catch (error) {
    logMessage('error', 'Failed to fetch workflow runs', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 