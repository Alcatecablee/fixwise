import * as vscode from "vscode";

export class NeuroLintStatusBar {
  private _statusBarItem: vscode.StatusBarItem;
  private _isAnalyzing: boolean = false;
  private _currentStatus: string = "Ready";
  private _statusHistory: Array<{ status: string; timestamp: number }> = [];
  private _autoHideTimers: Set<NodeJS.Timeout> = new Set();
  private _isDisposed: boolean = false;

  constructor() {
    this._statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );

    this._statusBarItem.command = "neurolint.showOutput";
    this._statusBarItem.name = "NeuroLint Status";
    this.updateStatus("Initializing...");
    this._statusBarItem.show();
  }

  public get statusBarItem(): vscode.StatusBarItem {
    return this._statusBarItem;
  }

  public updateStatus(message: string, isLoading: boolean = false): void {
    this._isAnalyzing = isLoading;

    const prefix = "NeuroLint";
    const loadingIndicator = isLoading ? "$(sync~spin)" : "$(check)";

    this._statusBarItem.text = `${loadingIndicator} ${prefix}: ${message}`;

    // Update tooltip with more information
    this._statusBarItem.tooltip = this.createTooltip(message, isLoading);

    // Update background color based on status
    this._statusBarItem.backgroundColor = this.getBackgroundColor(message);
  }

  public updateProgress(
    current: number,
    total: number,
    operation: string,
  ): void {
    const percentage = Math.round((current / total) * 100);
    const progressBar = this.createProgressBar(percentage);

    this._statusBarItem.text = `$(sync~spin) NeuroLint: ${operation} ${progressBar} ${percentage}%`;
    this._statusBarItem.tooltip = `NeuroLint: Analyzing ${current}/${total} files`;
  }

  public showError(message: string): void {
    if (this._isDisposed) return;

    this._currentStatus = message;
    this._statusBarItem.text = `$(error) NeuroLint: ${message}`;
    this._statusBarItem.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.errorBackground",
    );
    this._statusBarItem.tooltip = `NeuroLint Error: ${message}\nClick to view output for details\nRight-click for configuration`;

    this.addToHistory("error", message);
    this.scheduleAutoHide(10000, "error");
  }

  public showWarning(message: string): void {
    if (this._isDisposed) return;

    this._currentStatus = message;
    this._statusBarItem.text = `$(warning) NeuroLint: ${message}`;
    this._statusBarItem.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.warningBackground",
    );
    this._statusBarItem.tooltip = `NeuroLint Warning: ${message}\nClick to view output`;

    this.addToHistory("warning", message);
    this.scheduleAutoHide(5000, "warning");
  }

  public showSuccess(message: string): void {
    if (this._isDisposed) return;

    this._currentStatus = message;
    this._statusBarItem.text = `$(check) NeuroLint: ${message}`;
    this._statusBarItem.backgroundColor = undefined;
    this._statusBarItem.tooltip = `NeuroLint: ${message}`;

    this.addToHistory("success", message);
    this.scheduleAutoHide(3000, "success");
  }

  public hide(): void {
    this._statusBarItem.hide();
  }

  public show(): void {
    this._statusBarItem.show();
  }

  private addToHistory(level: string, message: string): void {
    this._statusHistory.push({
      status: `${level}: ${message}`,
      timestamp: Date.now(),
    });

    // Keep only last 10 status updates
    if (this._statusHistory.length > 10) {
      this._statusHistory = this._statusHistory.slice(-10);
    }
  }

  private scheduleAutoHide(delay: number, statusType: string): void {
    this.clearAutoHideTimers();

    const timer = setTimeout(() => {
      if (this._isDisposed) {
        this._autoHideTimers.delete(timer);
        return;
      }

      // Check if status is still the same type before auto-hiding
      const iconPattern = `$(${this.getIconForType(statusType)})`;
      if (
        this._statusBarItem.text.includes(iconPattern) &&
        this._currentStatus.toLowerCase().includes(statusType.toLowerCase())
      ) {
        // Prevent infinite recursion by setting status directly
        this._currentStatus = "Ready";
        this._statusBarItem.text = "$(check) NeuroLint: Ready";
        this._statusBarItem.backgroundColor = undefined;
      }
      this._autoHideTimers.delete(timer);
    }, delay);

    this._autoHideTimers.add(timer);
  }

  private getIconForType(statusType: string): string {
    switch (statusType) {
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "success":
        return "check";
      default:
        return "check";
    }
  }

  private clearAutoHideTimers(): void {
    this._autoHideTimers.forEach((timer) => clearTimeout(timer));
    this._autoHideTimers.clear();
  }

  public getCurrentStatus(): string {
    return this._currentStatus;
  }

  public getStatusHistory(): Array<{ status: string; timestamp: number }> {
    return [...this._statusHistory];
  }

  public dispose(): void {
    this._isDisposed = true;
    this.clearAutoHideTimers();
    this._statusBarItem.dispose();
    this._statusHistory = [];
  }

  private createTooltip(message: string, isLoading: boolean): string {
    let tooltip = `NeuroLint: ${message}`;

    if (isLoading) {
      tooltip += "\n\nAnalysis in progress...";
    } else {
      tooltip += "\n\nClick to view output panel";
      tooltip += "\nRight-click for NeuroLint commands";
    }

    // Add keyboard shortcuts
    tooltip += "\n\nKeyboard Shortcuts:";
    tooltip += "\n• Ctrl+Shift+L: Analyze current file";
    tooltip += "\n• Ctrl+Shift+F: Fix current file";
    tooltip += "\n• Ctrl+Shift+W: Analyze workspace";

    return tooltip;
  }

  private getBackgroundColor(message: string): vscode.ThemeColor | undefined {
    if (
      message.toLowerCase().includes("error") ||
      message.toLowerCase().includes("failed")
    ) {
      return new vscode.ThemeColor("statusBarItem.errorBackground");
    } else if (
      message.toLowerCase().includes("warning") ||
      message.toLowerCase().includes("issue")
    ) {
      return new vscode.ThemeColor("statusBarItem.warningBackground");
    } else if (
      message.toLowerCase().includes("analyzing") ||
      this._isAnalyzing
    ) {
      return new vscode.ThemeColor("statusBarItem.prominentBackground");
    }
    return undefined;
  }

  private createProgressBar(percentage: number): string {
    // Use simple text-based progress that follows VS Code theme
    return `${percentage}%`;
  }

  public setAnalyzing(analyzing: boolean): void {
    this._isAnalyzing = analyzing;

    if (analyzing) {
      this.updateStatus("Analyzing...", true);
    } else {
      this.updateStatus("Ready");
    }
  }

  public incrementProgress(message?: string): void {
    if (this._isAnalyzing && message) {
      this._statusBarItem.text = `$(sync~spin) NeuroLint: ${message}`;
    }
  }
}
