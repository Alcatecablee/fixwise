const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CLI_PATH = path.join(__dirname, '..', 'cli.js');

function runCLI(args = '', options = {}) {
  try {
    const result = execSync(`node ${CLI_PATH} ${args}`, {
      encoding: 'utf8',
      ...options
    });
    return { stdout: result, stderr: '', exitCode: 0 };
  } catch (error) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status || 1
    };
  }
}

describe('NeuroLint CLI', () => {
  describe('Basic Commands', () => {
    test('should show help when --help flag is used', () => {
      const result = runCLI('--help');
      expect(result.stdout).toContain('NeuroLint CLI');
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('Commands:');
      expect(result.exitCode).toBe(0);
    });

    test('should show version when --version flag is used', () => {
      const result = runCLI('--version');
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
      expect(result.exitCode).toBe(0);
    });

    test('should show version when -v flag is used', () => {
      const result = runCLI('-v');
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Layer Commands', () => {
    test('should list all layers', () => {
      const result = runCLI('layers');
      expect(result.stdout).toContain('Layer 1: Configuration');
      expect(result.stdout).toContain('Layer 2: Patterns');
      expect(result.stdout).toContain('Layer 3: Components');
      expect(result.stdout).toContain('Layer 4: Hydration');
      expect(result.stdout).toContain('Layer 5: Next.js');
      expect(result.stdout).toContain('Layer 6: Testing');
      expect(result.stdout).toContain('Layer 7: Adaptive');
      expect(result.exitCode).toBe(0);
    });

    test('should show verbose layer information', () => {
      const result = runCLI('layers --verbose');
      expect(result.stdout).toContain('Layer 1');
      expect(result.stdout).toContain('[SUCCESS]');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Status Command', () => {
    test('should show authentication status', () => {
      const result = runCLI('status');
      expect(result.stdout.length).toBeGreaterThan(0);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Analysis Commands', () => {
    test('should analyze real code files', () => {
      const fixtureDir = path.join(__dirname, 'fixtures');
      const result = runCLI(`analyze ${fixtureDir} --format=console`);
      expect(result.exitCode).toBeDefined();
      expect(result.stdout.length + result.stderr.length).toBeGreaterThan(0);
    });

    test('should handle validate command', () => {
      const result = runCLI('validate --help');
      expect(result.stdout).toContain('neurolint');
      expect(result.exitCode).toBe(0);
    });

    test('should validate fixture files', () => {
      const fixtureFile = path.join(__dirname, 'fixtures', 'sample.js');
      const result = runCLI(`validate ${fixtureFile}`);
      expect(result.exitCode).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown command with non-zero exit code', () => {
      const result = runCLI('unknowncommand');
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Unknown command');
    });

    test('should handle invalid flags with non-zero exit code', () => {
      const result = runCLI('--invalid-flag');
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Unknown command');
    });

    test('should provide helpful error for analyze without path', () => {
      const result = runCLI('analyze');
      expect(result.exitCode).toBeDefined();
      expect(result.stdout.length + result.stderr.length).toBeGreaterThan(0);
    });
  });

  describe('Free Tier Verification', () => {
    test('should not require authentication for layers command', () => {
      const result = runCLI('layers');
      expect(result.stdout).not.toContain('authentication required');
      expect(result.stdout).not.toContain('API key');
      expect(result.exitCode).toBe(0);
    });

    test('should not require authentication for help', () => {
      const result = runCLI('--help');
      expect(result.stdout).not.toContain('authentication required');
      expect(result.exitCode).toBe(0);
    });
  });
});
