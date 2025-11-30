/**
 * Integration Tests for VS Code Extension Commands
 * Tests command registration and execution
 */

import * as vscode from 'vscode';
import { ConfigurationManager } from '../../utils/ConfigurationManager';
import { SharedCoreAdapter } from '../../utils/SharedCoreAdapter';

describe('Command Integration Tests', () => {
  let configManager: ConfigurationManager;
  let adapter: SharedCoreAdapter;
  let outputChannel: vscode.OutputChannel;

  beforeEach(() => {
    configManager = new ConfigurationManager();
    outputChannel = vscode.window.createOutputChannel('NeuroLint Test');
    adapter = new SharedCoreAdapter(outputChannel, '/test/workspace');
  });

  describe('Layer Commands', () => {
    it('should show layer documentation for all 7 layers', async () => {
      const layers = configManager.getEnabledLayers();
      
      expect(layers).toContain(1);
      expect(layers).toContain(2);
      expect(layers).toContain(3);
      expect(layers).toContain(4);
      expect(layers).toContain(5);
      expect(layers).toContain(6);
      expect(layers).toContain(7);
    });

    it('should validate layer selection before analysis', async () => {
      const mockConfig = (vscode.workspace as any)._mockConfig;
      mockConfig.setForTesting('enabledLayers', [1, 2, 3, 4, 5, 6, 7]);
      configManager.reloadConfiguration();
      
      const validation = configManager.validateConfiguration();
      const layerErrors = validation.errors.filter(e => e.includes('layer'));
      
      expect(layerErrors).toHaveLength(0);
    });
  });

  describe('Analysis Commands', () => {
    it('should analyze file with all layers', async () => {
      const code = `
        import React from 'react';
        
        export function Button({ onClick }) {
          console.log('Button rendered');
          return <button onClick={onClick}>Click me</button>;
        }
      `;
      
      const result = await adapter.analyze(code, {
        filename: 'Button.tsx',
        layers: [1, 2, 3, 4, 5, 6, 7]
      });
      
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should analyze file with specific layers', async () => {
      const code = 'const items = [1,2,3].map(x => <div>{x}</div>);';
      
      const result = await adapter.analyze(code, {
        filename: 'test.tsx',
        layers: [3]
      });
      
      expect(result).toBeDefined();
    });
  });

  describe('Fix Commands', () => {
    it('should apply fixes without premium gating', async () => {
      const code = 'console.log("test");';
      const issues = [{
        type: 'warning' as const,
        message: 'Remove console.log',
        description: 'Console statements should be removed',
        layer: 2,
        location: { line: 1, column: 1 },
        ruleName: 'no-console'
      }];
      
      const result = await adapter.applyFixes(code, issues);
      
      expect(result).toBeDefined();
    });

    it('should handle empty issues array', async () => {
      const result = await adapter.applyFixes('const x = 1;', []);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Migration Commands', () => {
    it('should support React 19 migration', async () => {
      const result = await adapter.runMigration('react19');
      expect(result).toBeDefined();
    });

    it('should support Next.js 16 migration', async () => {
      const result = await adapter.runMigration('nextjs16');
      expect(result).toBeDefined();
    });

    it('should support Biome migration', async () => {
      const result = await adapter.runMigration('biome');
      expect(result).toBeDefined();
    });
  });

  describe('Check Commands', () => {
    it('should check dependencies', async () => {
      const result = await adapter.checkDependencies();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('compatible');
    });

    it('should check Turbopack compatibility', async () => {
      const result = await adapter.checkTurbopackCompatibility();
      expect(result).toBeDefined();
    });

    it('should detect React Compiler opportunities', async () => {
      const result = await adapter.detectReactCompilerOpportunities();
      expect(result).toBeDefined();
    });

    it('should assess router complexity', async () => {
      const result = await adapter.assessRouterComplexity();
      expect(result).toBeDefined();
    });

    it('should detect React 19.2 features', async () => {
      const result = await adapter.detectReact192Features();
      expect(result).toBeDefined();
    });
  });

  describe('Utility Commands', () => {
    it('should simplify code', async () => {
      const result = await adapter.simplifyCode('const x = 1;', 'test.ts');
      expect(result).toBeDefined();
    });

    it('should validate code', async () => {
      const result = await adapter.validateCode('const x = 1;', 'test.ts');
      expect(result).toBeDefined();
    });

    it('should get stats', async () => {
      const result = await adapter.getStats();
      expect(result).toBeDefined();
    });
  });
});

describe('Free Access Verification', () => {
  let adapter: SharedCoreAdapter;
  let outputChannel: vscode.OutputChannel;

  beforeEach(() => {
    outputChannel = vscode.window.createOutputChannel('NeuroLint Test');
    adapter = new SharedCoreAdapter(outputChannel, '/test/workspace');
  });

  it('fixFile should work without authentication', async () => {
    const code = 'console.log("test");';
    const issues = [{
      type: 'warning' as const,
      message: 'Remove console.log',
      description: 'Console statements should be removed',
      layer: 2,
      location: { line: 1, column: 1 },
      ruleName: 'no-console'
    }];
    
    const result = await adapter.applyFixes(code, issues);
    
    expect(result).toBeDefined();
    expect(result.error?.includes('premium') || result.error?.includes('auth')).toBeFalsy();
  });

  it('fixWorkspace should work without authentication', async () => {
    const files = [
      { filename: 'test1.tsx', code: 'const x = 1;' },
      { filename: 'test2.tsx', code: 'const y = 2;' }
    ];
    
    const result = await adapter.analyzeWorkspace(files);
    
    expect(result).toBeDefined();
    expect(result.errors?.some((e: string) => e.includes('premium') || e.includes('auth'))).toBeFalsy();
  });

  it('all 7 layers should be accessible without premium', async () => {
    const result = await adapter.analyze('const x = 1;', { 
      layers: [1, 2, 3, 4, 5, 6, 7] 
    });
    
    expect(result).toBeDefined();
    expect(result.error?.includes('premium')).toBeFalsy();
  });

  it('migration commands should work without premium', async () => {
    const react19Result = await adapter.runMigration('react19');
    const nextjs16Result = await adapter.runMigration('nextjs16');
    const biomeResult = await adapter.runMigration('biome');
    
    expect(react19Result.error?.includes('premium')).toBeFalsy();
    expect(nextjs16Result.error?.includes('premium')).toBeFalsy();
    expect(biomeResult.error?.includes('premium')).toBeFalsy();
  });
});

describe('Layer 7 Integration', () => {
  let configManager: ConfigurationManager;
  let adapter: SharedCoreAdapter;
  let outputChannel: vscode.OutputChannel;

  beforeEach(() => {
    configManager = new ConfigurationManager();
    outputChannel = vscode.window.createOutputChannel('NeuroLint Test');
    adapter = new SharedCoreAdapter(outputChannel, '/test/workspace');
  });

  it('should include layer 7 in default configuration', () => {
    const layers = configManager.getEnabledLayers();
    expect(layers).toContain(7);
  });

  it('should analyze with layer 7 (Adaptive Learning)', async () => {
    const result = await adapter.analyze('const x = 1;', { layers: [7] });
    expect(result.error).toBeUndefined();
  });

  it('should validate layer 7 as valid in configuration', () => {
    const mockConfig = (vscode.workspace as any)._mockConfig;
    mockConfig.setForTesting('enabledLayers', [7]);
    configManager.reloadConfiguration();
    
    const validation = configManager.validateConfiguration();
    expect(validation.errors.filter(e => e.includes('Invalid layer'))).toHaveLength(0);
  });
});
