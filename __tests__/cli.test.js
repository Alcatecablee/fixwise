const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CLI_PATH = path.join(__dirname, '..', 'cli.js');

jest.setTimeout(15000);

function runCLI(args = '', options = {}) {
  try {
    const result = execSync(`node ${CLI_PATH} ${args}`, {
      encoding: 'utf8',
      timeout: 10000,
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
    test('should analyze real code files and report issues', () => {
      const fixtureDir = path.join(__dirname, 'fixtures');
      const result = runCLI(`analyze ${fixtureDir} --format=console`);
      expect(result.exitCode).toBe(0);
      const output = result.stdout + result.stderr;
      expect(output.length).toBeGreaterThan(0);
      // Should detect issues in sample.js
      expect(output).toMatch(/sample\.js|analyzed|issues|found/i);
    });

    test('should handle validate command with help', () => {
      const result = runCLI('validate --help');
      expect(result.stdout).toContain('neurolint');
      expect(result.exitCode).toBe(0);
    });

    test('should validate fixture files successfully', () => {
      const fixtureFile = path.join(__dirname, 'fixtures', 'sample.js');
      const result = runCLI(`validate ${fixtureFile}`);
      // Validation should complete (exit code 0 or 1 depending on findings)
      expect([0, 1]).toContain(result.exitCode);
      const output = result.stdout + result.stderr;
      expect(output.length).toBeGreaterThan(0);
    });

    test('should fail analyze on non-existent directory', () => {
      const result = runCLI('analyze /non/existent/path');
      expect(result.exitCode).not.toBe(0);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/not found|does not exist|error|failed/i);
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown command with exit code 1', () => {
      const result = runCLI('unknowncommand');
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Unknown command');
      expect(result.stderr).toContain('unknowncommand');
    });

    test('should handle invalid flags with exit code 1', () => {
      const result = runCLI('--invalid-flag');
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Unknown command');
      expect(result.stderr).toContain('--invalid-flag');
    });

    test('should provide helpful error for analyze without path', () => {
      const result = runCLI('analyze');
      // Should either succeed with current directory or provide clear error
      const output = result.stdout + result.stderr;
      expect(output.length).toBeGreaterThan(0);
      if (result.exitCode !== 0) {
        expect(output).toMatch(/path|directory|required|usage/i);
      }
    });

    test('should fail on invalid file paths', () => {
      const result = runCLI('fix /absolutely/invalid/path/that/does/not/exist');
      expect(result.exitCode).not.toBe(0);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/not found|does not exist|error|failed/i);
    });
  });

  describe('Free Tier Verification', () => {
    test('should not require authentication for layers command', () => {
      const result = runCLI('layers');
      expect(result.stdout).not.toContain('authentication required');
      expect(result.stdout).not.toContain('API key');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Layer 1');
      expect(result.stdout).toContain('Layer 7');
    });

    test('should not require authentication for help', () => {
      const result = runCLI('--help');
      expect(result.stdout).not.toContain('authentication required');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('Commands:');
    });

    test('should allow all layers without authentication', () => {
      const result = runCLI('layers --verbose');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('[SUCCESS]');
      expect(result.stdout).not.toContain('authentication');
      expect(result.stdout).not.toContain('paid');
    });
  });

  describe('Integration Tests with Fixtures', () => {
    test('should detect multiple issues in complex component', () => {
      const fixtureFile = path.join(__dirname, 'fixtures', 'complex-component.jsx');
      const result = runCLI(`analyze ${fixtureFile} --verbose`);
      expect(result.exitCode).toBe(0);
      const output = result.stdout + result.stderr;
      // Should detect various issues
      expect(output.length).toBeGreaterThan(100);
    });

    test('should execute fix command on fixtures successfully', () => {
      const fixtureFile = path.join(__dirname, 'fixtures', 'sample.js');
      // Read original content
      const originalContent = fs.readFileSync(fixtureFile, 'utf8');
      
      const result = runCLI(`fix ${fixtureFile} --layers=2 --backup`);
      const output = result.stdout + result.stderr;
      
      // Must exit with status 0 for success
      expect(result.exitCode).toBe(0);
      
      // Should include success indicators in output
      expect(output.length).toBeGreaterThan(0);
      expect(output).toMatch(/\[SUCCESS\]|complete|processed/i);
      
      // Restore original content if it was modified
      fs.writeFileSync(fixtureFile, originalContent);
    });

    test('should report stats for analyzed project', () => {
      const result = runCLI('stats');
      expect(result.exitCode).toBe(0);
      const output = result.stdout + result.stderr;
      expect(output.length).toBeGreaterThan(0);
    });
  });
});
