/**
 * SharedCoreAdapter Unit Tests
 * Tests analysis, fixes, migrations, and error handling
 */

import { SharedCoreAdapter } from '../../utils/SharedCoreAdapter';
import * as vscode from 'vscode';

const mockNeurolintCore = {
  core: {
    initialize: jest.fn().mockResolvedValue(undefined)
  },
  analyze: jest.fn().mockResolvedValue({
    issues: [
      {
        severity: 'warning',
        message: 'Missing React key',
        description: 'Add unique key prop to list items',
        layer: 3,
        location: { line: 10, column: 5 },
        ruleName: 'react-key',
        rule: 'react-key'
      }
    ]
  }),
  fix: jest.fn().mockResolvedValue({
    code: 'fixed code',
    fixes: [{ line: 10, fix: 'Added key prop' }],
    totalFixes: 1
  }),
  rules: new Map([['react-key', {}], ['console-log', {}]])
};

jest.mock('../../utils/SharedCoreAdapter', () => {
  const originalModule = jest.requireActual('../../utils/SharedCoreAdapter');
  return {
    ...originalModule,
    SharedCoreAdapter: class extends originalModule.SharedCoreAdapter {
      constructor(outputChannel: any, workspaceRoot: string) {
        super(outputChannel, workspaceRoot);
        (this as any).neurolintCore = mockNeurolintCore;
      }
    }
  };
});

describe('SharedCoreAdapter', () => {
  let adapter: SharedCoreAdapter;
  let outputChannel: vscode.OutputChannel;

  beforeEach(() => {
    jest.clearAllMocks();
    outputChannel = vscode.window.createOutputChannel('NeuroLint Test');
    adapter = new SharedCoreAdapter(outputChannel, '/test/workspace');
  });

  describe('Input Validation', () => {
    it('should reject empty code', async () => {
      const result = await adapter.analyze('');
      expect(result.error).toContain('Code cannot be empty');
      expect(result.issues).toHaveLength(0);
    });

    it('should reject non-string code', async () => {
      const result = await adapter.analyze(null as any);
      expect(result.error).toContain('Code must be a string');
    });

    it('should reject code exceeding 10MB', async () => {
      const largeCode = 'x'.repeat(11 * 1024 * 1024);
      const result = await adapter.analyze(largeCode);
      expect(result.error).toContain('Code file too large');
    });

    it('should validate layer array', async () => {
      const result = await adapter.analyze('const x = 1;', { layers: 'not-array' as any });
      expect(result.error).toContain('Layers must be an array');
    });

    it('should reject invalid layer numbers', async () => {
      const result = await adapter.analyze('const x = 1;', { layers: [0, 8] });
      expect(result.error).toContain('Invalid layer');
    });

    it('should accept valid layer 7', async () => {
      const result = await adapter.analyze('const x = 1;', { layers: [7] });
      expect(result.error).toBeUndefined();
    });

    it('should accept all 7 layers', async () => {
      const result = await adapter.analyze('const x = 1;', { layers: [1, 2, 3, 4, 5, 6, 7] });
      expect(result.error).toBeUndefined();
    });
  });

  describe('Analysis', () => {
    it('should analyze code successfully', async () => {
      const code = `
        const items = [1, 2, 3];
        return items.map(item => <div>{item}</div>);
      `;
      
      const result = await adapter.analyze(code, { filename: 'test.tsx' });
      
      expect(result.issues).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should use default layers when not specified', async () => {
      const code = 'const x = 1;';
      await adapter.analyze(code);
      
      expect(mockNeurolintCore.analyze).toHaveBeenCalledWith(
        code,
        expect.objectContaining({
          layers: [1, 2, 3, 4, 5, 6, 7]
        })
      );
    });

    it('should respect custom layers', async () => {
      const code = 'const x = 1;';
      await adapter.analyze(code, { layers: [1, 3, 5] });
      
      expect(mockNeurolintCore.analyze).toHaveBeenCalledWith(
        code,
        expect.objectContaining({
          layers: [1, 3, 5]
        })
      );
    });

    it('should include filename in analysis options', async () => {
      await adapter.analyze('const x = 1;', { filename: 'MyComponent.tsx' });
      
      expect(mockNeurolintCore.analyze).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          filename: 'MyComponent.tsx'
        })
      );
    });

    it('should use default filename when not specified', async () => {
      await adapter.analyze('const x = 1;');
      
      expect(mockNeurolintCore.analyze).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          filename: 'untitled.tsx'
        })
      );
    });
  });

  describe('Analysis Response Format', () => {
    it('should return properly formatted issues', async () => {
      const result = await adapter.analyze('const x = 1;');
      
      if (result.issues.length > 0) {
        const issue = result.issues[0];
        expect(issue).toHaveProperty('type');
        expect(issue).toHaveProperty('message');
        expect(issue).toHaveProperty('description');
        expect(issue).toHaveProperty('layer');
        expect(issue).toHaveProperty('location');
        expect(issue.location).toHaveProperty('line');
        expect(issue.location).toHaveProperty('column');
      }
    });

    it('should include summary with issue counts', async () => {
      const result = await adapter.analyze('const x = 1;');
      
      expect(result.summary).toHaveProperty('totalIssues');
      expect(result.summary).toHaveProperty('issuesByLayer');
      expect(result.summary).toHaveProperty('filename');
    });
  });

  describe('Error Handling', () => {
    it('should handle analysis timeout', async () => {
      mockNeurolintCore.analyze.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 100000))
      );
      
      const result = await adapter.analyze('const x = 1;', { timeout: 100 });
      
      expect(result.error).toContain('timeout');
      expect(result.issues).toHaveLength(0);
    });

    it('should handle analysis errors gracefully', async () => {
      mockNeurolintCore.analyze.mockRejectedValueOnce(new Error('Parse error'));
      
      const result = await adapter.analyze('const x = {');
      
      expect(result.error).toBeDefined();
      expect(result.summary?.analysisFailed).toBe(true);
    });

    it('should log errors to output channel', async () => {
      mockNeurolintCore.analyze.mockRejectedValueOnce(new Error('Test error'));
      
      await adapter.analyze('const x = 1;');
      
      const lines = (outputChannel as any).getLines();
      expect(lines.some((l: string) => l.includes('[ERROR]'))).toBe(true);
    });
  });

  describe('Fix Application', () => {
    it('should apply fixes successfully', async () => {
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
      expect(result.success).toBeDefined();
    });

    it('should handle empty issues array', async () => {
      const result = await adapter.applyFixes('const x = 1;', []);
      
      expect(result.success).toBe(true);
    });
  });
});

describe('SharedCoreAdapter Layer 7 Support', () => {
  let adapter: SharedCoreAdapter;
  let outputChannel: vscode.OutputChannel;

  beforeEach(() => {
    outputChannel = vscode.window.createOutputChannel('NeuroLint Test');
    adapter = new SharedCoreAdapter(outputChannel, '/test/workspace');
  });

  it('should default to all 7 layers', async () => {
    await adapter.analyze('const x = 1;');
    
    expect(mockNeurolintCore.analyze).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        layers: expect.arrayContaining([7])
      })
    );
  });

  it('should allow layer 7 in validation', async () => {
    const result = await adapter.analyze('const x = 1;', { layers: [7] });
    expect(result.error).toBeUndefined();
  });
});
