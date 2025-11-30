/**
 * ConfigurationManager Unit Tests
 * Tests configuration loading, validation, and layer management
 */

import { ConfigurationManager, NeuroLintConfiguration, ConfigurationValidation } from '../../utils/ConfigurationManager';
import * as vscode from 'vscode';

describe('ConfigurationManager', () => {
  let configManager: ConfigurationManager;

  beforeEach(() => {
    const mockConfig = (vscode.workspace as any)._mockConfig;
    mockConfig.setForTesting('apiUrl', 'https://app.neurolint.dev/api');
    mockConfig.setForTesting('apiKey', '');
    mockConfig.setForTesting('enabledLayers', [1, 2, 3, 4, 5, 6, 7]);
    mockConfig.setForTesting('timeout', 30000);
    mockConfig.setForTesting('workspace.maxFiles', 1000);
    mockConfig.setForTesting('workspace.maxFileSize', 10485760);
    configManager = new ConfigurationManager();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const config = configManager.getConfiguration();
      expect(config).toBeDefined();
      expect(config.apiUrl).toBe('https://app.neurolint.dev/api');
      expect(config.enabledLayers).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('should return a copy of configuration to prevent mutation', () => {
      const config1 = configManager.getConfiguration();
      const config2 = configManager.getConfiguration();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('Layer Validation', () => {
    it('should validate layers 1-7 as valid', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('enabledLayers', [1, 2, 3, 4, 5, 6, 7]);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      const layerErrors = validation.errors.filter(e => e.includes('Invalid layer'));
      expect(layerErrors.length).toBe(0);
    });

    it('should reject layer 0 as invalid', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('enabledLayers', [0, 1, 2]);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.some(e => e.includes('Invalid layer'))).toBe(true);
      expect(validation.valid).toBe(false);
    });

    it('should reject layer 8 as invalid', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('enabledLayers', [1, 2, 8]);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.some(e => e.includes('Invalid layer'))).toBe(true);
    });

    it('should reject negative layers', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('enabledLayers', [-1, 1, 2]);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.some(e => e.includes('Invalid layer'))).toBe(true);
    });

    it('should warn when no layers are enabled', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('enabledLayers', []);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.warnings.some(w => w.includes('No analysis layers'))).toBe(true);
    });

    it('should accept single layer', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('enabledLayers', [3]);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      const layerErrors = validation.errors.filter(e => e.includes('Invalid layer'));
      expect(layerErrors.length).toBe(0);
    });

    it('should accept all 7 layers', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('enabledLayers', [1, 2, 3, 4, 5, 6, 7]);
      configManager.reloadConfiguration();
      
      const config = configManager.getEnabledLayers();
      expect(config).toHaveLength(7);
      expect(config).toContain(7);
    });
  });

  describe('API URL Validation', () => {
    it('should validate valid HTTPS URL', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiUrl', 'https://api.neurolint.dev');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.filter(e => e.includes('API URL'))).toHaveLength(0);
    });

    it('should validate valid HTTP URL', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiUrl', 'http://localhost:3000');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.filter(e => e.includes('API URL must be'))).toHaveLength(0);
    });

    it('should reject empty API URL', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiUrl', '');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.some(e => e.includes('API URL is required'))).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiUrl', 'not-a-valid-url');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.some(e => e.includes('valid HTTP/HTTPS URL'))).toBe(true);
    });

    it('should reject FTP URL', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiUrl', 'ftp://files.example.com');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.some(e => e.includes('valid HTTP/HTTPS URL'))).toBe(true);
    });
  });

  describe('Timeout Validation', () => {
    it('should warn for very low timeout', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('timeout', 500);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.warnings.some(w => w.includes('Timeout is very low'))).toBe(true);
    });

    it('should warn for very high timeout', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('timeout', 500000);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.warnings.some(w => w.includes('Timeout is very high'))).toBe(true);
    });

    it('should accept normal timeout values', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('timeout', 30000);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.warnings.filter(w => w.includes('Timeout'))).toHaveLength(0);
    });
  });

  describe('API Key Validation', () => {
    it('should warn when API key is not set', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiKey', '');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.warnings.some(w => w.includes('API Key is not set'))).toBe(true);
    });

    it('should warn when API key is too short', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiKey', 'short');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.warnings.some(w => w.includes('too short'))).toBe(true);
    });

    it('should accept valid API key', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiKey', 'valid-api-key-12345');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.warnings.filter(w => w.includes('API Key'))).toHaveLength(0);
    });
  });

  describe('Workspace Settings Validation', () => {
    it('should reject maxFiles less than 1', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('workspace.maxFiles', 0);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.some(e => e.includes('Maximum files must be at least 1'))).toBe(true);
    });

    it('should warn for very small maxFileSize', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('workspace.maxFileSize', 500);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.warnings.some(w => w.includes('Maximum file size is very small'))).toBe(true);
    });
  });

  describe('Getter Methods', () => {
    it('should return API URL', () => {
      expect(configManager.getApiUrl()).toBe('https://app.neurolint.dev/api');
    });

    it('should return enabled layers as a copy', () => {
      const layers1 = configManager.getEnabledLayers();
      const layers2 = configManager.getEnabledLayers();
      expect(layers1).not.toBe(layers2);
      expect(layers1).toEqual(layers2);
    });

    it('should return diagnostics level', () => {
      expect(configManager.getDiagnosticsLevel()).toBe('warning');
    });

    it('should return timeout', () => {
      expect(configManager.getTimeout()).toBe(30000);
    });

    it('should return autoFix status', () => {
      expect(configManager.isAutoFixEnabled()).toBe(false);
    });

    it('should return inline hints status', () => {
      expect(configManager.areInlineHintsEnabled()).toBe(true);
    });

    it('should return workspace settings as a copy', () => {
      const settings1 = configManager.getWorkspaceSettings();
      const settings2 = configManager.getWorkspaceSettings();
      expect(settings1).not.toBe(settings2);
    });
  });

  describe('Configuration Summary', () => {
    it('should return complete summary', () => {
      const summary = configManager.getConfigurationSummary();
      expect(summary).toHaveProperty('apiUrl');
      expect(summary).toHaveProperty('hasApiKey');
      expect(summary).toHaveProperty('enabledLayers');
      expect(summary).toHaveProperty('autoFix');
      expect(summary).toHaveProperty('showInlineHints');
      expect(summary).toHaveProperty('diagnosticsLevel');
      expect(summary).toHaveProperty('timeout');
      expect(summary).toHaveProperty('workspace');
    });

    it('should mask API key in summary', () => {
      const summary = configManager.getConfigurationSummary();
      expect(summary.hasApiKey).toBeDefined();
      expect(summary).not.toHaveProperty('apiKey');
    });
  });

  describe('Configuration Reload', () => {
    it('should reload configuration', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('timeout', 60000);
      
      configManager.reloadConfiguration();
      
      expect(configManager.getTimeout()).toBe(60000);
    });
  });
});

describe('Layer System Completeness', () => {
  it('should support all 7 layers by default', () => {
    const configManager = new ConfigurationManager();
    const layers = configManager.getEnabledLayers();
    
    expect(layers).toContain(1);
    expect(layers).toContain(2);
    expect(layers).toContain(3);
    expect(layers).toContain(4);
    expect(layers).toContain(5);
    expect(layers).toContain(6);
    expect(layers).toContain(7);
  });

  it('should validate layer 7 (Adaptive Learning) as valid', () => {
    const configManager = new ConfigurationManager();
    const mockConfig = (vscode.workspace as any)._mockConfig;
    mockConfig.setForTesting('enabledLayers', [7]);
    configManager.reloadConfiguration();
    
    const validation = configManager.validateConfiguration();
    expect(validation.errors.filter(e => e.includes('Invalid layer'))).toHaveLength(0);
  });
});
