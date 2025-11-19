/**
 * Production Backup Manager
 * Enhanced backup system for production environments
 */

const BackupManager = require('./backup-manager');

class ProductionBackupManager extends BackupManager {
  constructor(options = {}) {
    super(options);
    this.environment = options.environment || 'production';
    this.loggerConfig = options.loggerConfig || {};
  }

  async createBackup(filePath, content) {
    // Enhanced backup with logging
    if (this.loggerConfig.enableConsole) {
      console.log(`[BACKUP] Creating backup for ${filePath}`);
    }
    
    return super.createBackup(filePath, content);
  }
}

module.exports = { ProductionBackupManager };
