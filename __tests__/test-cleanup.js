const fs = require('fs');
const path = require('path');

module.exports = async function globalTeardown() {
  const baseDir = process.cwd();
  const backupDirs = [
    path.join(baseDir, '.neurolint-backups'),
    path.join(baseDir, '.neurolint'),
  ];

  backupDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✓ Cleaned up: ${dir}`);
      } catch (error) {
        console.warn(`⚠ Could not clean up ${dir}: ${error.message}`);
      }
    }
  });

  const tmpDirs = fs.readdirSync('/tmp');
  const testDirs = tmpDirs.filter(d => 
    d.startsWith('neurolint-') || 
    d.startsWith('backup-test-') || 
    d.startsWith('error-test-')
  );

  testDirs.forEach(dir => {
    const fullPath = path.join('/tmp', dir);
    try {
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    } catch (error) {
    }
  });

  console.log('✓ Test cleanup complete');
};
