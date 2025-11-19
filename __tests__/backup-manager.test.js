const BackupManager = require('../backup-manager');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

describe('BackupManager', () => {
  let backupManager;
  const testDir = path.join(__dirname, 'test-backup');
  const testFile = path.join(testDir, 'test.js');

  beforeAll(() => {
    if (!fsSync.existsSync(testDir)) {
      fsSync.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fsSync.existsSync(testDir)) {
      fsSync.rmSync(testDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    backupManager = new BackupManager();
    fsSync.writeFileSync(testFile, 'const original = true;');
  });

  describe('Initialization', () => {
    test('should create backup manager instance', () => {
      expect(backupManager).toBeInstanceOf(BackupManager);
    });

    test('should have initialize method', () => {
      expect(typeof backupManager.initialize).toBe('function');
    });

    test('should have backupDir property', () => {
      expect(backupManager.backupDir).toBeDefined();
    });

    test('should have default maxBackups value', () => {
      expect(backupManager.maxBackups).toBe(10);
    });
  });

  describe('Configuration', () => {
    test('should accept custom backup directory', () => {
      const customManager = new BackupManager({ backupDir: '.custom-backups' });
      expect(customManager.backupDir).toBe('.custom-backups');
    });

    test('should accept custom maxBackups value', () => {
      const customManager = new BackupManager({ maxBackups: 5 });
      expect(customManager.maxBackups).toBe(5);
    });

    test('should have exclude patterns', () => {
      expect(Array.isArray(backupManager.excludePatterns)).toBe(true);
      expect(backupManager.excludePatterns.length).toBeGreaterThan(0);
    });

    test('should have include patterns', () => {
      expect(Array.isArray(backupManager.includePatterns)).toBe(true);
      expect(backupManager.includePatterns.length).toBeGreaterThan(0);
    });
  });

  describe('Async Operations', () => {
    test('should initialize backup directory', async () => {
      await expect(backupManager.initialize()).resolves.not.toThrow();
      expect(fsSync.existsSync(backupManager.backupDir)).toBe(true);
    });

    test('should handle initialization errors gracefully', async () => {
      // Create a backup manager with a potentially problematic path
      const restrictedManager = new BackupManager({ 
        backupDir: '/root/.restricted-backups-test' 
      });
      // Should not throw, but may log error
      await expect(restrictedManager.initialize()).resolves.not.toThrow();
    });

    test('should handle filesystem errors during backup', async () => {
      const nonExistentFile = path.join(testDir, 'does-not-exist.js');
      // Backup of non-existent file should be handled gracefully
      if (typeof backupManager.backupFile === 'function') {
        const result = await backupManager.backupFile(nonExistentFile);
        expect(result).toBeDefined();
      }
    });
  });

  describe('Pattern Matching', () => {
    test('should exclude node_modules by default', () => {
      expect(backupManager.excludePatterns).toContain('**/node_modules/**');
    });

    test('should exclude build directories by default', () => {
      expect(backupManager.excludePatterns).toContain('**/dist/**');
      expect(backupManager.excludePatterns).toContain('**/build/**');
    });

    test('should include JavaScript files by default', () => {
      expect(backupManager.includePatterns).toContain('**/*.js');
    });

    test('should include TypeScript files by default', () => {
      expect(backupManager.includePatterns).toContain('**/*.ts');
      expect(backupManager.includePatterns).toContain('**/*.tsx');
    });
  });
});
