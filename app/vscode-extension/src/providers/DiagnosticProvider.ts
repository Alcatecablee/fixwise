import * as vscode from "vscode";
import { IAnalysisClient } from "../utils/IAnalysisClient";

export class NeuroLintDiagnosticProvider implements vscode.Disposable {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private isDisposed = false;
  private isEnabled = true;

  constructor(
    private apiClient: IAnalysisClient,
    private outputChannel: vscode.OutputChannel,
  ) {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection("neurolint");
  }

  public updateDiagnostics(document: vscode.TextDocument): void {
    if (this.isDisposed || !this.isEnabled) return;

    this.provideDiagnosticsAsync(document).catch((error) => {
      this.outputChannel.appendLine(
        `Diagnostic update failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    });
  }

  public clearAllDiagnostics(): void {
    this.diagnosticCollection.clear();
  }

  public toggleDiagnostics(): boolean {
    this.isEnabled = !this.isEnabled;
    if (!this.isEnabled) {
      this.clearAllDiagnostics();
    }
    return this.isEnabled;
  }

  private async provideDiagnosticsAsync(
    document: vscode.TextDocument,
  ): Promise<void> {
    if (!this.apiClient.isAuthenticated()) {
      return;
    }

    try {
      const result = await this.apiClient.analyzeCode({
        code: document.getText(),
        filename: document.fileName,
        layers: [1, 2, 3, 4], // Basic diagnostic layers
      });

      if (this.isDisposed) return;

      const diagnostics: vscode.Diagnostic[] = [];

      if (result.changes) {
        result.changes.forEach((change) => {
          const diagnostic = this.createDiagnostic(change);
          if (diagnostic) {
            diagnostics.push(diagnostic);
          }
        });
      }

      this.diagnosticCollection.set(document.uri, diagnostics);
    } catch (error) {
      this.outputChannel.appendLine(
        `Diagnostic analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private createDiagnostic(change: {
    line: number;
    column: number;
    message: string;
    severity: "error" | "warning" | "info";
    fix?: string;
  }): vscode.Diagnostic | null {
    try {
      const range = new vscode.Range(
        Math.max(0, change.line - 1),
        Math.max(0, change.column || 0),
        Math.max(0, change.line - 1),
        Math.max(0, change.column + 1),
      );

      const severity = this.mapSeverity(change.severity);
      const diagnostic = new vscode.Diagnostic(range, change.message, severity);
      diagnostic.source = "NeuroLint";

      return diagnostic;
    } catch (error) {
      this.outputChannel.appendLine(
        `Failed to create diagnostic: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null;
    }
  }

  private mapSeverity(
    severity: "error" | "warning" | "info",
  ): vscode.DiagnosticSeverity {
    switch (severity) {
      case "error":
        return vscode.DiagnosticSeverity.Error;
      case "warning":
        return vscode.DiagnosticSeverity.Warning;
      case "info":
        return vscode.DiagnosticSeverity.Information;
      default:
        return vscode.DiagnosticSeverity.Warning;
    }
  }

  public dispose(): void {
    this.isDisposed = true;
    this.diagnosticCollection.dispose();
  }
}
