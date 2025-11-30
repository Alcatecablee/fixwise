import * as vscode from "vscode";
import { IAnalysisClient, AnalysisIssue } from "../utils/IAnalysisClient";

/**
 * NeuroLint Code Action Provider
 * 
 * Provides quick fixes and code actions for NeuroLint diagnostics.
 * Production-ready with comprehensive error handling, loading states,
 * and input validation to avoid problematic AI behaviors.
 */

export class NeuroLintCodeActionProvider implements vscode.CodeActionProvider {
  private readonly maxAnalysisTime = 30000; // 30 seconds
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private isAnalyzing = false;

  constructor(
    private apiClient: IAnalysisClient,
    private outputChannel: vscode.OutputChannel,
  ) {}

  /**
   * Validate document before analysis
   */
  private validateDocument(document: vscode.TextDocument): { valid: boolean; error?: string } {
    try {
      // Check file size
      if (document.getText().length > this.maxFileSize) {
        return {
          valid: false,
          error: `File too large (max ${this.maxFileSize / 1024 / 1024}MB)`
        };
      }

      // Check if file is empty
      if (document.getText().trim().length === 0) {
        return {
          valid: false,
          error: "File is empty"
        };
      }

      // Check supported languages
      const supportedLanguages = ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'];
      if (!supportedLanguages.includes(document.languageId)) {
        return {
          valid: false,
          error: `Unsupported language: ${document.languageId}`
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Show progress indicator for long-running operations
   */
  private async withProgress<T>(
    title: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: true
      },
      async (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
        try {
          // Set up timeout
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Operation timeout')), this.maxAnalysisTime);
          });

          const operationPromise = operation();
          const result = await Promise.race([operationPromise, timeoutPromise]);
          
          return result;
        } catch (error) {
          if (token.isCancellationRequested) {
            throw new Error('Operation cancelled by user');
          }
          throw error;
        }
      }
    );
  }

  /**
   * Handle errors gracefully with user feedback
   */
  private handleError(error: unknown, context: string): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    this.outputChannel.appendLine(`[ERROR] ${context}: ${errorMessage}`);
    
