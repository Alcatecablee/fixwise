import * as vscode from "vscode";

export interface NeuroLintConfiguration {
  apiUrl: string;
  apiKey: string;
  enabledLayers: number[];
  autoFix: boolean;
  showInlineHints: boolean;
  diagnosticsLevel: "error" | "warning" | "info";
  timeout: number;
  workspace: WorkspaceSettings;
}

export interface WorkspaceSettings {
  excludePatterns: string[];
  includePatterns: string[];
  maxFileSize: number;
  maxFiles: number;
}

export interface ConfigurationValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConfigurationManager {
  private configuration: NeuroLintConfiguration;
  private readonly configurationSection = "neurolint";

  constructor() {
    this.configuration = this.loadConfiguration();
  }

  public getConfiguration(): NeuroLintConfiguration {
    return { ...this.configuration };
  }

  public getApiUrl(): string {
    return this.configuration.apiUrl;
  }

  public getApiKey(): string {
    return this.configuration.apiKey;
  }

  public getEnabledLayers(): number[] {
    return [...this.configuration.enabledLayers];
  }

  public getDiagnosticsLevel(): "error" | "warning" | "info" {
    return this.configuration.diagnosticsLevel;
  }

  public getWorkspaceSettings(): WorkspaceSettings {
    return { ...this.configuration.workspace };
  }

  public getTimeout(): number {
    return this.configuration.timeout;
  }

  public isAutoFixEnabled(): boolean {
    return this.configuration.autoFix;
  }

  public areInlineHintsEnabled(): boolean {
    return this.configuration.showInlineHints;
  }

