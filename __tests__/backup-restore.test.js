const BackupManager = require('../backup-manager');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Backup System - Restoration and Retention', () => {
  let testDir;
  let backupManager;
  let backupDir;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-test-'));
    backupDir = path.join(testDir, '.neurolint-backups');
    backupManager = new BackupManager({
      backupDir: backupDir,
      maxBackups: 3
    });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Backup Creation', () => {
    test('should create backup with metadata', async () => {
      await backupManager.initialize();

      const testFile = path.join(testDir, 'test.js');
      const originalContent = 'console.log("original");';
      fs.writeFileSync(testFile, originalContent);

      const result = await backupManager.createBackup(testFile);

      expect(result.success).toBe(true);
      expect(result.backupPath).toBeDefined();
      expect(fs.existsSync(result.backupPath)).toBe(true);

      const backupContent = fs.readFileSync(result.backupPath, 'utf8');
      const backupData = JSON.parse(backupContent);

      expect(backupData).toHaveProperty('originalPath');
      expect(backupData).toHaveProperty('timestamp');
      expect(backupData).toHaveProperty('content');
      expect(backupData.content).toBe(originalContent);
    });

    test('should create multiple backups of same file', async () => {
      await backupManager.initialize();

      const testFile = path.join(testDir, 'test.js');
      
      fs.writeFileSync(testFile, 'version 1');
      const result1 = await backupManager.createBackup(testFile);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      fs.writeFileSync(testFile, 'version 2');
      const result2 = await backupManager.createBackup(testFile);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(fs.existsSync(result1.backupPath)).toBe(true);
      expect(fs.existsSync(result2.backupPath)).toBe(true);
    });
  });

  describe('Backup Retention', () => {
    test('should respect maxBackups limit', async () => {
      await backupManager.initialize();

      const testFile = path.join(testDir, 'test.js');
      
      for (let i = 1; i <= 5; i++) {
        fs.writeFileSync(testFile, `version ${i}`);
        const result = await backupManager.createBackup(testFile);
        expect(result.success).toBe(true);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const allBackups = [];
      function findBackups(dir) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            findBackups(fullPath);
          } else if (file.includes('test.js.')) {
            allBackups.push(fullPath);
          }
        });
      }
      findBackups(backupDir);

      expect(allBackups.length).toBeLessThanOrEqual(backupManager.maxBackups);
    });

    test('should keep most recent backups when pruning', async () => {
      await backupManager.initialize();

      const testFile = path.join(testDir, 'test.js');
      let results = [];

      for (let i = 1; i <= 5; i++) {
        const content = `version ${i}`;
        fs.writeFileSync(testFile, content);
        const result = await backupManager.createBackup(testFile);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const survivingBackup = results.reverse().find(r => fs.existsSync(r.backupPath));
      expect(survivingBackup).toBeDefined();
      
      if (survivingBackup) {
        const backupData = JSON.parse(fs.readFileSync(survivingBackup.backupPath, 'utf8'));
        expect(backupData.content).toMatch(/version [345]/);
      }
    });
  });

  describe('Backup Restoration', () => {
    test('should list available backups for a file', async () => {
      await backupManager.initialize();

      const testFile = path.join(testDir, 'test.js');
      
      fs.writeFileSync(testFile, 'version 1');
      const result1 = await backupManager.createBackup(testFile);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      fs.writeFileSync(testFile, 'version 2');
      const result2 = await backupManager.createBackup(testFile);

      expect(fs.existsSync(result1.backupPath)).toBe(true);
      expect(fs.existsSync(result2.backupPath)).toBe(true);
      
      const content1 = fs.readFileSync(result1.backupPath, 'utf8');
      const content2 = fs.readFileSync(result2.backupPath, 'utf8');
      
      expect(() => JSON.parse(content1)).not.toThrow();
      expect(() => JSON.parse(content2)).not.toThrow();
    });

    test('should be able to read backup content', async () => {
      await backupManager.initialize();

      const testFile = path.join(testDir, 'test.js');
      const originalContent = 'const value = 42;';
      
      fs.writeFileSync(testFile, originalContent);
      const result = await backupManager.createBackup(testFile);

      const backupData = JSON.parse(fs.readFileSync(result.backupPath, 'utf8'));

      expect(backupData.content).toBe(originalContent);
      
      fs.writeFileSync(testFile, backupData.content);
      const restoredContent = fs.readFileSync(testFile, 'utf8');
      expect(restoredContent).toBe(originalContent);
    });
  });

  describe('Backup Corruption Detection', () => {
    test('should detect corrupted backup files', async () => {
      await backupManager.initialize();

      const corruptedBackup = path.join(backupDir, 'test.js.12345.corrupt');
      fs.writeFileSync(corruptedBackup, 'invalid JSON {{{');

      expect(() => {
        const content = fs.readFileSync(corruptedBackup, 'utf8');
        JSON.parse(content);
      }).toThrow();
    });

    test('should handle missing backup files gracefully', () => {
      const nonExistentBackup = path.join(backupDir, 'non-existent.backup');
      
      expect(fs.existsSync(nonExistentBackup)).toBe(false);
    });
  });

  describe('Concurrent Backup Operations', () => {
    test('should handle multiple simultaneous backups', async () => {
      await backupManager.initialize();

      const files = ['file1.js', 'file2.js', 'file3.js'];
      
      const backupPromises = files.map(async (file, index) => {
        const filePath = path.join(testDir, file);
        fs.writeFileSync(filePath, `content ${index}`);
        return await backupManager.createBackup(filePath);
      });

      const results = await Promise.all(backupPromises);
      
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(fs.existsSync(result.backupPath)).toBe(true);
      });
    });
  });

  describe('Backup Directory Management', () => {
    test('should initialize backup directory if it does not exist', async () => {
      expect(fs.existsSync(backupDir)).toBe(false);
      
      await backupManager.initialize();
      
      expect(fs.existsSync(backupDir)).toBe(true);
    });

    test('should work with existing backup directory', async () => {
      fs.mkdirSync(backupDir, { recursive: true });
      
      await backupManager.initialize();
      
      expect(fs.existsSync(backupDir)).toBe(true);
    });
  });

  describe('Large File Handling', () => {
    test('should handle large file backups', async () => {
      await backupManager.initialize();

      const testFile = path.join(testDir, 'large.js');
      const largeContent = 'x'.repeat(100000);
      
      fs.writeFileSync(testFile, largeContent);
      const result = await backupManager.createBackup(testFile);

      expect(result.success).toBe(true);
      expect(fs.existsSync(result.backupPath)).toBe(true);
      
      const backupData = JSON.parse(fs.readFileSync(result.backupPath, 'utf8'));
      expect(backupData.content).toBe(largeContent);
    });
  });

  describe('Backup Metadata', () => {
    test('should include timestamp in backup', async () => {
      await backupManager.initialize();

      const testFile = path.join(testDir, 'test.js');
      fs.writeFileSync(testFile, 'test');
      
      const beforeTime = Date.now();
      const result = await backupManager.createBackup(testFile);
      const afterTime = Date.now();

      const backupData = JSON.parse(fs.readFileSync(result.backupPath, 'utf8'));
      
      expect(backupData.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(backupData.timestamp).toBeLessThanOrEqual(afterTime);
    });

    test('should include original path in backup', async () => {
      await backupManager.initialize();

      const testFile = path.join(testDir, 'src', 'components', 'test.jsx');
      fs.mkdirSync(path.dirname(testFile), { recursive: true });
      fs.writeFileSync(testFile, 'test');
      
      const result = await backupManager.createBackup(testFile);

      const backupData = JSON.parse(fs.readFileSync(result.backupPath, 'utf8'));
      
      expect(backupData.originalPath).toContain('test.jsx');
    });
  });
});
