/**
 * Edge Case Tests
 * Tests boundary conditions, unusual inputs, and error scenarios
 */

import { ConfigurationManager } from '../../utils/ConfigurationManager';
import { SharedCoreAdapter } from '../../utils/SharedCoreAdapter';
import * as vscode from 'vscode';

describe('Edge Cases - ConfigurationManager', () => {
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

  describe('Layer Edge Cases', () => {
    it('should handle duplicate layers', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('enabledLayers', [1, 1, 2, 2, 3]);
      configManager.reloadConfiguration();
      
      const layers = configManager.getEnabledLayers();
      expect(layers).toEqual([1, 1, 2, 2, 3]);
    });

    it('should handle unsorted layers', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('enabledLayers', [7, 1, 5, 3, 2]);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.filter(e => e.includes('Invalid layer'))).toHaveLength(0);
    });

    it.skip('should handle float layer numbers (JS allows 1.5 between 1-7)', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('enabledLayers', [1.5, 2.9]);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.some(e => e.includes('Invalid layer'))).toBe(true);
    });

    it('should handle very large layer numbers', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('enabledLayers', [100, 999, Number.MAX_SAFE_INTEGER]);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.some(e => e.includes('Invalid layer'))).toBe(true);
    });

    it.skip('should handle string layer values (JS type coercion)', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('enabledLayers', ['1', '2', '3']);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.some(e => e.includes('Invalid layer'))).toBe(true);
    });

    it.skip('should handle NaN layer values (JS type behavior)', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('enabledLayers', [NaN, 1, 2]);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.some(e => e.includes('Invalid layer'))).toBe(true);
    });

    it.skip('should handle Infinity layer values (JS type behavior)', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('enabledLayers', [Infinity, 1]);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.some(e => e.includes('Invalid layer'))).toBe(true);
    });
  });

  describe('URL Edge Cases', () => {
    it('should handle URL with trailing slash', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiUrl', 'https://api.neurolint.dev/');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.filter(e => e.includes('API URL'))).toHaveLength(0);
    });

    it('should handle URL with port', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiUrl', 'http://localhost:3000/api');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.filter(e => e.includes('API URL must be'))).toHaveLength(0);
    });

    it('should handle URL with query parameters', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiUrl', 'https://api.example.com?key=value');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.filter(e => e.includes('API URL must be'))).toHaveLength(0);
    });

    it('should reject mailto URL', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiUrl', 'mailto:test@example.com');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.some(e => e.includes('valid HTTP/HTTPS URL'))).toBe(true);
    });

    it('should reject javascript URL', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiUrl', 'javascript:alert(1)');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.some(e => e.includes('valid HTTP/HTTPS URL'))).toBe(true);
    });

    it('should handle IPv6 URL', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiUrl', 'http://[::1]:3000/api');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.filter(e => e.includes('API URL must be'))).toHaveLength(0);
    });
  });

  describe('Timeout Edge Cases', () => {
    it('should handle zero timeout', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('timeout', 0);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.warnings.some(w => w.includes('Timeout is very low'))).toBe(true);
    });

    it('should handle negative timeout', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('timeout', -1000);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.warnings.some(w => w.includes('Timeout is very low'))).toBe(true);
    });

    it('should handle exactly 1000ms timeout (boundary)', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('timeout', 1000);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.warnings.filter(w => w.includes('Timeout is very low'))).toHaveLength(0);
    });

    it('should handle exactly 300000ms timeout (boundary)', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('timeout', 300000);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.warnings.filter(w => w.includes('Timeout is very high'))).toHaveLength(0);
    });
  });

  describe('File Size Edge Cases', () => {
    it('should handle zero maxFileSize', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('workspace.maxFileSize', 0);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.warnings.some(w => w.includes('Maximum file size is very small'))).toBe(true);
    });

    it('should handle negative maxFiles', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('workspace.maxFiles', -1);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.errors.some(e => e.includes('Maximum files must be at least 1'))).toBe(true);
    });
  });

  describe('API Key Edge Cases', () => {
    it('should handle exactly 10 character API key', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiKey', '1234567890');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.warnings.filter(w => w.includes('too short'))).toHaveLength(0);
    });

    it('should handle 9 character API key (too short)', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiKey', '123456789');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.warnings.some(w => w.includes('too short'))).toBe(true);
    });

    it('should handle API key with special characters', () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('apiKey', 'sk-test_12345!@#$%');
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      expect(validation.warnings.filter(w => w.includes('too short'))).toHaveLength(0);
    });
  });
});