    // Show user-friendly error message
    vscode.window.showErrorMessage(
      `NeuroLint ${context} failed: ${errorMessage}`,
      'Show Details'
    ).then((selection: string | undefined) => {
      if (selection === 'Show Details') {
        this.outputChannel.show();
      }
    });
  }

  /**
   * Create empty state message when no issues are found
   */
  private createEmptyStateAction(): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'NeuroLint: No issues found',
      vscode.CodeActionKind.Empty
    );
    action.isPreferred = false;
    action.detail = 'Code analysis completed - no issues detected';
    return action;
  }

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
    try {
      // Prevent concurrent analysis
      if (this.isAnalyzing) {
        return [];
      }

      // Validate document
      const validation = this.validateDocument(document);
      if (!validation.valid) {
        this.outputChannel.appendLine(`[WARNING] Document validation failed: ${validation.error}`);
        return [];
      }

      // Check for cancellation
      if (token.isCancellationRequested) {
        return [];
      }

      const actions: vscode.CodeAction[] = [];

      // Add quick fix for NeuroLint diagnostics
      for (const diagnostic of context.diagnostics) {
        if (diagnostic.source === "NeuroLint") {
          try {
            const action = new vscode.CodeAction(
              `NeuroLint: Fix ${diagnostic.message}`,
              vscode.CodeActionKind.QuickFix,
            );
            action.diagnostics = [diagnostic];
            action.isPreferred = true;
            actions.push(action);
          } catch (error) {
            this.handleError(error, 'creating quick fix action');
          }
        }
      }

      // If no diagnostics found, provide analyze action
      if (actions.length === 0) {
        try {
          const analyzeAction = new vscode.CodeAction(
            'NeuroLint: Analyze this file',
            vscode.CodeActionKind.Refactor,
          );
          analyzeAction.command = {
            command: 'neurolint.analyzeFile',
            title: 'Analyze with NeuroLint',
            arguments: [document.uri]
          };
          actions.push(analyzeAction);
        } catch (error) {
          this.handleError(error, 'creating analyze action');
        }
      }

      return actions;

    } catch (error) {
      this.handleError(error, 'providing code actions');
      return [];
    }
  }

  /**
   * Provide code actions with real-time analysis
   */
  public async provideCodeActionsWithAnalysis(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken,
  ): Promise<vscode.CodeAction[]> {
    try {
      // Prevent concurrent analysis
      if (this.isAnalyzing) {
        return [];
      }

      this.isAnalyzing = true;

      // Validate document
      const validation = this.validateDocument(document);
      if (!validation.valid) {
        this.outputChannel.appendLine(`[WARNING] Document validation failed: ${validation.error}`);
        return [];
      }

      // Check for cancellation
      if (token.isCancellationRequested) {
        return [];
      }

      // Perform analysis with progress indicator
      const analysisResult = await this.withProgress(
        'NeuroLint: Analyzing code...',
        async () => {
          try {
            const code = document.getText();
            const result = await this.apiClient.analyze(code, {
              filename: document.fileName,
              layers: [1, 2, 3, 4, 5, 6],
              verbose: true
            });

            if (result.error) {
              throw new Error(result.error);
            }

            return result;
          } catch (error) {
            throw error;
          }
        }
      );

      const actions: vscode.CodeAction[] = [];

      // Create actions for each issue found
      if (analysisResult.issues && analysisResult.issues.length > 0) {
        for (const issue of analysisResult.issues) {
          try {
            const action = new vscode.CodeAction(
              `NeuroLint: Fix ${issue.description}`,
              vscode.CodeActionKind.QuickFix,
            );
            action.detail = `Layer ${issue.layer}: ${issue.message}`;
            action.isPreferred = true;
            
            // Add command to apply the fix
            action.command = {
              command: 'neurolint.applyFix',
              title: `Apply fix for ${issue.description}`,
              arguments: [document.uri, issue]
            };
            
            actions.push(action);
          } catch (error) {
            this.handleError(error, `creating fix action for ${issue.description}`);
          }
        }
      } else {
        // Show empty state when no issues found
        actions.push(this.createEmptyStateAction());
      }

      return actions;

    } catch (error) {
      this.handleError(error, 'real-time analysis');
      return [];
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Apply a specific fix to the document
   */
  public async applyFix(
    document: vscode.TextDocument,
    issue: AnalysisIssue,
    token: vscode.CancellationToken
  ): Promise<boolean> {
    try {
      // Validate inputs
      if (!document || !issue) {
        throw new Error('Invalid document or issue');
      }

      if (token.isCancellationRequested) {
        return false;
      }

      // Apply fix with progress indicator
      const fixResult = await this.withProgress(
        `NeuroLint: Applying fix for ${issue.description}...`,
        async () => {
          try {
            const code = document.getText();
            const result = await this.apiClient.applyFixes(code, [issue], {
              dryRun: false,
              verbose: true
            });

            if (result.error) {
              throw new Error(result.error);
            }

            return result;
          } catch (error) {
            throw error;
          }
        }
      );

      if (fixResult.success && fixResult.code !== document.getText()) {
        // Apply the changes to the document
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(document.getText().length)
        );
        edit.replace(document.uri, fullRange, fixResult.code);
        
        const success = await vscode.workspace.applyEdit(edit);
        
        if (success) {
          vscode.window.showInformationMessage(
            `NeuroLint: Successfully applied fix for ${issue.description}`
          );
          return true;
        } else {
          throw new Error('Failed to apply edit to document');
        }
      } else {
        vscode.window.showInformationMessage(
          `NeuroLint: No changes needed for ${issue.description}`
        );
        return true;
      }

    } catch (error) {
      this.handleError(error, `applying fix for ${issue.description}`);
      return false;
    }
  }
}
