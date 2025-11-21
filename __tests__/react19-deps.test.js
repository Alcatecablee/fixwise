const React19DependencyChecker = require('../scripts/react19-dependency-checker.js');
const fs = require('fs').promises;
const path = require('path');

describe('React 19 Dependency Checker', () => {
  let checker;
  let testDir;

  beforeEach(async () => {
    testDir = path.join(__dirname, 'fixtures', 'deps-test');
    await fs.mkdir(testDir, { recursive: true });
    checker = new React19DependencyChecker({ verbose: false, projectPath: testDir });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('React version checking', () => {
    test('should detect React 19 as compatible', async () => {
      const packageJson = {
        dependencies: {
          react: '^19.0.0',
          'react-dom': '^19.0.0'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checker.check();

      expect(result.react.status).toBe('compatible');
    });

    test('should detect React 18 as incompatible', async () => {
      const packageJson = {
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checker.check();

      expect(result.react.status).toBe('incompatible');
    });
  });

  describe('Known package compatibility', () => {
    test('should detect incompatible Radix UI version', async () => {
      const packageJson = {
        dependencies: {
          react: '^19.0.0',
          '@radix-ui/react-select': '^1.0.0'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checker.check();

      expect(result.dependencies).toContainEqual(
        expect.objectContaining({
          package: '@radix-ui/react-select',
          issue: expect.stringContaining('useEffectEvent')
        })
      );
    });

    test('should detect incompatible Ant Design version', async () => {
      const packageJson = {
        dependencies: {
          react: '^19.0.0',
          antd: '^5.0.0'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checker.check();

      expect(result.dependencies).toContainEqual(
        expect.objectContaining({
          package: 'antd',
          issue: expect.stringContaining('ref handling')
        })
      );
    });

    test('should detect incompatible react-is', async () => {
      const packageJson = {
        dependencies: {
          react: '^19.0.0',
          'react-is': '^18.0.0'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checker.check();

      expect(result.dependencies).toContainEqual(
        expect.objectContaining({
          package: 'react-is'
        })
      );
    });
  });

  describe('Fix suggestions', () => {
    test('should generate fix commands for incompatible packages', async () => {
      const packageJson = {
        dependencies: {
          react: '^19.0.0',
          'react-is': '^18.0.0',
          antd: '^5.0.0'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checker.check();

      expect(result.fixes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'update',
            command: expect.stringContaining('npm install')
          })
        ])
      );
    });

    test('should suggest .npmrc creation', async () => {
      const packageJson = {
        dependencies: {
          react: '^19.0.0',
          'next-auth': '^4.24.0'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checker.check();

      expect(result.fixes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'config',
            file: '.npmrc'
          })
        ])
      );
    });

    test('should suggest package.json overrides', async () => {
      const packageJson = {
        dependencies: {
          react: '^19.0.0',
          recharts: '^2.5.0'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checker.check();

      expect(result.fixes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'override',
            file: 'package.json'
          })
        ])
      );
    });
  });

  describe('Automatic fix application', () => {
    test('should create .npmrc file when applying fixes', async () => {
      const packageJson = {
        dependencies: {
          react: '^19.0.0',
          'next-auth': '^4.24.0'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checker.check();
      await checker.applyFixes(result.fixes);

      const npmrcPath = path.join(testDir, '.npmrc');
      const exists = await fs.access(npmrcPath).then(() => true).catch(() => false);
      
      expect(exists).toBe(true);
      
      const npmrcContent = await fs.readFile(npmrcPath, 'utf8');
      expect(npmrcContent).toContain('legacy-peer-deps=true');
    });

    test('should add overrides to package.json when applying fixes', async () => {
      const packageJson = {
        dependencies: {
          react: '^19.0.0',
          recharts: '^2.5.0'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checker.check();
      await checker.applyFixes(result.fixes);

      const updatedPackageJson = JSON.parse(
        await fs.readFile(path.join(testDir, 'package.json'), 'utf8')
      );

      expect(updatedPackageJson.overrides).toBeDefined();
      expect(updatedPackageJson.overrides['react-is']).toBe('^19.0.0');
    });
  });

  describe('Version comparison', () => {
    test('should correctly compare semantic versions', () => {
      expect(checker.compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
      expect(checker.compareVersions('2.0.0', '1.0.0')).toBeGreaterThan(0);
      expect(checker.compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(checker.compareVersions('1.2.3', '1.2.4')).toBeLessThan(0);
    });
  });
});
