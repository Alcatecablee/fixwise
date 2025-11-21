const TurbopackMigrationAssistant = require('../scripts/turbopack-migration-assistant.js');
const fs = require('fs').promises;
const path = require('path');

describe('Turbopack Migration Assistant', () => {
  let assistant;
  let testDir;

  beforeEach(async () => {
    testDir = path.join(__dirname, 'fixtures', 'turbopack-test');
    await fs.mkdir(testDir, { recursive: true });
    assistant = new TurbopackMigrationAssistant({ verbose: false, projectPath: testDir });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Webpack configuration detection', () => {
    test('should detect custom webpack config in next.config.js', async () => {
      const configContent = `
module.exports = {
  webpack: (config) => {
    config.plugins.push(new SomePlugin());
    return config;
  }
};
`;

      await fs.writeFile(path.join(testDir, 'next.config.js'), configContent);

      const result = await assistant.analyze();

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'high',
          issue: expect.stringContaining('webpack configuration')
        })
      );
    });

    test('should detect webpack plugins', async () => {
      const configContent = `
const webpack = require('webpack');

module.exports = {
  webpack: (config) => {
    config.plugins.push(new webpack.DefinePlugin({ TEST: true }));
    return config;
  }
};
`;

      await fs.writeFile(path.join(testDir, 'next.config.js'), configContent);

      const result = await assistant.analyze();

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          issue: expect.stringContaining('Webpack plugins')
        })
      );
    });

    test('should detect standalone webpack.config.js', async () => {
      await fs.writeFile(
        path.join(testDir, 'webpack.config.js'),
        'module.exports = {};'
      );

      const result = await assistant.analyze();

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          file: 'webpack.config.js',
          severity: 'high'
        })
      );
    });
  });

  describe('Babel configuration detection', () => {
    test('should detect .babelrc file', async () => {
      await fs.writeFile(
        path.join(testDir, '.babelrc'),
        JSON.stringify({ presets: ['next/babel'] })
      );

      const result = await assistant.analyze();

      expect(result.suggestions).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Babel configuration')
        })
      );
    });

    test('should suggest SWC migration when Babel is found', async () => {
      await fs.writeFile(
        path.join(testDir, 'babel.config.js'),
        'module.exports = { presets: ["next/babel"] };'
      );

      const result = await assistant.analyze();

      expect(result.suggestions).toContainEqual(
        expect.objectContaining({
          recommendation: expect.stringContaining('SWC')
        })
      );
    });

    test('should approve no Babel config', async () => {
      const result = await assistant.analyze();

      expect(result.suggestions).toContainEqual(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('No Babel')
        })
      );
    });
  });

  describe('Webpack loaders detection', () => {
    test('should detect webpack loaders in dependencies', async () => {
      const packageJson = {
        devDependencies: {
          'css-loader': '^6.0.0',
          'style-loader': '^3.0.0',
          'sass-loader': '^13.0.0'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await assistant.analyze();

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          issue: expect.stringContaining('loaders detected')
        })
      );
    });
  });

  describe('Webpack plugins in dependencies', () => {
    test('should detect webpack plugins in package.json', async () => {
      const packageJson = {
        devDependencies: {
          'html-webpack-plugin': '^5.0.0',
          'mini-css-extract-plugin': '^2.0.0'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await assistant.analyze();

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          issue: expect.stringContaining('plugins detected')
        })
      );
    });
  });

  describe('Turbopack optimization suggestions', () => {
    test('should suggest filesystem caching if not present', async () => {
      const configContent = `
module.exports = {
  reactStrictMode: true
};
`;

      await fs.writeFile(path.join(testDir, 'next.config.js'), configContent);

      const result = await assistant.analyze();

      expect(result.suggestions).toContainEqual(
        expect.objectContaining({
          type: 'optimization',
          message: expect.stringContaining('filesystem caching')
        })
      );
    });
  });

  describe('Compatibility assessment', () => {
    test('should mark project as compatible when no issues found', async () => {
      // Empty project - no webpack customization
      const configContent = `
module.exports = {
  reactStrictMode: true
};
`;

      await fs.writeFile(path.join(testDir, 'next.config.js'), configContent);
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify({ dependencies: {} })
      );

      const result = await assistant.analyze();

      expect(result.compatible).toBe(true);
    });

    test('should mark project as incompatible with high severity issues', async () => {
      const configContent = `
module.exports = {
  webpack: (config) => {
    return config;
  }
};
`;

      await fs.writeFile(path.join(testDir, 'next.config.js'), configContent);

      const result = await assistant.analyze();

      expect(result.compatible).toBe(false);
    });
  });

  describe('Migration recommendations', () => {
    test('should recommend keeping Webpack when critical issues exist', async () => {
      await fs.writeFile(
        path.join(testDir, 'webpack.config.js'),
        'module.exports = {};'
      );

      const result = await assistant.analyze();

      expect(result.suggestions).toContainEqual(
        expect.objectContaining({
          type: 'critical',
          recommendation: expect.stringContaining('--webpack')
        })
      );
    });

    test('should recommend Turbopack when project is ready', async () => {
      await fs.writeFile(
        path.join(testDir, 'next.config.js'),
        'module.exports = {};'
      );

      const result = await assistant.analyze();

      expect(result.suggestions).toContainEqual(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('Turbopack-ready')
        })
      );
    });
  });
});
