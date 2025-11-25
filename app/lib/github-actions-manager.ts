import githubApiClient from './github-api-client';

interface WorkflowConfig {
  name: string;
  description: string;
  triggers: ('push' | 'pull_request')[];
  branches: string[];
  layers: number[];
  autoFix: boolean;
  commentOnPR: boolean;
  failOnIssues: boolean;
  customRules?: string[];
}

interface WorkflowResult {
  success: boolean;
  workflowUrl?: string;
  error?: string;
  workflowId?: string;
}

class GitHubActionsManager {
  private readonly WORKFLOW_TEMPLATES = {
    basic: this.generateBasicWorkflow,
    advanced: this.generateAdvancedWorkflow,
    enterprise: this.generateEnterpriseWorkflow
  };

  /**
   * Create or update NeuroLint workflow in repository
   */
  async createWorkflow(
    owner: string,
    repo: string,
    token: string,
    config: WorkflowConfig,
    branch: string = 'main'
  ): Promise<WorkflowResult> {
    try {
      // Generate workflow content
      const workflowContent = this.generateWorkflowContent(config);
      
      // Create workflow file
      const response = await githubApiClient.createOrUpdateFile(
        owner,
        repo,
        '.github/workflows/neurolint.yml',
        workflowContent,
        `Add NeuroLint CI/CD workflow: ${config.name}`,
        branch,
        token
      );

      return {
        success: true,
        workflowUrl: `https://github.com/${owner}/${repo}/actions`,
        workflowId: response.data.sha
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create workflow'
      };
    }
  }

  /**
   * Get workflow runs for a repository
   */
  async getWorkflowRuns(
    owner: string,
    repo: string,
    token: string,
    workflowId?: string
  ): Promise<any[]> {
    try {
      const endpoint = workflowId 
        ? `/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs`
        : `/repos/${owner}/${repo}/actions/runs`;

      const response = await githubApiClient.request<any>(endpoint, token);
      
      // Filter for NeuroLint workflow runs
      return response.data.workflow_runs.filter((run: any) => 
        run.name.includes('NeuroLint') || run.path?.includes('neurolint.yml')
      );
    } catch (error) {
      console.error('Failed to get workflow runs:', error);
      return [];
    }
  }

