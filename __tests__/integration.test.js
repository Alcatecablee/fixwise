const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const CLI_PATH = path.join(__dirname, '..', 'cli.js');

function runCLI(args = '', options = {}) {
  try {
    const result = execSync(`node ${CLI_PATH} ${args}`, {
      encoding: 'utf8',
      cwd: options.cwd || process.cwd(),
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

describe('NeuroLint End-to-End Integration Tests', () => {
  let testDir;
  let testFile;
  let backupDir;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neurolint-e2e-'));
    testFile = path.join(testDir, 'test-component.jsx');
    backupDir = path.join(testDir, '.neurolint-backups');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Layer 2: Pattern Fixes - Console Log Removal', () => {
    test('should remove console.log statements from code', () => {
      const originalCode = `function Component() {
  console.log("Debug message");
  const value = 42;
  console.log("Another debug", value);
  return <div>Hello</div>;
}`;

      fs.writeFileSync(testFile, originalCode);

      const result = runCLI(`patterns fix ${testDir} --verbose`, { cwd: testDir });

      expect(result.exitCode).toBe(0);

      const transformedCode = fs.readFileSync(testFile, 'utf8');
      expect(transformedCode).not.toContain('console.log("Debug message")');
      expect(transformedCode).not.toContain('console.log("Another debug", value)');
    });

    test('should create backup before transforming code', () => {
      const originalCode = `console.log("test");
function App() { return <div>Test</div>; }`;

      fs.writeFileSync(testFile, originalCode);

      runCLI(`patterns fix ${testDir}`, { cwd: testDir });

      expect(fs.existsSync(backupDir)).toBe(true);
      
      const backupFiles = fs.readdirSync(backupDir, { recursive: true });
      const backupFile = backupFiles.find(f => f.includes('test-component.jsx'));
      
      expect(backupFile).toBeDefined();
      
      if (backupFile) {
        const backupContent = fs.readFileSync(path.join(backupDir, backupFile), 'utf8');
        const backupData = JSON.parse(backupContent);
        expect(backupData.content).toContain('console.log("test")');
        expect(backupData.originalPath).toBe('test-component.jsx');
      }
    });
  });

  describe('Layer 3: Component Fixes - React Keys', () => {
    test('should add missing keys to mapped components', () => {
      const originalCode = `function Component() {
  const items = [1, 2, 3];
  return items.map(item => <div>{item}</div>);
}`;

      fs.writeFileSync(testFile, originalCode);

      const result = runCLI(`components fix ${testDir} --verbose`, { cwd: testDir });

      expect(result.exitCode).toBe(0);

      const transformedCode = fs.readFileSync(testFile, 'utf8');
      expect(transformedCode).toContain('key=');
    });
  });

  describe('Dry Run Mode', () => {
    test('should not modify files when --dry-run is used', () => {
      const originalCode = `console.log("Should not be removed");
function Component() { return <div>Test</div>; }`;

      fs.writeFileSync(testFile, originalCode);

      const result = runCLI(`patterns fix ${testDir} --dry-run --verbose`, { cwd: testDir });

      expect(result.exitCode).toBe(0);

      const fileContent = fs.readFileSync(testFile, 'utf8');
      expect(fileContent).toBe(originalCode);
    });

    test('should show changes in dry-run output', () => {
      const originalCode = `console.log("test");`;
      fs.writeFileSync(testFile, originalCode);

      const result = runCLI(`patterns fix ${testDir} --dry-run --verbose`, { cwd: testDir });

      expect(result.stdout).toMatch(/dry-run|dry run|preview|identified.*fixes/i);
    });
  });

  describe('Backup System', () => {
    test('should create backups by default', () => {
      const originalCode = `console.log("test");`;
      fs.writeFileSync(testFile, originalCode);

      runCLI(`patterns fix ${testDir}`, { cwd: testDir });

      expect(fs.existsSync(backupDir)).toBe(true);
    });
  });

  describe('Multiple Layer Execution', () => {
    test('should apply multiple layers with --layers flag', () => {
      const originalCode = `console.log("remove me");
function Component() {
  const items = [1, 2, 3];
  return items.map(item => <div>{item}</div>);
}`;

      fs.writeFileSync(testFile, originalCode);

      const result = runCLI(`fix ${testDir} --layers=2,3 --verbose`, { cwd: testDir });

      expect(result.exitCode).toBe(0);

      const transformedCode = fs.readFileSync(testFile, 'utf8');
      
      expect(transformedCode).not.toContain('console.log("remove me")');
      
      expect(transformedCode).toContain('key=');
    });
  });

  describe('File Pattern Handling', () => {
    test('should accept include flag without errors', () => {
      const jsxFile = path.join(testDir, 'component.jsx');
      const jsFile = path.join(testDir, 'script.js');
      
      fs.writeFileSync(jsxFile, 'console.log("jsx");');
      fs.writeFileSync(jsFile, 'console.log("js");');

      const result = runCLI(`patterns fix ${testDir} --include="**/*.jsx"`, { cwd: testDir });

      expect(result.exitCode).toBe(0);
      
      const jsxContent = fs.readFileSync(jsxFile, 'utf8');
      expect(jsxContent).toContain('// [NeuroLint] Removed console.log');
    });

    test('should accept exclude flag without errors', () => {
      const regularFile = path.join(testDir, 'component.jsx');
      const excludedFile = path.join(testDir, 'vendor.jsx');
      
      fs.writeFileSync(regularFile, 'console.log("regular");');
      fs.writeFileSync(excludedFile, 'console.log("vendor");');

      const result = runCLI(`patterns fix ${testDir} --exclude="vendor.*"`, { cwd: testDir });

      expect(result.exitCode).toBe(0);
      
      const regularContent = fs.readFileSync(regularFile, 'utf8');
      expect(regularContent).toContain('// [NeuroLint] Removed console.log');
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent directory gracefully', () => {
      const fakeDir = path.join(testDir, 'non-existent');
      
      const result = runCLI(`fix ${fakeDir}`, { cwd: testDir });

      expect(result.exitCode).toBe(1);
      expect(result.stderr || result.stdout).toContain('Error' || 'not exist' || 'not found');
    });

    test('should handle invalid file syntax gracefully', () => {
      const invalidCode = `function broken( {{{{{ invalid syntax`;
      fs.writeFileSync(testFile, invalidCode);

      const result = runCLI(`patterns fix ${testDir}`, { cwd: testDir });

      const fileStillExists = fs.existsSync(testFile);
      expect(fileStillExists).toBe(true);
    });
  });

  describe('Stats and Reporting', () => {
    test('should provide statistics after fix operation', () => {
      const code = `console.log("test");`;
      fs.writeFileSync(testFile, code);

      const result = runCLI(`patterns fix ${testDir} --verbose`, { cwd: testDir });

      expect(result.stdout).toContain('SUCCESS' || 'Complete' || 'Fixed' || 'processed');
    });
  });

  describe('Analyze Command', () => {
    test('should detect issues without fixing them', () => {
      const code = `console.log("issue");
function Component() {
  const items = [1, 2, 3];
  return items.map(item => <div>{item}</div>);
}`;
      
      fs.writeFileSync(testFile, code);
      const originalCode = code;

      const result = runCLI(`analyze ${testDir} --verbose`, { cwd: testDir });

      expect(result.exitCode).toBe(0);

      const fileContent = fs.readFileSync(testFile, 'utf8');
      expect(fileContent).toBe(originalCode);
    });
  });

  describe('Validate Command', () => {
    test('should validate files without modification', () => {
      const code = `function Component() { return <div>Valid</div>; }`;
      fs.writeFileSync(testFile, code);

      const result = runCLI(`validate ${testDir}`, { cwd: testDir });

      expect(result.exitCode).toBe(0);
      
      const fileContent = fs.readFileSync(testFile, 'utf8');
      expect(fileContent).toBe(code);
    });
  });
});
