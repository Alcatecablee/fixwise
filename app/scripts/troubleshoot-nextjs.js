#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[INFO] NeuroLint Next.js Troubleshooting Script');
console.log('==========================================\n');

// Check Node.js version
function checkNodeVersion() {
  console.log('1. Checking Node.js version...');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 18) {
    console.log(`[SUCCESS] Node.js version: ${nodeVersion} (Compatible)`);
  } else {
    console.log(`[ERROR] Node.js version: ${nodeVersion} (Requires Node.js 18+)`);
    console.log('Please upgrade Node.js to version 18 or higher.');
    process.exit(1);
  }
}

// Check package.json dependencies
function checkDependencies() {
  console.log('\n2. Checking package.json dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    
    const requiredDeps = ['next', 'react', 'react-dom'];
    const missingDeps = [];
    
    requiredDeps.forEach(dep => {
      if (!dependencies[dep] && !devDependencies[dep]) {
        missingDeps.push(dep);
      }
    });
    
    if (missingDeps.length === 0) {
      console.log('[SUCCESS] All required dependencies are present');
      console.log(`📦 Next.js version: ${dependencies.next || devDependencies.next}`);
      console.log(`📦 React version: ${dependencies.react || devDependencies.react}`);
    } else {
      console.log(`[ERROR] Missing dependencies: ${missingDeps.join(', ')}`);
      console.log('Run: npm install');
    }
  } catch (error) {
    console.log('[ERROR] Error reading package.json:', error.message);
  }
}

// Clear Next.js cache
function clearNextCache() {
  console.log('\n3. Clearing Next.js cache...');
  
  const cacheDirs = ['.next', '.swc', 'node_modules/.cache'];
  
  cacheDirs.forEach(dir => {
    const cachePath = path.join(process.cwd(), dir);
    if (fs.existsSync(cachePath)) {
      try {
        fs.rmSync(cachePath, { recursive: true, force: true });
        console.log(`[SUCCESS] Cleared ${dir}`);
      } catch (error) {
        console.log(`[WARNING]  Could not clear ${dir}: ${error.message}`);
      }
    } else {
      console.log(`[INFO]  ${dir} does not exist`);
    }
  });
}

// Check for common configuration issues
function checkConfiguration() {
  console.log('\n4. Checking Next.js configuration...');
  
  const configFiles = ['next.config.js', 'next.config.mjs', 'next.config.ts'];
  let configFound = false;
  
  configFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`[SUCCESS] Found ${file}`);
      configFound = true;
    }
  });
  
  if (!configFound) {
    console.log('[WARNING]  No Next.js configuration file found');
  }
  
  // Check for TypeScript configuration
  if (fs.existsSync('tsconfig.json')) {
    console.log('[SUCCESS] TypeScript configuration found');
  } else {
    console.log('[WARNING]  No TypeScript configuration found');
  }
}

// Check for common file structure issues
function checkFileStructure() {
  console.log('\n5. Checking file structure...');
  
  const requiredDirs = ['app', 'components', 'lib'];
  const missingDirs = [];
  
  requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`[SUCCESS] ${dir}/ directory exists`);
    } else {
      missingDirs.push(dir);
      console.log(`[ERROR] ${dir}/ directory missing`);
    }
  });
  
  if (missingDirs.length > 0) {
    console.log(`\nMissing directories: ${missingDirs.join(', ')}`);
  }
}

// Check for port conflicts
function checkPortAvailability() {
  console.log('\n6. Checking port availability...');
  
  try {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(3000, () => {
      console.log('[SUCCESS] Port 3000 is available');
      server.close();
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log('[ERROR] Port 3000 is already in use');
        console.log('Try using a different port: npm run dev -- -p 3001');
      } else {
        console.log(`[WARNING]  Port check error: ${err.message}`);
      }
    });
  } catch (error) {
    console.log(`[WARNING]  Could not check port: ${error.message}`);
  }
}

// Generate troubleshooting report
function generateReport() {
  console.log('\n7. Generating troubleshooting report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd(),
    env: process.env.NODE_ENV || 'development',
  };
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    report.packageJson = {
      name: packageJson.name,
      version: packageJson.version,
      dependencies: Object.keys(packageJson.dependencies || {}),
      devDependencies: Object.keys(packageJson.devDependencies || {}),
    };
  } catch (error) {
    report.packageJsonError = error.message;
  }
  
  const reportPath = 'nextjs-troubleshoot-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`[SUCCESS] Troubleshooting report saved to ${reportPath}`);
}

// Provide recommendations
function provideRecommendations() {
  console.log('\n8. Recommendations:');
  console.log('==================');
  
  console.log('\nIf you\'re experiencing Next.js development server issues:');
  console.log('1. Clear all caches: npm run clean');
  console.log('2. Reinstall dependencies: rm -rf node_modules && npm install');
  console.log('3. Use the enhanced dev server: npm run dev:enhanced');
  console.log('4. Check for port conflicts and use a different port if needed');
  console.log('5. Ensure you\'re using Node.js 18+');
  console.log('6. Check the troubleshooting report for detailed information');
  
  console.log('\nCommon solutions:');
  console.log('- Restart the development server');
  console.log('- Clear browser cache and hard refresh');
  console.log('- Check for syntax errors in your components');
  console.log('- Verify all imports are correct');
  console.log('- Ensure environment variables are properly set');
}

// Main troubleshooting function
function troubleshoot() {
  try {
    checkNodeVersion();
    checkDependencies();
    clearNextCache();
    checkConfiguration();
    checkFileStructure();
    checkPortAvailability();
    generateReport();
    provideRecommendations();
    
    console.log('\n[SUCCESS] Troubleshooting complete!');
    console.log('\nIf issues persist, try:');
    console.log('npm run dev:enhanced');
    
  } catch (error) {
    console.error('\n[ERROR] Troubleshooting failed:', error.message);
    process.exit(1);
  }
}

// Run troubleshooting if this script is executed directly
if (require.main === module) {
  troubleshoot();
}

module.exports = {
  troubleshoot,
  checkNodeVersion,
  checkDependencies,
  clearNextCache,
  checkConfiguration,
  checkFileStructure,
  checkPortAvailability,
  generateReport,
  provideRecommendations,
}; 