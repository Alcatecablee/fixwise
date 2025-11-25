import * as vscode from "vscode";
import * as path from "path";

export class NeuroLintWebview {
  private panel: vscode.WebviewPanel | undefined;
  private disposables: vscode.Disposable[] = [];

  public showAnalysisResults(results: any): void {
    this.createWebview("NeuroLint Analysis Results", "analysis");
    if (this.panel) {
      this.panel.webview.html = this.generateEnhancedAnalysisHtml(results);
    }
  }

  public showTechnicalDebtHeatmap(data: any): void {
    this.createWebview("NeuroLint Technical Debt Heatmap", "heatmap");
    if (this.panel) {
      this.panel.webview.html = this.generateHeatmapHtml(data);
    }
  }

  public showPerformanceMetrics(metrics: any): void {
    this.createWebview("NeuroLint Performance Metrics", "metrics");
    if (this.panel) {
      this.panel.webview.html = this.generateMetricsHtml(metrics);
    }
  }

  public showModernizationPlan(plan: any): void {
    this.createWebview("NeuroLint Modernization Plan", "plan");
    if (this.panel) {
      this.panel.webview.html = this.generateModernizationPlanHtml(plan);
    }
  }

  public showWorkspaceResults(results: any[]): void {
    this.createWebview("NeuroLint Workspace Analysis", "workspace");
    if (this.panel) {
      this.panel.webview.html = this.generateWorkspaceHtml(results);
    }
  }

  public showDiffView(
    original: string,
    modified: string,
    fileName: string,
  ): void {
    this.createWebview(`NeuroLint Changes: ${fileName}`, "diff");
    if (this.panel) {
      this.panel.webview.html = this.generateDiffHtml(
        original,
        modified,
        fileName,
      );
    }
  }

  private createWebview(title: string, viewType: string): void {
    // Close existing panel if open
    if (this.panel) {
      this.panel.dispose();
    }

    this.panel = vscode.window.createWebviewPanel(
      `neurolint.${viewType}`,
      title,
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [],
      },
    );