  public async setApiUrl(
    apiUrl: string,
    scope: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global,
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configurationSection);
    await config.update("apiUrl", apiUrl, scope);
    this.configuration.apiUrl = apiUrl;
  }

  public async setApiKey(
    apiKey: string,
    scope: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global,
  ): Promise<void> {
    // For security, don't store API key in plain text settings
    // The API key will be handled by the ApiClient's secret storage
    this.configuration.apiKey = apiKey;
  }

  public async setEnabledLayers(
    layers: number[],
    scope: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global,
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configurationSection);
    await config.update("enabledLayers", layers, scope);
    this.configuration.enabledLayers = layers;
  }

  public async setAutoFix(
    enabled: boolean,
    scope: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global,
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configurationSection);
    await config.update("autoFix", enabled, scope);
    this.configuration.autoFix = enabled;
  }

  public async setShowInlineHints(
    enabled: boolean,
    scope: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global,
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configurationSection);
    await config.update("showInlineHints", enabled, scope);
    this.configuration.showInlineHints = enabled;
  }

  public async setDiagnosticsLevel(
    level: "error" | "warning" | "info",
    scope: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global,
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configurationSection);
    await config.update("diagnosticsLevel", level, scope);
    this.configuration.diagnosticsLevel = level;
  }

  public async setTimeout(
    timeout: number,
    scope: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global,
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configurationSection);
    await config.update("timeout", timeout, scope);
    this.configuration.timeout = timeout;
  }

  public async setWorkspaceSettings(
    settings: WorkspaceSettings,
    scope: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace,
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configurationSection);
    await config.update("workspace", settings, scope);
    this.configuration.workspace = settings;
  }

  public reloadConfiguration(): void {
    this.configuration = this.loadConfiguration();
  }

  public validateConfiguration(): ConfigurationValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate API URL
    if (!this.configuration.apiUrl) {
      errors.push("API URL is required");
    } else if (!this.isValidUrl(this.configuration.apiUrl)) {
      errors.push("API URL must be a valid HTTP/HTTPS URL");
    }

    // Validate API Key
    if (!this.configuration.apiKey) {
      warnings.push("API Key is not set - some features may be limited");
    } else if (this.configuration.apiKey.length < 10) {
      warnings.push("API Key appears to be too short");
    }

    // Validate enabled layers
    if (this.configuration.enabledLayers.length === 0) {
      warnings.push("No analysis layers are enabled");
    }

    const invalidLayers = this.configuration.enabledLayers.filter(
      (layer) => layer < 1 || layer > 6,
    );
    if (invalidLayers.length > 0) {
      errors.push(
        `Invalid layer numbers: ${invalidLayers.join(", ")} (must be 1-6)`,
      );
    }

    // Validate timeout
    if (this.configuration.timeout < 1000) {
      warnings.push("Timeout is very low, requests may fail");
    } else if (this.configuration.timeout > 300000) {
      warnings.push("Timeout is very high, requests may hang");
    }

    // Validate workspace settings
    if (this.configuration.workspace.maxFiles < 1) {
      errors.push("Maximum files must be at least 1");
    }

    if (this.configuration.workspace.maxFileSize < 1024) {
      warnings.push("Maximum file size is very small");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public getConfigurationSummary(): any {
    return {
      apiUrl: this.configuration.apiUrl,
      hasApiKey: !!this.configuration.apiKey,
      enabledLayers: this.configuration.enabledLayers,
      autoFix: this.configuration.autoFix,
      showInlineHints: this.configuration.showInlineHints,
      diagnosticsLevel: this.configuration.diagnosticsLevel,
      timeout: this.configuration.timeout,
      workspace: this.configuration.workspace,
    };
  }

  private loadConfiguration(): NeuroLintConfiguration {
    const config = vscode.workspace.getConfiguration(this.configurationSection);

    return {
      apiUrl: config.get("apiUrl", "https://app.neurolint.dev/api"),
      apiKey: config.get("apiKey", ""),
      enabledLayers: config.get("enabledLayers", [1, 2, 3, 4]),
      autoFix: config.get("autoFix", false),
      showInlineHints: config.get("showInlineHints", true),
      diagnosticsLevel: config.get("diagnosticsLevel", "warning"),
      timeout: config.get("timeout", 30000),
      workspace: {
        excludePatterns: config.get("workspace.excludePatterns", [
          "**/node_modules/**",
          "**/dist/**",
          "**/build/**",
          "**/.next/**",
          "**/coverage/**",
        ]),
        includePatterns: config.get("workspace.includePatterns", [
          "**/*.ts",
          "**/*.tsx",
          "**/*.js",
          "**/*.jsx",
        ]),
        maxFileSize: config.get("workspace.maxFileSize", 10485760), // 10MB
        maxFiles: config.get("workspace.maxFiles", 1000),
      },
    };
  }

  private isValidUrl(string: string): boolean {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  public async resetConfiguration(): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configurationSection);

    // Reset all settings to undefined (which will use defaults)
    const settingsToReset = [
      "apiUrl",
      "apiKey",
      "enabledLayers",
      "autoFix",
      "showInlineHints",
      "diagnosticsLevel",
      "timeout",
      "workspace",
    ];

    for (const setting of settingsToReset) {
      await config.update(
        setting,
        undefined,
        vscode.ConfigurationTarget.Global,
      );
    }

    // Reload configuration
    this.reloadConfiguration();
  }

  public async exportConfiguration(uri: vscode.Uri): Promise<void> {
    const exportData = {
      version: "1.0",
      configuration: this.getConfigurationSummary(),
      exportedAt: new Date().toISOString(),
    };

    const content = JSON.stringify(exportData, null, 2);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
  }

  public async importConfiguration(uri: vscode.Uri): Promise<void> {
    const content = await vscode.workspace.fs.readFile(uri);
    const data = JSON.parse(content.toString());

    if (!data.configuration) {
      throw new Error("Invalid configuration file format");
    }

    const config = vscode.workspace.getConfiguration(this.configurationSection);
    const importedConfig = data.configuration;

    // Import settings one by one
    if (importedConfig.apiUrl) {
      await config.update(
        "apiUrl",
        importedConfig.apiUrl,
        vscode.ConfigurationTarget.Global,
      );
    }

    if (importedConfig.enabledLayers) {
      await config.update(
        "enabledLayers",
        importedConfig.enabledLayers,
        vscode.ConfigurationTarget.Global,
      );
    }

    if (typeof importedConfig.autoFix === "boolean") {
      await config.update(
        "autoFix",
        importedConfig.autoFix,
        vscode.ConfigurationTarget.Global,
      );
    }

    if (typeof importedConfig.showInlineHints === "boolean") {
      await config.update(
        "showInlineHints",
        importedConfig.showInlineHints,
        vscode.ConfigurationTarget.Global,
      );
    }

    if (importedConfig.diagnosticsLevel) {
      await config.update(
        "diagnosticsLevel",
        importedConfig.diagnosticsLevel,
        vscode.ConfigurationTarget.Global,
      );
    }

    if (importedConfig.timeout) {
      await config.update(
        "timeout",
        importedConfig.timeout,
        vscode.ConfigurationTarget.Global,
      );
    }

    if (importedConfig.workspace) {
      await config.update(
        "workspace",
        importedConfig.workspace,
        vscode.ConfigurationTarget.Workspace,
      );
    }

    // Reload configuration
    this.reloadConfiguration();
  }
}
