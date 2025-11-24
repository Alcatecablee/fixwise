/**
 * NeuroLint - Production Backup Manager
 * Enhanced backup system for production environments
 * 
 * Copyright (c) 2025 NeuroLint
 * Licensed under the Business Source License 1.1
 * 
 * Use Limitation: You may not use this software to provide a commercial
 * SaaS offering that competes with NeuroLint's code transformation services.
 * 
 * Change Date: 2029-11-22
 * Change License: GPL-3.0-or-later
 * 
 * For commercial licensing: clivemakazhu@gmail.com
 * Full license: https://github.com/Alcatecablee/Neurolint/blob/main/LICENSE
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