  /**
   * Get workflow run details
   */
  async getWorkflowRun(
    owner: string,
    repo: string,
    runId: string,
    token: string
  ): Promise<any> {
    try {
      const response = await githubApiClient.request<any>(
        `/repos/${owner}/${repo}/actions/runs/${runId}`,
        token
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get workflow run:', error);
      return null;
    }
  }

  /**
   * Get workflow run logs
   */
  async getWorkflowLogs(
    owner: string,
    repo: string,
    runId: string,
    token: string
  ): Promise<string> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/logs`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'NeuroLint-Pro/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }

      return response.text();
    } catch (error) {
      console.error('Failed to get workflow logs:', error);
      return '';
    }
  }

  /**
   * Re-run a failed workflow
   */
  async rerunWorkflow(
    owner: string,
    repo: string,
    runId: string,
    token: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/rerun`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'NeuroLint-Pro/1.0'
          }
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to rerun workflow:', error);
      return false;
    }
  }

  /**
   * Delete workflow file
   */
  async deleteWorkflow(
    owner: string,
    repo: string,
    token: string,
    branch: string = 'main'
  ): Promise<boolean> {
    try {
      // First get the current file to get its SHA
      const fileResponse = await githubApiClient.getFileContent(
        owner, repo, '.github/workflows/neurolint.yml', token, branch
      );

      // Delete the file
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows/neurolint.yml`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'NeuroLint-Pro/1.0'
          },
          body: JSON.stringify({
            message: 'Remove NeuroLint CI/CD workflow',
            sha: fileResponse.data.sha,
            branch
          })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      return false;
    }
  }

  /**
   * Generate workflow content based on configuration
   */
  private generateWorkflowContent(config: WorkflowConfig): string {
    const template = config.layers.length > 4 ? 'enterprise' : 
                    config.layers.length > 2 ? 'advanced' : 'basic';
    
    return this.WORKFLOW_TEMPLATES[template](config);
  }

  /**
   * Generate basic workflow template
   */
  private generateBasicWorkflow(config: WorkflowConfig): string {
    return `name: ${config.name}

on:
${config.triggers.map(trigger => `  ${trigger}:
    branches: [${config.branches.map(b => `'${b}'`).join(', ')}]`).join('\n')}

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
          neurolint analyze . --layers=${config.layers.join(',')} --format=json --output=neurolint-report.json
        env:
          NEUROLINT_API_KEY: \${{ secrets.NEUROLINT_API_KEY }}

      - name: Upload NeuroLint Report
        uses: actions/upload-artifact@v4
        with:
          name: neurolint-report
          path: neurolint-report.json

${config.commentOnPR ? this.generatePRCommentStep() : ''}
${config.failOnIssues ? this.generateFailStep() : ''}`;
  }

  /**
   * Generate advanced workflow template
   */
  private generateAdvancedWorkflow(config: WorkflowConfig): string {
    return `name: ${config.name}

on:
${config.triggers.map(trigger => `  ${trigger}:
    branches: [${config.branches.map(b => `'${b}'`).join(', ')}]`).join('\n')}

jobs:
  neurolint-analysis:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js \${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: \${{ runner.os }}-node-\${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            \${{ runner.os }}-node-

      - name: Install NeuroLint
        run: npm install -g neurolint

      - name: Run NeuroLint Analysis
        run: |
          neurolint analyze . --layers=${config.layers.join(',')} --format=json --output=neurolint-report.json
        env:
          NEUROLINT_API_KEY: \${{ secrets.NEUROLINT_API_KEY }}

      - name: Upload NeuroLint Report
        uses: actions/upload-artifact@v4
        with:
          name: neurolint-report-\${{ matrix.node-version }}
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

${config.failOnIssues ? this.generateFailStep() : ''}`;
  }

  /**
   * Generate enterprise workflow template
   */
  private generateEnterpriseWorkflow(config: WorkflowConfig): string {
    return `name: ${config.name}

on:
${config.triggers.map(trigger => `  ${trigger}:
    branches: [${config.branches.map(b => `'${b}'`).join(', ')}]`).join('\n')}

env:
  NEUROLINT_API_KEY: \${{ secrets.NEUROLINT_API_KEY }}
  NEUROLINT_CONFIG: \${{ secrets.NEUROLINT_CONFIG }}

jobs:
  neurolint-analysis:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          npm install -g neurolint

      - name: Run NeuroLint Analysis
        run: |
          neurolint analyze . \\
            --layers=${config.layers.join(',')} \\
            --format=json \\
            --output=neurolint-report.json \\
            --config=\${{ env.NEUROLINT_CONFIG }} \\
            --parallel=4

      - name: Upload NeuroLint Report
        uses: actions/upload-artifact@v4
        with:
          name: neurolint-report
          path: neurolint-report.json
          retention-days: 30

      - name: Generate Analysis Summary
        run: |
          node -e "
            const report = JSON.parse(require('fs').readFileSync('neurolint-report.json', 'utf8'));
            const summary = {
              totalFiles: report.filesAnalyzed,
              totalIssues: report.totalIssues,
              qualityScore: report.qualityScore,
              criticalIssues: report.issuesByLayer[6] || 0,
              highIssues: report.issuesByLayer[5] || 0,
              mediumIssues: report.issuesByLayer[4] || 0,
              lowIssues: report.issuesByLayer[3] || 0,
              timestamp: new Date().toISOString()
            };
            require('fs').writeFileSync('analysis-summary.json', JSON.stringify(summary, null, 2));
          "

      - name: Upload Analysis Summary
        uses: actions/upload-artifact@v4
        with:
          name: analysis-summary
          path: analysis-summary.json

      - name: Comment PR with detailed results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('neurolint-report.json', 'utf8'));
            const summary = JSON.parse(fs.readFileSync('analysis-summary.json', 'utf8'));
            
            const comment = \`## NeuroLint Enterprise Analysis Results
            
            ### Summary
            - **Files Analyzed:** \${summary.totalFiles}
            - **Total Issues:** \${summary.totalIssues}
            - **Quality Score:** \${summary.qualityScore}%
            - **Analysis Time:** \${new Date().toLocaleString()}
            
            ### Issues by Severity
            - 🔴 Critical: \${summary.criticalIssues}
            - 🟠 High: \${summary.highIssues}
            - 🟡 Medium: \${summary.mediumIssues}
            - 🟢 Low: \${summary.lowIssues}
            
            ### Issues by Layer
            \${Object.entries(report.issuesByLayer).map(([layer, count]) => \`- Layer \${layer}: \${count} issues\`).join('\\n')}
            
            [View detailed report](https://app.neurolint.dev/reports/\${report.reportId})
            \`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });

${config.failOnIssues ? this.generateFailStep() : ''}`;
  }

  /**
   * Generate PR comment step
   */
  private generatePRCommentStep(): string {
    return `
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
            
            [View detailed report](https://app.neurolint.dev/reports/\${report.reportId})
            \`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });`;
  }

  /**
   * Generate fail step
   */
  private generateFailStep(): string {
    return `
      - name: Fail on critical issues
        run: |
          node -e "
            const report = JSON.parse(require('fs').readFileSync('neurolint-report.json', 'utf8'));
            const criticalIssues = report.issuesByLayer[6] || 0;
            if (criticalIssues > 0) {
              console.error(\`Found \${criticalIssues} critical issues. Failing build.\`);
              process.exit(1);
            }
          "`;
  }
}

export const githubActionsManager = new GitHubActionsManager();
export default githubActionsManager; 