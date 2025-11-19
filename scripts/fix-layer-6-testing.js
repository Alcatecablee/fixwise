#!/usr/bin/env node

/**
 * Layer 6: Testing Fixes
 * Enhances testing infrastructure and patterns
 */

const fs = require('fs').promises;
const path = require('path');
const BackupManager = require('../backup-manager');

/**
 * Transform code for testing improvements
 */
async function transform(code, options = {}) {
  const { dryRun = false, verbose = false, filePath = process.cwd() } = options;
  
  try {
    let updatedCode = code;
    const changes = [];
    const warnings = [];
    let changeCount = 0;

    // Test file detection patterns
    const testPatterns = [
      /\.test\.(js|jsx|ts|tsx)$/,
      /\.spec\.(js|jsx|ts|tsx)$/,
      /__tests__\//,
      /test\//,
      /tests\//
    ];

    const isTestFile = testPatterns.some(pattern => pattern.test(filePath));

    // Always run testing improvements, not just on test files
    // This allows us to add testing suggestions to any component file
    const beforeTesting = updatedCode;

    // Add testing utilities imports if missing (only for test files)
    if (isTestFile && !updatedCode.includes('@testing-library/react') && 
        !updatedCode.includes('@testing-library/jest-dom') &&
        (updatedCode.includes('render') || updatedCode.includes('screen'))) {
      updatedCode = `import { render, screen } from '@testing-library/react';\nimport '@testing-library/jest-dom';\n\n${updatedCode}`;
      changes.push({ 
        type: 'TestingImports', 
        description: 'Added testing library imports', 
        location: { line: 1 } 
      });
    }

    // Improve test descriptions (only for test files)
    if (isTestFile) {
      updatedCode = updatedCode.replace(
        /(describe|it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g,
        (match, testType, description) => {
          if (description.length < 10) {
            const improvedDescription = `${description} should work correctly`;
            changes.push({ 
              type: 'TestDescription', 
              description: `Improved test description: "${description}" -> "${improvedDescription}"`, 
              location: null 
            });
            return `${testType}('${improvedDescription}'`;
          }
          return match;
        }
      );

      // Add accessibility testing
      if (updatedCode.includes('render') && !updatedCode.includes('toBeInTheDocument')) {
        updatedCode = updatedCode.replace(
          /(render\s*\(\s*<[^>]+>)/g,
          (match) => {
            changes.push({ 
              type: 'AccessibilityTesting', 
              description: 'Added accessibility testing suggestion', 
              location: null 
            });
            return `${match}\n  // Consider adding: expect(screen.getByRole('button')).toBeInTheDocument();`;
          }
        );
      }
    }

    // Add general testing suggestions for component files
    if (!isTestFile && updatedCode.includes('export default') && updatedCode.includes('function')) {
      changes.push({ 
        type: 'TestingSuggestion', 
        description: 'Component detected - consider adding unit tests', 
        location: null 
      });
    }

    if (updatedCode !== beforeTesting) {
      changeCount = changes.length;
    }

    // No changes -> fail with expected message
    if (changeCount === 0) {
      return {
        success: false,
        code,
        originalCode: code,
        changeCount: 0,
        error: 'No changes were made',
        states: [code],
        changes,
        warnings
      };
    }

    // Dry-run behavior
    if (dryRun) {
      if (verbose && changeCount > 0) {
        process.stdout.write(`[SUCCESS] Layer 6 identified ${changeCount} testing improvements (dry-run)\n`);
      }
      return {
        success: true,
        code: updatedCode,
        originalCode: code,
        changeCount,
        states: [code, updatedCode],
        changes,
        warnings,
        dryRun: true
      };
    }

    if (verbose && changeCount > 0) {
      process.stdout.write(`[SUCCESS] Layer 6 applied ${changeCount} testing improvements to ${path.basename(filePath)}\n`);
    }

    return {
      success: true,
      code: updatedCode,
      originalCode: code,
      changeCount,
      states: [code, updatedCode],
      changes,
      warnings
    };

  } catch (error) {
    return {
      success: false,
      code,
      originalCode: code,
      changeCount: 0,
      error: error.message,
      states: [code],
      changes: [],
      warnings: [error.message]
    };
  }
}

/**
 * Generate test files for components
 */
async function generateTestFiles(componentPath, options = {}) {
  const { dryRun = false, verbose = false } = options;
  
  try {
    const componentContent = await fs.readFile(componentPath, 'utf8');
    const componentName = path.basename(componentPath, path.extname(componentPath));
    const testPath = componentPath.replace(/\.(jsx?|tsx?)$/, '.test.$1');
    
    // Extract component props from TypeScript interfaces or PropTypes
    const propsMatch = componentContent.match(/interface\s+(\w+Props)\s*\{([^}]+)\}/);
    const propTypesMatch = componentContent.match(/PropTypes\.shape\(\{([^}]+)\}\)/);
    
    let props = [];
    if (propsMatch) {
      props = propsMatch[2].split('\n')
        .map(line => line.trim())
        .filter(line => line.includes(':'))
        .map(line => {
          const [name] = line.split(':');
          return name.trim();
        });
    } else if (propTypesMatch) {
      props = propTypesMatch[1].split('\n')
        .map(line => line.trim())
        .filter(line => line.includes(':'))
        .map(line => {
          const [name] = line.split(':');
          return name.trim();
        });
    }
    
    const testContent = `import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ${componentName} from './${componentName}';

describe('${componentName}', () => {
  it('should render correctly', () => {
    render(<${componentName} />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should handle props correctly', () => {
    const testProps = {
      ${props.map(prop => `${prop}: 'test-${prop}'`).join(',\n      ')}
    };
    
    render(<${componentName} {...testProps} />);
    // Add specific prop testing here
  });

  it('should be accessible', () => {
    render(<${componentName} />);
    // Add accessibility testing here
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
`;

    if (dryRun) {
      return {
        success: true,
        testPath,
        testContent,
        dryRun: true
      };
    }

    // Create backup if file exists, then write
    const backupManager = new BackupManager({
      backupDir: '.neurolint-backups',
      maxBackups: 10
    });
    
    try {
      await fs.access(testPath);
      const backupResult = await backupManager.createBackup(testPath, 'layer-6-testing');
      if (!backupResult.success) {
        console.warn(`Warning: Could not create backup for ${testPath}: ${backupResult.error}`);
      }
    } catch {
      // File doesn't exist, no backup needed
    }

    await fs.writeFile(testPath, testContent);
    
    return {
      success: true,
      testPath,
      testContent
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Setup testing environment
 */
async function setupTestingEnvironment(projectPath, options = {}) {
  const { dryRun = false, verbose = false } = options;
  
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    // Add testing dependencies if missing
    const testingDeps = {
      '@testing-library/react': '^13.0.0',
      '@testing-library/jest-dom': '^5.16.5',
      '@testing-library/user-event': '^14.0.0',
      'jest': '^29.0.0',
      'jest-environment-jsdom': '^29.0.0'
    };
    
    let updated = false;
    for (const [dep, version] of Object.entries(testingDeps)) {
      if (!packageJson.devDependencies?.[dep]) {
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          [dep]: version
        };
        updated = true;
      }
    }
    
    // Add test scripts if missing
    if (!packageJson.scripts?.test) {
      packageJson.scripts = {
        ...packageJson.scripts,
        test: 'jest',
        'test:watch': 'jest --watch',
        'test:coverage': 'jest --coverage'
      };
      updated = true;
    }
    
    if (updated && !dryRun) {
      const backupManager = new BackupManager({
        backupDir: '.neurolint-backups',
        maxBackups: 10
      });
      const backupResult = await backupManager.createBackup(packageJsonPath, 'layer-6-testing');
      if (!backupResult.success) {
        console.warn(`Warning: Could not create backup for ${packageJsonPath}: ${backupResult.error}`);
      }
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
    
    // Create Jest configuration
    const jestConfigPath = path.join(projectPath, 'jest.config.js');
    if (!dryRun) {
      const backupManager = new BackupManager({
        backupDir: '.neurolint-backups',
        maxBackups: 10
      });
      
      const jestConfig = `module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  collectCoverageFrom: [
    'src/**/*.(js|jsx|ts|tsx)',
    '!src/**/*.d.ts',
    '!src/**/*.stories.(js|jsx|ts|tsx)'
  ]
};`;
      
      // Backup jest config if it exists
      try {
        await fs.access(jestConfigPath);
        const backupResult = await backupManager.createBackup(jestConfigPath, 'layer-6-testing');
        if (!backupResult.success) {
          console.warn(`Warning: Could not create backup for ${jestConfigPath}: ${backupResult.error}`);
        }
      } catch {
        // File doesn't exist, no backup needed
      }
      
      await fs.writeFile(jestConfigPath, jestConfig);
    }
    
    // Create Jest setup file
    const jestSetupPath = path.join(projectPath, 'jest.setup.js');
    if (!dryRun) {
      const jestSetup = `import '@testing-library/jest-dom';`;
      
      // Backup jest setup if it exists
      try {
        await fs.access(jestSetupPath);
        const backupResult = await backupManager.createBackup(jestSetupPath, 'layer-6-testing');
        if (!backupResult.success) {
          console.warn(`Warning: Could not create backup for ${jestSetupPath}: ${backupResult.error}`);
        }
      } catch {
        // File doesn't exist, no backup needed
      }
      
      await fs.writeFile(jestSetupPath, jestSetup);
    }
    
    return {
      success: true,
      updated,
      jestConfigPath: dryRun ? 'jest.config.js' : jestConfigPath,
      jestSetupPath: dryRun ? 'jest.setup.js' : jestSetupPath
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { 
  transform,
  generateTestFiles,
  setupTestingEnvironment
}; 