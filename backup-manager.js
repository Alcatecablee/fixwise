/**
 * Centralized Backup Management System
 * Provides clean, organized backup functionality for NeuroLint
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class BackupManager {
  constructor(options = {}) {
    this.backupDir = options.backupDir || '.neurolint-backups';
    this.maxBackups = options.maxBackups || 10;
    this.excludePatterns = options.excludePatterns || [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/.git/**',
      '**/coverage/**',
      '**/.neurolint-backups/**',
      '**/*.backup-*'
    ];
    this.includePatterns = options.includePatterns || [
      '**/*.js',
      '**/*.ts',
      '**/*.jsx',
      '**/*.tsx',
      '**/*.json',
      '**/*.md',
      '**/*.css',
      '**/*.scss',
      '**/*.html'
    ];
  }

  /**
   * Initialize backup directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log(`Backup directory initialized: ${this.backupDir}`);
    } catch (error) {
      console.error(`Failed to initialize backup directory: ${error.message}`);
    }
  }

  /**
   * Create a backup of a file with organized structure
   */
  async createBackup(filePath, operation = 'auto') {
    try {
      // Read original file
      const content = await fs.readFile(filePath, 'utf8');
      
      // Generate backup metadata
      const timestamp = Date.now();
      const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
      const relativePath = path.relative(process.cwd(), filePath);
      
      // Create organized backup path
      const backupFileName = `${path.basename(filePath)}.${timestamp}.${hash}`;
      const backupSubDir = path.dirname(relativePath);
      const backupPath = path.join(this.backupDir, backupSubDir, backupFileName);
      
      // Ensure backup directory exists
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      
      // Create backup with metadata
      const backupData = {
        originalPath: relativePath,
        timestamp,
        hash,
        operation,
        content
      };
      
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
      
      // Clean old backups for this file
      await this.cleanOldBackups(relativePath);
      
      return {
        success: true,
        backupPath,
        originalPath: filePath,
        timestamp,
        hash
      };
    } catch (error) {
      console.error(`Failed to create backup for ${filePath}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        originalPath: filePath
      };
    }
  }

  /**
   * Restore a file from backup
   */
  async restoreFromBackup(backupPath, targetPath = null) {
    try {
      const raw = await fs.readFile(backupPath, 'utf8');
      const backupData = JSON.parse(raw);
      
      const restorePath = targetPath || path.join(process.cwd(), backupData.originalPath);
      
      // Ensure target directory exists
      await fs.mkdir(path.dirname(restorePath), { recursive: true });
      
      // Write to a temp file first for atomic-like behavior
      const tempPath = `${restorePath}.neurolint-restore-tmp-${Date.now()}`;
      await fs.writeFile(tempPath, backupData.content);
      
      // Optional integrity check using md5 hash if present
      if (backupData.hash) {
        const computed = require('crypto').createHash('md5').update(backupData.content).digest('hex').substring(0, 8);
        if (computed !== backupData.hash) {
          // Cleanup temp and abort
          try { await fs.unlink(tempPath); } catch {}
          return { success: false, error: 'Backup integrity check failed (hash mismatch)', backupPath };
        }
      }
      
      // Rename temp to final path
      // On Windows, if target exists, replace by unlink then rename
      try {
        await fs.rename(tempPath, restorePath);
      } catch (err) {
        if (err && (err.code === 'EEXIST' || err.code === 'EPERM')) {
          try { await fs.unlink(restorePath); } catch {}
          await fs.rename(tempPath, restorePath);
        } else {
          // Cleanup temp and rethrow
          try { await fs.unlink(tempPath); } catch {}
          throw err;
        }
      }
      
      return {
        success: true,
        restoredPath: restorePath,
        backupInfo: backupData
      };
    } catch (error) {
      console.error(`Failed to restore from backup ${backupPath}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        backupPath
      };
    }
  }

  /**
   * Clean old backups for a specific file
   */
  async cleanOldBackups(relativePath) {
    try {
      const backupSubDir = path.dirname(relativePath);
      const backupDirPath = path.join(this.backupDir, backupSubDir);
      
      // Get all backups for this file
      const files = await fs.readdir(backupDirPath);
      const fileBackups = files
        .filter(file => file.startsWith(path.basename(relativePath) + '.'))
        .map(file => ({
          name: file,
          path: path.join(backupDirPath, file),
          timestamp: parseInt(file.split('.')[1])
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
      
      // Remove old backups beyond maxBackups
      if (fileBackups.length > this.maxBackups) {
        const toRemove = fileBackups.slice(this.maxBackups);
        for (const backup of toRemove) {
          await fs.unlink(backup.path);
        }
      }
    } catch (error) {
      // Ignore errors for non-existent directories
      if (error.code !== 'ENOENT') {
        console.error(`Failed to clean old backups: ${error.message}`);
      }
    }
  }

  /**
   * List all backups
   */
  async listBackups(filter = {}) {
    try {
      const backups = [];
      
      const scanDir = async (dirPath, relativePath = '') => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const entryRelativePath = path.join(relativePath, entry.name);
          
          if (entry.isDirectory()) {
            await scanDir(fullPath, entryRelativePath);
          } else if (entry.isFile() && entry.name.includes('.')) {
            try {
              const backupData = JSON.parse(await fs.readFile(fullPath, 'utf8'));
              
              // Apply filters
              if (filter.operation && backupData.operation !== filter.operation) continue;
              if (filter.since && backupData.timestamp < filter.since) continue;
              if (filter.until && backupData.timestamp > filter.until) continue;
              
              backups.push({
                backupPath: fullPath,
                originalPath: backupData.originalPath,
                timestamp: backupData.timestamp,
                hash: backupData.hash,
                operation: backupData.operation,
                size: backupData.content.length
              });
            } catch (error) {
              // Skip non-backup files
            }
          }
        }
      };
      
      await scanDir(this.backupDir);
      
      return backups.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error(`Failed to list backups: ${error.message}`);
      return [];
    }
  }

  /**
   * Clean all backups
   */
  async cleanAllBackups() {
    try {
      await fs.rm(this.backupDir, { recursive: true, force: true });
      console.log('All backups cleaned');
    } catch (error) {
      console.error(`Failed to clean all backups: ${error.message}`);
    }
  }

  /**
   * Get backup statistics
   */
  async getStats() {
    try {
      const backups = await this.listBackups();
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      
      return {
        totalBackups: backups.length,
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        backupDir: this.backupDir,
        maxBackups: this.maxBackups
      };
    } catch (error) {
      console.error(`Failed to get backup stats: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if file should be excluded from processing
   */
  shouldExclude(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    for (const pattern of this.excludePatterns) {
      if (this.matchesPattern(relativePath, pattern)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if file should be included in processing
   */
  shouldInclude(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    for (const pattern of this.includePatterns) {
      if (this.matchesPattern(relativePath, pattern)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Simple pattern matching for glob-like patterns
   */
  matchesPattern(filePath, pattern) {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  /**
   * Safely write file with integrity verification
   */
  async safeWriteFile(filePath, content, operation = 'auto') {
    try {
      // Create backup first if file exists
      let backupResult = null;
      try {
        await fs.access(filePath);
        backupResult = await this.createBackup(filePath, operation);
        if (!backupResult.success) {
          console.warn(`Warning: Could not create backup for ${filePath}: ${backupResult.error}`);
        }
      } catch {
        // File doesn't exist, no backup needed
      }

      // Write content atomically using temp file
      const tempPath = `${filePath}.neurolint-write-tmp-${Date.now()}`;
      await fs.writeFile(tempPath, content);
      
      // Verify write integrity by reading back
      const writtenContent = await fs.readFile(tempPath, 'utf8');
      if (writtenContent !== content) {
        // Cleanup temp and fail
        try { await fs.unlink(tempPath); } catch {}
        return {
          success: false,
          error: 'Write integrity check failed - content mismatch',
          filePath,
          backupPath: backupResult?.backupPath
        };
      }
      
      // Rename temp to final path
      try {
        await fs.rename(tempPath, filePath);
      } catch (err) {
        if (err && (err.code === 'EEXIST' || err.code === 'EPERM')) {
          try { await fs.unlink(filePath); } catch {}
          await fs.rename(tempPath, filePath);
        } else {
          // Cleanup temp and rethrow
          try { await fs.unlink(tempPath); } catch {}
          throw err;
        }
      }

      return {
        success: true,
        filePath,
        backupPath: backupResult?.backupPath,
        size: content.length
      };
    } catch (error) {
      console.error(`Failed to safely write ${filePath}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        filePath
      };
    }
  }
}

module.exports = BackupManager; 