    // Handle disposal
    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
        this.disposables.forEach((d) => d.dispose());
        this.disposables = [];
      },
      null,
      this.disposables,
    );

    // Handle webview messages
    this.panel.webview.onDidReceiveMessage(
      (message: any) => this.handleWebviewMessage(message),
      undefined,
      this.disposables,
    );
  }

  private generateEnhancedAnalysisHtml(results: any): string {
    const analysis = results.analysis || {};
    const layers = results.layers || [];
    const performance = results.performance || {};
    const errors = results.errors || [];
    const components = analysis.components || [];
    const dataFlow = analysis.dataFlow || {};
    const performanceMetrics = analysis.performanceMetrics || {};
    const legacyPatterns = analysis.legacyPatterns || [];
    const modernPatterns = analysis.modernPatterns || [];

    return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>NeuroLint Enhanced Analysis Results</title>
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <style>
                    ${this.getEnhancedStyles()}
                </style>
            </head>
            <body>
                <div class="container">
                    <header class="analysis-header">
                        <h1>NeuroLint Enhanced Analysis</h1>
                        <div class="analysis-meta">
                            <span class="meta-item">Confidence: ${Math.round((analysis.confidence || 0) * 100)}%</span>
                            <span class="meta-item">Components: ${components.length}</span>
                            <span class="meta-item">Legacy Patterns: ${legacyPatterns.length}</span>
                            <span class="meta-item">Modern Patterns: ${modernPatterns.length}</span>
                        </div>
                    </header>

                    <div class="dashboard-grid">
                        <div class="card overview-card">
                            <h2>Technical Debt Overview</h2>
                            <div class="debt-score">
                                <div class="score-circle">
                                    <span class="score-value">${this.calculateTechnicalDebtScore(analysis)}</span>
                                    <span class="score-label">Debt Score</span>
                                </div>
                            </div>
                            <div class="debt-breakdown">
                                <div class="debt-item critical">
                                    <span class="debt-count">${this.countIssuesBySeverity(analysis, 'critical')}</span>
                                    <span class="debt-label">Critical Issues</span>
                                </div>
                                <div class="debt-item warning">
                                    <span class="debt-count">${this.countIssuesBySeverity(analysis, 'warning')}</span>
                                    <span class="debt-label">Warnings</span>
                                </div>
                                <div class="debt-item info">
                                    <span class="debt-count">${this.countIssuesBySeverity(analysis, 'info')}</span>
                                    <span class="debt-label">Suggestions</span>
                                </div>
                            </div>
                        </div>

                        <div class="card performance-card">
                            <h2>Performance Metrics</h2>
                            <div class="metrics-grid">
                                <div class="metric">
                                    <div class="metric-value">${performance.totalTime || 0}ms</div>
                                    <div class="metric-label">Analysis Time</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-value">${performanceMetrics.renderTime || 'N/A'}</div>
                                    <div class="metric-label">Render Time</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-value">${performanceMetrics.bundleSize || 'N/A'}</div>
                                    <div class="metric-label">Bundle Impact</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-value">${performanceMetrics.memoryUsage || 'N/A'}</div>
                                    <div class="metric-label">Memory Usage</div>
                                </div>
                            </div>
                        </div>

                        <div class="card components-card">
                            <h2>Component Analysis</h2>
                            <div class="component-heatmap">
                                ${this.generateComponentHeatmap(components)}
                            </div>
                        </div>

                        <div class="card patterns-card">
                            <h2>Pattern Analysis</h2>
                            <div class="patterns-comparison">
                                <div class="pattern-section legacy">
                                    <h3>Legacy Patterns (${legacyPatterns.length})</h3>
                                    ${this.generatePatternList(legacyPatterns, 'legacy')}
                                </div>
                                <div class="pattern-section modern">
                                    <h3>Modern Patterns (${modernPatterns.length})</h3>
                                    ${this.generatePatternList(modernPatterns, 'modern')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="layers-section">
                        <h2>Layer-by-Layer Analysis</h2>
                        <div class="layers-grid">
                            ${layers.map((layer: any) => this.generateEnhancedLayerHtml(layer)).join("")}
                        </div>
                    </div>

                    ${this.generateDataFlowVisualization(dataFlow)}

                    <div class="actions-section">
                        <button class="action-btn primary" onclick="generateReport()">Generate PDF Report</button>
                        <button class="action-btn secondary" onclick="exportData()">Export Data</button>
                        <button class="action-btn secondary" onclick="shareMixpanel()">Share Analysis</button>
                        <button class="action-btn tertiary" onclick="openDashboard()">View in Dashboard</button>
                    </div>
                </div>

                <script>
                    ${this.getInteractiveScripts()}
                </script>
            </body>
            </html>
        `;
  }

  private generateAnalysisHtml(results: any): string {
    const layers = results.layers || [];
    const performance = results.performance || {};
    const errors = results.errors || [];

    return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>NeuroLint Analysis Results</title>
                <style>
                    ${this.getBaseStyles()}
                    .layer-card {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        padding: 16px;
                        margin-bottom: 16px;
                    }
                    .layer-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 12px;
                    }
                    .layer-title {
                        font-weight: 600;
                        font-size: 14px;
                    }
                    .layer-status {
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: 500;
                    }
                    .status-success {
                        background: var(--vscode-input-background);
                        color: var(--vscode-foreground);
                        border: 1px solid var(--vscode-panel-border);
                    }
                    .status-error {
                        background: var(--vscode-input-background);
                        color: var(--vscode-foreground);
                        border: 1px solid var(--vscode-panel-border);
                    }
                    .status-skipped {
                        background: var(--vscode-input-background);
                        color: var(--vscode-foreground);
                        border: 1px solid var(--vscode-panel-border);
                    }
                    .insights-list {
                        margin-top: 12px;
                    }
                    .insight-item {
                        padding: 8px 12px;
                        margin-bottom: 8px;
                        border-left: 4px solid var(--vscode-panel-border);
                        background: var(--vscode-input-background);
                    }
                    .insight-error {
                        border-left-color: var(--vscode-panel-border);
                    }
                    .insight-warning {
                        border-left-color: var(--vscode-panel-border);
                    }
                    .insight-info {
                        border-left-color: var(--vscode-panel-border);
                    }
                    .performance-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 12px;
                        margin-top: 16px;
                    }
                    .perf-card {
                        padding: 12px;
                        background: var(--vscode-input-background);
                        border-radius: 4px;
                        text-align: center;
                    }
                    .perf-value {
                        font-size: 18px;
                        font-weight: 600;
                        color: var(--vscode-foreground);
                    }
                    .perf-label {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                        margin-top: 4px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>NeuroLint Analysis Results</h1>

                    <div class="performance-section">
                        <h2>Performance Summary</h2>
                        <div class="performance-grid">
                            <div class="perf-card">
                                <div class="perf-value">${performance.totalTime || 0}ms</div>
                                <div class="perf-label">Total Time</div>
                            </div>
                            <div class="perf-card">
                                <div class="perf-value">${layers.length}</div>
                                <div class="perf-label">Layers Processed</div>
                            </div>
                            <div class="perf-card">
                                <div class="perf-value">${layers.filter((l: any) => l.status === "success").length}</div>
                                <div class="perf-label">Successful</div>
                            </div>
                            <div class="perf-card">
                                <div class="perf-value">${errors.length}</div>
                                <div class="perf-label">Errors</div>
                            </div>
                        </div>
                    </div>

                    <div class="layers-section">
                        <h2>Layer Analysis</h2>
                        ${layers.map((layer: any) => this.generateLayerHtml(layer)).join("")}
                    </div>

                    ${
                      errors.length > 0
                        ? `
                        <div class="errors-section">
                            <h2>Errors</h2>
                            ${errors
                              .map(
                                (error: any) => `
                                <div class="insight-item insight-error">
                                    <strong>Error:</strong> ${error.message || error}
                                </div>
                            `,
                              )
                              .join("")}
                        </div>
                    `
                        : ""
                    }
                </div>
            </body>
            </html>
        `;
  }

  private generateLayerHtml(layer: any): string {
    const statusClass = `status-${layer.status}`;
    const insights = layer.insights || [];

    return `
            <div class="layer-card">
                <div class="layer-header">
                    <div class="layer-title">Layer ${layer.id}: ${layer.name}</div>
                    <div class="layer-status ${statusClass}">${layer.status.toUpperCase()}</div>
                </div>
                <div class="layer-details">
                    <p>Changes: ${layer.changes || 0}</p>
                    ${layer.error ? `<p style="color: var(--vscode-foreground); font-style: italic;">Error: ${layer.error}</p>` : ""}
                </div>
                ${
                  insights.length > 0
                    ? `
                    <div class="insights-list">
                        <h4>Insights:</h4>
                        ${insights
                          .map(
                            (insight: any) => `
                            <div class="insight-item insight-${insight.severity || "info"}">
                                <strong>${insight.severity?.toUpperCase() || "INFO"}:</strong> ${insight.message}
                                ${insight.line ? `<br><small>Line ${insight.line}</small>` : ""}
                                ${insight.fix ? `<br><small>Fix: ${insight.fix}</small>` : ""}
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
            </div>
        `;
  }

  private generateWorkspaceHtml(results: any[]): string {
    const totalFiles = results.length;
    const successfulFiles = results.filter(
      (r) => r.result && !r.result.errors?.length,
    ).length;
    const totalIssues = results.reduce((sum, r) => {
      if (r.result && r.result.layers) {
        return (
          sum +
          r.result.layers.reduce((layerSum: number, layer: any) => {
            return layerSum + (layer.insights?.length || 0);
          }, 0)
        );
      }
      return sum;
    }, 0);

    return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>NeuroLint Workspace Analysis</title>
                <style>
                    ${this.getBaseStyles()}
                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 16px;
                        margin-bottom: 24px;
                    }
                    .summary-card {
                        padding: 16px;
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        text-align: center;
                    }
                    .summary-value {
                        font-size: 24px;
                        font-weight: 600;
                        color: var(--vscode-foreground);
                    }
                    .summary-label {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                        margin-top: 4px;
                    }
                    .file-list {
                        margin-top: 24px;
                    }
                    .file-item {
                        padding: 12px;
                        margin-bottom: 8px;
                        background: var(--vscode-input-background);
                        border-radius: 4px;
                        border-left: 4px solid var(--vscode-panel-border);
                    }
                    .file-item.has-issues {
                        border-left-color: var(--vscode-panel-border);
                        opacity: 0.8;
                    }
                    .file-item.no-issues {
                        border-left-color: var(--vscode-panel-border);
                        opacity: 1.0;
                    }
                    .file-name {
                        font-weight: 600;
                        margin-bottom: 4px;
                    }
                    .file-stats {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>NeuroLint Workspace Analysis</h1>

                    <div class="summary-grid">
                        <div class="summary-card">
                            <div class="summary-value">${totalFiles}</div>
                            <div class="summary-label">Files Analyzed</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-value">${successfulFiles}</div>
                            <div class="summary-label">Successful</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-value">${totalIssues}</div>
                            <div class="summary-label">Total Issues</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-value">${Math.round((successfulFiles / totalFiles) * 100)}%</div>
                            <div class="summary-label">Success Rate</div>
                        </div>
                    </div>

                    <div class="file-list">
                        <h2>File Results</h2>
                        ${results.map((result) => this.generateFileResultHtml(result)).join("")}
                    </div>
                </div>
            </body>
            </html>
        `;
  }

  private generateFileResultHtml(result: any): string {
    const fileName = path.basename(result.file);
    const issues =
      result.result?.layers?.reduce(
        (sum: number, layer: any) => sum + (layer.insights?.length || 0),
        0,
      ) || 0;
    const hasIssues = issues > 0;

    return `
            <div class="file-item ${hasIssues ? "has-issues" : "no-issues"}">
                <div class="file-name">${fileName}</div>
                <div class="file-stats">
                    Issues: ${issues} |
                    Layers: ${result.result?.layers?.length || 0} |
                    Time: ${result.result?.performance?.totalTime || 0}ms
                </div>
            </div>
        `;
  }

  private generateDiffHtml(
    original: string,
    modified: string,
    fileName: string,
  ): string {
    return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>NeuroLint Changes: ${fileName}</title>
                <style>
                    ${this.getBaseStyles()}
                    .diff-container {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px;
                        height: calc(100vh - 100px);
                    }
                    .diff-panel {
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        overflow: hidden;
                    }
                    .diff-header {
                        padding: 12px;
                        background: var(--vscode-editor-background);
                        border-bottom: 1px solid var(--vscode-panel-border);
                        font-weight: 600;
                    }
                    .diff-content {
                        padding: 16px;
                        font-family: var(--vscode-editor-font-family);
                        font-size: var(--vscode-editor-font-size);
                        line-height: 1.4;
                        overflow-y: auto;
                        height: calc(100% - 48px);
                        white-space: pre-wrap;
                        background: var(--vscode-input-background);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>NeuroLint Changes: ${fileName}</h1>

                    <div class="diff-container">
                        <div class="diff-panel">
                            <div class="diff-header">Original</div>
                            <div class="diff-content">${this.escapeHtml(original)}</div>
                        </div>
                        <div class="diff-panel">
                            <div class="diff-header">NeuroLint Enhanced</div>
                            <div class="diff-content">${this.escapeHtml(modified)}</div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
  }

  private getEnhancedStyles(): string {
    return `
      ${this.getBaseStyles()}

      .analysis-header {
        background: linear-gradient(135deg, var(--glass-background), rgba(33, 150, 243, 0.1));
        border: 1px solid var(--glass-border);
        border-radius: var(--border-radius);
        padding: 24px;
        margin-bottom: 24px;
        backdrop-filter: blur(20px);
      }

      .analysis-meta {
        display: flex;
        gap: 24px;
        margin-top: 16px;
        flex-wrap: wrap;
      }

      .meta-item {
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 24px;
        margin-bottom: 32px;
      }

      .card {
        background: var(--glass-background);
        border: 1px solid var(--glass-border);
        border-radius: var(--border-radius);
        padding: 24px;
        backdrop-filter: blur(20px);
        transition: var(--transition-smooth);
        position: relative;
        overflow: hidden;
      }

      .card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 48px rgba(33, 150, 243, 0.15);
        border-color: rgba(33, 150, 243, 0.4);
      }

      .card h2 {
        margin-bottom: 20px;
        color: #ffffff;
        font-size: 16px;
        font-weight: 600;
      }

      .debt-score {
        text-align: center;
        margin-bottom: 24px;
      }

      .score-circle {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: conic-gradient(from 0deg, var(--status-success) 0%, var(--status-warning) 50%, var(--status-error) 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        position: relative;
      }

      .score-circle::before {
        content: '';
        position: absolute;
        width: 100px;
        height: 100px;
        background: #000000;
        border-radius: 50%;
        z-index: 1;
      }

      .score-value {
        font-size: 28px;
        font-weight: 700;
        color: #ffffff;
        z-index: 2;
        position: relative;
      }

      .score-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        z-index: 2;
        position: relative;
      }

      .debt-breakdown {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }

      .debt-item {
        text-align: center;
        padding: 12px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        flex: 1;
      }

      .debt-item.critical {
        border-color: var(--status-error);
        background: rgba(229, 62, 62, 0.1);
      }

      .debt-item.warning {
        border-color: var(--status-warning);
        background: rgba(255, 152, 0, 0.1);
      }

      .debt-item.info {
        border-color: var(--neurolint-accent);
        background: rgba(33, 150, 243, 0.1);
      }

      .debt-count {
        display: block;
        font-size: 20px;
        font-weight: 600;
        color: #ffffff;
      }

      .debt-label {
        display: block;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.7);
        margin-top: 4px;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }

      .metric {
        text-align: center;
        padding: 16px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .metric-value {
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 4px;
      }

      .metric-label {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
      }

      .component-heatmap {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 8px;
      }

      .component-item {
        padding: 12px 8px;
        border-radius: 6px;
        text-align: center;
        cursor: pointer;
        transition: var(--transition-smooth);
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.05);
      }

      .component-item.heat-0 { background: rgba(76, 175, 80, 0.2); border-color: var(--status-success); }
      .component-item.heat-1 { background: rgba(139, 195, 74, 0.2); }
      .component-item.heat-2 { background: rgba(255, 193, 7, 0.2); }
      .component-item.heat-3 { background: rgba(255, 152, 0, 0.2); border-color: var(--status-warning); }
      .component-item.heat-4 { background: rgba(229, 62, 62, 0.2); border-color: var(--status-error); }

      .component-name {
        display: block;
        font-size: 12px;
        font-weight: 500;
        color: #ffffff;
        margin-bottom: 4px;
      }

      .component-stats {
        display: block;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.6);
      }

      .patterns-comparison {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      .pattern-section h3 {
        font-size: 14px;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .pattern-section.legacy h3 {
        color: var(--status-warning);
      }

      .pattern-section.modern h3 {
        color: var(--status-success);
      }

      .pattern-item {
        padding: 12px;
        margin-bottom: 8px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.05);
        border-left: 3px solid;
      }

      .pattern-item.legacy {
        border-left-color: var(--status-warning);
      }

      .pattern-item.modern {
        border-left-color: var(--status-success);
      }

      .pattern-name {
        font-weight: 500;
        color: #ffffff;
        margin-bottom: 4px;
      }

      .pattern-description {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.4;
      }

      .layers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 20px;
      }

      .layer-card.enhanced {
        cursor: pointer;
        transition: var(--transition-smooth);
      }

      .layer-card.enhanced:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(33, 150, 243, 0.15);
      }

      .layer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .layer-title {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .layer-number {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--neurolint-accent);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
      }

      .layer-name {
        font-weight: 600;
        color: #ffffff;
      }

      .layer-stats {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
      }

      .stat {
        text-align: center;
      }

      .stat-value {
        display: block;
        font-size: 16px;
        font-weight: 600;
        color: #ffffff;
      }

      .stat-label {
        display: block;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.6);
        margin-top: 2px;
      }

      .layer-error {
        background: rgba(229, 62, 62, 0.1);
        border: 1px solid var(--status-error);
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .error-icon {
        font-size: 16px;
      }

      .error-message {
        color: #ffffff;
        font-size: 13px;
      }

      .layer-details {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .insights-section h4,
      .improvements-section h4 {
        font-size: 13px;
        color: #ffffff;
        margin-bottom: 12px;
      }

      .insight-item.enhanced {
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .insight-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .insight-type {
        font-size: 11px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.7);
      }

      .insight-severity {
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }

      .insight-message {
        color: #ffffff;
        line-height: 1.4;
        margin-bottom: 12px;
      }

      .insight-fix {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .fix-btn {
        padding: 6px 12px;
        background: var(--neurolint-accent);
        color: #ffffff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: var(--transition-smooth);
      }

      .fix-btn:hover {
        background: #1976d2;
      }

      .fix-preview {
        font-family: monospace;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.7);
        background: rgba(255, 255, 255, 0.05);
        padding: 4px 8px;
        border-radius: 4px;
      }

      .improvement-item {
        padding: 8px 12px;
        margin-bottom: 6px;
        background: rgba(76, 175, 80, 0.1);
        border-left: 3px solid var(--status-success);
        border-radius: 4px;
        color: #ffffff;
        font-size: 13px;
      }

      .data-flow-section {
        margin-top: 32px;
        padding: 24px;
        background: var(--glass-background);
        border: 1px solid var(--glass-border);
        border-radius: var(--border-radius);
        backdrop-filter: blur(20px);
      }

      .flow-container {
        position: relative;
        min-height: 200px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        padding: 20px;
      }

      .flow-node {
        position: absolute;
        padding: 12px 16px;
        background: var(--glass-background);
        border: 1px solid var(--glass-border);
        border-radius: 8px;
        min-width: 120px;
        text-align: center;
        backdrop-filter: blur(10px);
      }

      .node-title {
        font-weight: 500;
        color: #ffffff;
        margin-bottom: 4px;
      }

      .node-type {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
      }

      .node-issues {
        font-size: 10px;
        color: var(--status-warning);
        margin-top: 4px;
      }

      .flow-connections {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      .connection {
        stroke: rgba(33, 150, 243, 0.6);
        stroke-width: 2;
        stroke-dasharray: 5,5;
        animation: dash 1s linear infinite;
      }

      @keyframes dash {
        to {
          stroke-dashoffset: -10;
        }
      }

      .actions-section {
        margin-top: 32px;
        text-align: center;
        padding: 24px;
        background: var(--glass-background);
        border: 1px solid var(--glass-border);
        border-radius: var(--border-radius);
        backdrop-filter: blur(20px);
      }

      .action-btn {
        padding: 12px 24px;
        margin: 0 8px;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: var(--transition-smooth);
        text-decoration: none;
        display: inline-block;
      }

      .action-btn.primary {
        background: var(--neurolint-accent);
        color: #ffffff;
      }

      .action-btn.primary:hover {
        background: #1976d2;
        transform: translateY(-2px);
      }

      .action-btn.secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .action-btn.secondary:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
      }

      .action-btn.tertiary {
        background: transparent;
        color: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .action-btn.tertiary:hover {
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.3);
      }

      .no-data,
      .no-patterns {
        text-align: center;
        color: rgba(255, 255, 255, 0.5);
        font-style: italic;
        padding: 20px;
      }
    `;
  }

  private getBaseStyles(): string {
    return `
            :root {
                --container-padding: 20px;
                --border-radius: 12px;
                --glass-background: rgba(255, 255, 255, 0.05);
                --glass-border: rgba(255, 255, 255, 0.15);
                --glass-hover: rgba(255, 255, 255, 0.1);
                --neurolint-accent: #2196f3;
                --status-success: #4caf50;
                --status-error: #e53e3e;
                --status-warning: #ff9800;
                --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            body {
                font-family: "Inter", system-ui, -apple-system, sans-serif;
                font-size: 14px;
                color: #ffffff;
                background: #000000;
                margin: 0;
                padding: 0;
                line-height: 1.5;
            }

            .container {
                padding: var(--container-padding);
                max-width: 1200px;
                margin: 0 auto;
            }

            h1, h2, h3, h4 {
                color: #ffffff;
                margin-top: 0;
                font-weight: 600;
            }

            h1 {
                font-size: 24px;
                margin-bottom: 24px;
                padding-bottom: 12px;
                border-bottom: 1px solid var(--glass-border);
            }

            h2 {
                font-size: 18px;
                margin: 24px 0 16px 0;
            }

            p {
                line-height: 1.6;
                margin: 8px 0;
                color: rgba(255, 255, 255, 0.9);
            }

            code {
                background: var(--glass-background);
                border: 1px solid var(--glass-border);
                padding: 4px 8px;
                border-radius: 8px;
                font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;
                font-size: 13px;
                color: #ffffff;
                backdrop-filter: blur(10px);
            }

            .layer-card {
                background: var(--glass-background);
                border: 1px solid var(--glass-border);
                border-radius: var(--border-radius);
                padding: 20px;
                margin-bottom: 16px;
                backdrop-filter: blur(10px);
                transition: var(--transition-smooth);
            }

            .layer-card:hover {
                background: var(--glass-hover);
                border-color: var(--neurolint-accent);
                box-shadow: 0 8px 32px rgba(33, 150, 243, 0.1);
            }

            .summary-card {
                background: var(--glass-background);
                border: 1px solid var(--glass-border);
                border-radius: var(--border-radius);
                padding: 20px;
                text-align: center;
                backdrop-filter: blur(10px);
                transition: var(--transition-smooth);
            }

            .summary-card:hover {
                background: var(--glass-hover);
                transform: translateY(-2px);
            }

            .text-muted {
                color: rgba(255, 255, 255, 0.6);
            }

            .text-success, .status-success {
                color: var(--status-success);
                font-weight: 500;
            }

            .text-warning, .status-warning {
                color: var(--status-warning);
                font-weight: 500;
            }

            .text-error, .status-error {
                color: var(--status-error);
                font-weight: 500;
            }

            .insight-item {
                background: var(--glass-background);
                border: 1px solid var(--glass-border);
                border-radius: 8px;
                padding: 12px;
                margin: 8px 0;
                backdrop-filter: blur(10px);
                transition: var(--transition-smooth);
            }

            .insight-error {
                border-color: var(--status-error);
                background: rgba(229, 62, 62, 0.1);
            }

            .insight-warning {
                border-color: var(--status-warning);
                background: rgba(255, 152, 0, 0.1);
            }

            .insight-success {
                border-color: var(--status-success);
                background: rgba(76, 175, 80, 0.1);
            }

            .diff-panel {
                background: var(--glass-background);
                border: 1px solid var(--glass-border);
                border-radius: var(--border-radius);
                backdrop-filter: blur(10px);
                overflow: hidden;
            }

            .diff-header {
                background: var(--glass-background);
                border-bottom: 1px solid var(--glass-border);
                padding: 12px 16px;
                font-weight: 600;
                color: #ffffff;
            }

            .diff-content {
                font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;
                font-size: 13px;
                line-height: 1.6;
                padding: 16px;
                background: rgba(0, 0, 0, 0.3);
                color: #ffffff;
                overflow-y: auto;
                height: calc(100% - 48px);
                white-space: pre-wrap;
            }
        `;
  }

  private escapeHtml(text: string): string {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  private calculateTechnicalDebtScore(analysis: any): number {
    const issues = analysis.detectedIssues || [];
    const critical = issues.filter((i: any) => i.severity === 'critical').length;
    const warnings = issues.filter((i: any) => i.severity === 'warning').length;
    const info = issues.filter((i: any) => i.severity === 'info').length;

    const score = Math.max(0, 100 - (critical * 10 + warnings * 3 + info * 1));
    return Math.round(score);
  }

  private countIssuesBySeverity(analysis: any, severity: string): number {
    const issues = analysis.detectedIssues || [];
    return issues.filter((i: any) => i.severity === severity).length;
  }

  private generateComponentHeatmap(components: any[]): string {
    if (!components.length) {
      return '<div class="no-data">No components analyzed</div>';
    }

    return components.slice(0, 10).map((comp: any) => {
      const complexity = comp.complexity || 0;
      const issues = comp.issues || 0;
      const heatLevel = Math.min(4, Math.floor((complexity + issues) / 2));

      return `
        <div class="component-item heat-${heatLevel}" onclick="selectComponent('${comp.name}')">
          <span class="component-name">${comp.name}</span>
          <span class="component-stats">${issues} issues</span>
        </div>
      `;
    }).join('');
  }

  private generatePatternList(patterns: any[], type: string): string {
    if (!patterns.length) {
      return `<div class="no-patterns">No ${type} patterns detected</div>`;
    }

    return patterns.slice(0, 5).map((pattern: any) => `
      <div class="pattern-item ${type}">
        <div class="pattern-name">${pattern.name || pattern.type}</div>
        <div class="pattern-description">${pattern.description || ''}</div>
        ${pattern.impact ? `<div class="pattern-impact">Impact: ${pattern.impact}</div>` : ''}
      </div>
    `).join('');
  }

  private generateEnhancedLayerHtml(layer: any): string {
    const statusClass = `status-${layer.status || 'pending'}`;
    const insights = layer.insights || [];
    const changes = layer.changes || layer.changeCount || 0;
    const executionTime = layer.executionTime || 0;

    return `
      <div class="layer-card enhanced" onclick="toggleLayer('${layer.layerId}')">
        <div class="layer-header">
          <div class="layer-title">
            <span class="layer-number">${layer.layerId}</span>
            <span class="layer-name">${layer.name || this.getLayerName(layer.layerId)}</span>
          </div>
          <div class="layer-status ${statusClass}">${(layer.status || 'pending').toUpperCase()}</div>
        </div>

        <div class="layer-stats">
          <div class="stat">
            <span class="stat-value">${changes}</span>
            <span class="stat-label">Changes</span>
          </div>
          <div class="stat">
            <span class="stat-value">${executionTime}ms</span>
            <span class="stat-label">Time</span>
          </div>
          <div class="stat">
            <span class="stat-value">${insights.length}</span>
            <span class="stat-label">Insights</span>
          </div>
        </div>

        ${layer.error ? `
          <div class="layer-error">
            <span class="error-icon">⚠️</span>
            <span class="error-message">${layer.error}</span>
          </div>
        ` : ''}

        <div class="layer-details" id="layer-${layer.layerId}-details" style="display: none;">
          ${insights.length > 0 ? `
            <div class="insights-section">
              <h4>Insights & Recommendations</h4>
              ${insights.map((insight: any) => `
                <div class="insight-item enhanced ${insight.severity || 'info'}">
                  <div class="insight-header">
                    <span class="insight-type">${insight.type || 'Analysis'}</span>
                    <span class="insight-severity">${(insight.severity || 'info').toUpperCase()}</span>
                  </div>
                  <div class="insight-message">${insight.message}</div>
                  ${insight.fix ? `
                    <div class="insight-fix">
                      <button class="fix-btn" onclick="applyFix('${layer.layerId}', '${insight.id}')">
                        Apply Fix
                      </button>
                      <span class="fix-preview">${insight.fix}</span>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${layer.improvements && layer.improvements.length > 0 ? `
            <div class="improvements-section">
              <h4>Applied Improvements</h4>
              ${layer.improvements.map((improvement: string) => `
                <div class="improvement-item">✓ ${improvement}</div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private getLayerName(layerId: number): string {
    const layerNames: Record<number, string> = {
      1: 'Configuration',
      2: 'Content Standards',
      3: 'Component Intelligence',
      4: 'Hydration Safety',
      5: 'Next.js Optimization',
      6: 'Testing & Quality'
    };
    return layerNames[layerId] || `Layer ${layerId}`;
  }

  private generateDataFlowVisualization(dataFlow: any): string {
    if (!dataFlow || !Object.keys(dataFlow).length) {
      return '';
    }

    return `
      <div class="data-flow-section">
        <h2>Data Flow Analysis</h2>
        <div class="data-flow-visualization">
          ${this.generateDataFlowNodes(dataFlow)}
        </div>
      </div>
    `;
  }

  private generateDataFlowNodes(dataFlow: any): string {
    const nodes = dataFlow.nodes || [];
    const connections = dataFlow.connections || [];

    return `
      <div class="flow-container">
        ${nodes.map((node: any) => `
          <div class="flow-node ${node.type}" data-node-id="${node.id}">
            <div class="node-title">${node.name}</div>
            <div class="node-type">${node.type}</div>
            ${node.issues > 0 ? `<div class="node-issues">${node.issues} issues</div>` : ''}
          </div>
        `).join('')}

        <svg class="flow-connections">
          ${connections.map((conn: any) => `
            <line x1="${conn.x1}" y1="${conn.y1}" x2="${conn.x2}" y2="${conn.y2}"
                  class="connection ${conn.type}" />
          `).join('')}
        </svg>
      </div>
    `;
  }

  private generateHeatmapHtml(data: any): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NeuroLint Technical Debt Heatmap</title>
        <style>${this.getEnhancedStyles()}</style>
      </head>
      <body>
        <div class="container">
          <h1>Technical Debt Heatmap</h1>
          <div class="heatmap-container">
            ${this.generateHeatmapContent(data)}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateHeatmapContent(data: any): string {
    return `<div class="heatmap-placeholder">Heatmap visualization will be rendered here</div>`;
  }

  private generateMetricsHtml(metrics: any): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NeuroLint Performance Metrics</title>
        <style>${this.getEnhancedStyles()}</style>
      </head>
      <body>
        <div class="container">
          <h1>Performance Metrics</h1>
          <div class="metrics-container">
            ${this.generateMetricsContent(metrics)}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateMetricsContent(metrics: any): string {
    return `<div class="metrics-placeholder">Performance metrics will be rendered here</div>`;
  }

  private generateModernizationPlanHtml(plan: any): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NeuroLint Modernization Plan</title>
        <style>${this.getEnhancedStyles()}</style>
      </head>
      <body>
        <div class="container">
          <h1>Modernization Plan</h1>
          <div class="plan-container">
            ${this.generatePlanContent(plan)}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePlanContent(plan: any): string {
    return `<div class="plan-placeholder">Modernization plan will be rendered here</div>`;
  }

  private getInteractiveScripts(): string {
    return `
      function toggleLayer(layerId) {
        const details = document.getElementById('layer-' + layerId + '-details');
        if (details) {
          details.style.display = details.style.display === 'none' ? 'block' : 'none';
        }
      }

      function selectComponent(name) {
        vscode.postMessage({
          command: 'selectComponent',
          component: name
        });
      }

      function applyFix(layerId, fixId) {
        vscode.postMessage({
          command: 'applyLayerFix',
          layerId: layerId,
          fixId: fixId
        });
      }

      function generateReport() {
        vscode.postMessage({
          command: 'generateReport',
          type: 'pdf'
        });
      }

      function exportData() {
        vscode.postMessage({
          command: 'exportAnalysis',
          format: 'json'
        });
      }

      function shareMixpanel() {
        vscode.postMessage({
          command: 'shareAnalysis'
        });
      }

      function openDashboard() {
        vscode.postMessage({
          command: 'openDashboard'
        });
      }

      // Initialize interactive elements
      document.addEventListener('DOMContentLoaded', function() {
        // Add hover effects for component heatmap
        document.querySelectorAll('.component-item').forEach(item => {
          item.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
          });
          item.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
          });
        });
      });
    `;
  }

  private handleWebviewMessage(message: any): void {
    switch (message.command) {
      case "openFile":
        if (message.file) {
          vscode.workspace.openTextDocument(message.file).then((doc: vscode.TextDocument) => {
            vscode.window.showTextDocument(doc);
          });
        }
        break;
      case "applyFix":
        if (message.file && message.fix) {
          vscode.commands.executeCommand(
            "neurolint.applySpecificFix",
            message.file,
            message.fix,
          );
        }
        break;
      case "selectComponent":
        if (message.component) {
          vscode.window.showInformationMessage(`Selected component: ${message.component}`);
        }
        break;
      case "applyLayerFix":
        if (message.layerId && message.fixId) {
          vscode.commands.executeCommand(
            "neurolint.applyLayerFix",
            message.layerId,
            message.fixId
          );
        }
        break;
      case "generateReport":
        vscode.commands.executeCommand("neurolint.generateReport", message.type);
        break;
      case "exportAnalysis":
        vscode.commands.executeCommand("neurolint.exportAnalysis", message.format);
        break;
      case "shareAnalysis":
        vscode.commands.executeCommand("neurolint.shareAnalysis");
        break;
      case "openDashboard":
        vscode.env.openExternal(vscode.Uri.parse("https://neurolint.dev/dashboard"));
        break;
    }
  }

  public dispose(): void {
    if (this.panel) {
      this.panel.dispose();
    }
    this.disposables.forEach((d) => d.dispose());
  }
}
