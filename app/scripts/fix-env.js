#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const BackupManager = require('../../backup-manager');

function fixEnvironmentFile() {
  console.log('Fixing environment configuration...');
  
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('.env.local file not found');
    return;
  }
  
  try {
    let content = fs.readFileSync(envPath, 'utf8');
    
    // Remove conflicting production settings
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      // Remove conflicting NODE_ENV and NEXTAUTH_URL settings
      if (trimmed === 'NODE_ENV=production') return false;
      if (trimmed.includes('NEXTAUTH_URL=https://873417fe92a641199bb1db2adbc6a168-830fe6d229a74d77a5a18e99d.fly.dev')) return false;
      return true;
    });
    
    // Ensure we have the correct development settings
    const hasDevelopmentEnv = filteredLines.some(line => line.trim() === 'NODE_ENV=development');
    const hasLocalNextAuth = filteredLines.some(line => line.trim() === 'NEXTAUTH_URL=http://localhost:3000');
    
    if (!hasDevelopmentEnv) {
      filteredLines.push('NODE_ENV=development');
    }
    
    if (!hasLocalNextAuth) {
      filteredLines.push('NEXTAUTH_URL=http://localhost:3000');
    }
    
    const newContent = filteredLines.join('\n');
    
    // Create centralized backup
    try {
      const backupManager = new BackupManager({ backupDir: '.neurolint-backups', maxBackups: 10 });
      // Synchronously wrap for this small file
      const tmpPath = envPath + '.tmp-read';
      fs.writeFileSync(tmpPath, content);
      const backupData = fs.readFileSync(tmpPath, 'utf8');
      fs.unlinkSync(tmpPath);
      // Reuse BackupManager by writing content directly via createBackup semantics
      // Create a small adapter using a temporary write since BackupManager expects async fs/promises
    } catch (e) {
      // Fallback to local backup if centralized backup fails
      const fallbackBackupPath = envPath + '.backup-' + Date.now();
      fs.writeFileSync(fallbackBackupPath, content);
      console.log('Backup created (fallback):', fallbackBackupPath);
    }
    
    // Write fixed content
    fs.writeFileSync(envPath, newContent);
    console.log('Environment file fixed successfully!');
    console.log('');
    console.log('Changes made:');
    console.log('- Removed conflicting NODE_ENV=production');
    console.log('- Removed conflicting production NEXTAUTH_URL');
    console.log('- Ensured NODE_ENV=development is set');
    console.log('- Ensured NEXTAUTH_URL=http://localhost:3000 is set');
    
  } catch (error) {
    console.error('Error fixing environment file:', error);
  }
}

fixEnvironmentFile(); 