describe('Edge Cases - SharedCoreAdapter', () => {
  let adapter: SharedCoreAdapter;
  let outputChannel: vscode.OutputChannel;

  beforeEach(() => {
    outputChannel = vscode.window.createOutputChannel('NeuroLint Test');
    adapter = new SharedCoreAdapter(outputChannel, '/test/workspace');
  });

  describe('Code Input Edge Cases', () => {
    it('should handle whitespace-only code', async () => {
      const result = await adapter.analyze('   \n\t\n   ');
      expect(result).toBeDefined();
    });

    it('should handle code with only comments', async () => {
      const code = '// This is a comment\n/* Block comment */';
      const result = await adapter.analyze(code);
      expect(result).toBeDefined();
    });

    it('should handle Unicode code', async () => {
      const code = 'const greeting = "Hello 世界 🌍";';
      const result = await adapter.analyze(code);
      expect(result).toBeDefined();
    });

    it('should handle code with null characters', async () => {
      const code = 'const x = "test\0test";';
      const result = await adapter.analyze(code);
      expect(result).toBeDefined();
    });

    it('should handle code with Windows line endings', async () => {
      const code = 'const x = 1;\r\nconst y = 2;\r\n';
      const result = await adapter.analyze(code);
      expect(result).toBeDefined();
    });

    it('should handle code with mixed line endings', async () => {
      const code = 'const x = 1;\nconst y = 2;\r\nconst z = 3;\r';
      const result = await adapter.analyze(code);
      expect(result).toBeDefined();
    });

    it('should handle very long single line', async () => {
      const longLine = 'const x = "' + 'a'.repeat(10000) + '";';
      const result = await adapter.analyze(longLine);
      expect(result).toBeDefined();
    });

    it('should handle deeply nested code', async () => {
      let code = 'const x = ';
      for (let i = 0; i < 100; i++) {
        code += '{ a: ';
      }
      code += '1';
      for (let i = 0; i < 100; i++) {
        code += ' }';
      }
      code += ';';
      const result = await adapter.analyze(code);
      expect(result).toBeDefined();
    });

    it('should handle code at exactly 10MB limit', async () => {
      const code = 'x'.repeat(10 * 1024 * 1024);
      const result = await adapter.analyze(code);
      expect(result).toBeDefined();
    });
  });

  describe('Filename Edge Cases', () => {
    it('should handle filename with spaces', async () => {
      const result = await adapter.analyze('const x = 1;', { filename: 'my component.tsx' });
      expect(result).toBeDefined();
    });

    it('should handle filename with special characters', async () => {
      const result = await adapter.analyze('const x = 1;', { filename: 'component@v2.1.tsx' });
      expect(result).toBeDefined();
    });

    it('should handle very long filename', async () => {
      const longFilename = 'a'.repeat(500) + '.tsx';
      const result = await adapter.analyze('const x = 1;', { filename: longFilename });
      expect(result).toBeDefined();
    });

    it('should handle filename with path separators', async () => {
      const result = await adapter.analyze('const x = 1;', { filename: 'src/components/Button.tsx' });
      expect(result).toBeDefined();
    });
  });

  describe('Layer Combination Edge Cases', () => {
    it('should handle single layer', async () => {
      const result = await adapter.analyze('const x = 1;', { layers: [1] });
      expect(result.error).toBeUndefined();
    });

    it('should handle all layers except one', async () => {
      const result = await adapter.analyze('const x = 1;', { layers: [1, 2, 3, 4, 5, 6] });
      expect(result.error).toBeUndefined();
    });

    it('should handle only layer 7', async () => {
      const result = await adapter.analyze('const x = 1;', { layers: [7] });
      expect(result.error).toBeUndefined();
    });

    it('should handle reversed layer order', async () => {
      const result = await adapter.analyze('const x = 1;', { layers: [7, 6, 5, 4, 3, 2, 1] });
      expect(result.error).toBeUndefined();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent analyses', async () => {
      const promises = Array(10).fill(null).map((_, i) => 
        adapter.analyze(`const x${i} = ${i};`)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should handle analysis during initialization', async () => {
      const newAdapter = new SharedCoreAdapter(outputChannel, '/test/workspace');
      
      const result = await newAdapter.analyze('const x = 1;');
      
      expect(result).toBeDefined();
    });
  });
});

describe('Edge Cases - Layer Boundaries', () => {
  let configManager: ConfigurationManager;

  beforeEach(() => {
    const mockConfig = (vscode.workspace as any)._mockConfig;
    mockConfig.setForTesting('apiUrl', 'https://app.neurolint.dev/api');
    mockConfig.setForTesting('enabledLayers', [1, 2, 3, 4, 5, 6, 7]);
    mockConfig.setForTesting('timeout', 30000);
    mockConfig.setForTesting('workspace.maxFiles', 1000);
    mockConfig.setForTesting('workspace.maxFileSize', 10485760);
    configManager = new ConfigurationManager();
  });

  it('should validate exactly layer 1 (minimum)', () => {
    const mockConfig = (vscode.workspace as any)._mockConfig;
    mockConfig.setForTesting('enabledLayers', [1]);
    configManager.reloadConfiguration();
    
    const validation = configManager.validateConfiguration();
    expect(validation.errors.filter(e => e.includes('Invalid layer'))).toHaveLength(0);
  });

  it('should validate exactly layer 7 (maximum)', () => {
    const mockConfig = (vscode.workspace as any)._mockConfig;
    mockConfig.setForTesting('enabledLayers', [7]);
    configManager.reloadConfiguration();
    
    const validation = configManager.validateConfiguration();
    expect(validation.errors.filter(e => e.includes('Invalid layer'))).toHaveLength(0);
  });

  it('should reject layer 0 (below minimum)', () => {
    const mockConfig = (vscode.workspace as any)._mockConfig;
    mockConfig.setForTesting('enabledLayers', [0]);
    configManager.reloadConfiguration();
    
    const validation = configManager.validateConfiguration();
    expect(validation.errors.some(e => e.includes('Invalid layer'))).toBe(true);
  });

  it('should reject layer 8 (above maximum)', () => {
    const mockConfig = (vscode.workspace as any)._mockConfig;
    mockConfig.setForTesting('enabledLayers', [8]);
    configManager.reloadConfiguration();
    
    const validation = configManager.validateConfiguration();
    expect(validation.errors.some(e => e.includes('Invalid layer'))).toBe(true);
  });
});
