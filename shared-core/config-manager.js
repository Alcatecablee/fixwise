const fs = require('fs').promises;
const path = require('path');

/**
 * Unified Configuration Manager for NeuroLint
 * 
 * Handles configuration across CLI, VS Code, and Web App platforms
 * with support for project-specific, team, and global settings.
 */

class ConfigManager {
  constructor() {
    this.config = {
      enabledLayers: [1, 2, 3, 4, 5, 6, 7],
      include: ['**/*.{ts,tsx,js,jsx,json}'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
      verbose: false,
      backup: true,
      format: 'console',
      apiUrl: 'https://app.neurolint.dev/api',
      timeout: 30000,
      teamPrefs: {
        syncRules: true,
        sharedHistory: true
      }
    };
    
    this.configPath = '.neurolintrc';
    this.globalConfigPath = this.getGlobalConfigPath();
  }

  /**
   * Get global configuration path
   */
  getGlobalConfigPath() {
    const home = process.env.HOME || process.env.USERPROFILE;
    return path.join(home, '.neurolintrc');
  }

  /**
   * Load configuration from file
   */
  async loadConfig(configPath = null) {
    const paths = [
      configPath,
      path.join(process.cwd(), this.configPath),
      this.globalConfigPath
    ].filter(Boolean);

    for (const configFile of paths) {
      try {
        const data = await fs.readFile(configFile, 'utf8');
        const fileConfig = JSON.parse(data);
        this.config = { ...this.config, ...fileConfig };
        return this.config;
      } catch (error) {
        // Continue to next config file
        continue;
      }
    }

    return this.config;
  }

  /**
   * Save configuration to file
   */
  async saveConfig(config = null, configPath = null) {
    const configToSave = config || this.config;
    const savePath = configPath || path.join(process.cwd(), this.configPath);

    try {
      await fs.writeFile(savePath, JSON.stringify(configToSave, null, 2));
      return true;
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error.message}`);
    }
  }

  /**
   * Get configuration value
   */
  get(key, defaultValue = null) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  /**
   * Set configuration value
   */
  set(key, value) {
    this.config[key] = value;
  }

  /**
   * Get enabled layers for analysis
   */
  getEnabledLayers() {
    return this.config.enabledLayers || [1, 2, 3, 4, 5, 6, 7];
  }

  /**
   * Check if layer is enabled
   */
  isLayerEnabled(layerId) {
    return this.config.enabledLayers.includes(layerId);
  }

  /**
   * Get file patterns to include
   */
  getIncludePatterns() {
    return this.config.include || ['**/*.{ts,tsx,js,jsx,json}'];
  }

  /**
   * Get file patterns to exclude
   */
  getExcludePatterns() {
    return this.config.exclude || ['**/node_modules/**', '**/dist/**', '**/.next/**'];
  }

  /**
   * Get team preferences
   */
  getTeamPrefs() {
    return this.config.teamPrefs || {
      syncRules: true,
      sharedHistory: true
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(config = null) {
    const configToValidate = config || this.config;
    const errors = [];

    // Validate enabled layers
    if (!Array.isArray(configToValidate.enabledLayers)) {
      errors.push('enabledLayers must be an array');
    } else {
      for (const layer of configToValidate.enabledLayers) {
        if (typeof layer !== 'number' || layer < 1 || layer > 6) {
          errors.push(`Invalid layer ID: ${layer}`);
        }
      }
    }

    // Validate include patterns
    if (!Array.isArray(configToValidate.include)) {
      errors.push('include must be an array');
    }

    // Validate exclude patterns
    if (!Array.isArray(configToValidate.exclude)) {
      errors.push('exclude must be an array');
    }

    // Validate timeout
    if (configToValidate.timeout && typeof configToValidate.timeout !== 'number') {
      errors.push('timeout must be a number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get configuration for specific platform
   */
  getPlatformConfig(platform) {
    const baseConfig = { ...this.config };
    
    switch (platform) {
      case 'cli':
        return {
          ...baseConfig,
          format: baseConfig.format || 'console'
        };
      
      case 'vscode':
        return {
          ...baseConfig,
          format: 'diagnostics',
          realTime: true
        };
      
      case 'web':
        return {
          ...baseConfig,
          format: 'json',
          apiEnabled: true
        };
      
      default:
        return baseConfig;
    }
  }

  /**
   * Merge configurations from multiple sources
   */
  mergeConfigs(configs) {
    return configs.reduce((merged, config) => {
      return { ...merged, ...config };
    }, {});
  }

  /**
   * Get configuration schema for validation
   */
  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        enabledLayers: {
          type: 'array',
          items: { type: 'number', minimum: 1, maximum: 6 },
          description: 'Array of layer IDs to enable'
        },
        include: {
          type: 'array',
          items: { type: 'string' },
          description: 'File patterns to include'
        },
        exclude: {
          type: 'array',
          items: { type: 'string' },
          description: 'File patterns to exclude'
        },
        verbose: {
          type: 'boolean',
          description: 'Enable detailed output'
        },
        backup: {
          type: 'boolean',
          description: 'Create backups before applying fixes'
        },
        format: {
          type: 'string',
          enum: ['console', 'json', 'html'],
          description: 'Output format'
        },
        apiUrl: {
          type: 'string',
          description: 'API endpoint URL'
        },
        timeout: {
          type: 'number',
          minimum: 1000,
          maximum: 300000,
          description: 'Request timeout in milliseconds'
        },
        teamPrefs: {
          type: 'object',
          properties: {
            syncRules: { type: 'boolean' },
            sharedHistory: { type: 'boolean' }
          }
        }
      }
    };
  }

  /**
   * Create default configuration
   */
  createDefaultConfig() {
    return {
      enabledLayers: [1, 2, 3, 4, 5, 6],
      include: ['**/*.{ts,tsx,js,jsx,json}'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
      verbose: false,
      backup: true,
      format: 'console',
      apiUrl: 'https://app.neurolint.dev/api',
      timeout: 30000,
      teamPrefs: {
        syncRules: true,
        sharedHistory: true
      }
    };
  }

  /**
   * Export configuration for sharing
   */
  exportConfig() {
    return {
      version: '1.2.1',
      timestamp: new Date().toISOString(),
      config: this.config
    };
  }

  /**
   * Import configuration from external source
   */
  async importConfig(configData) {
    if (typeof configData === 'string') {
      configData = JSON.parse(configData);
    }

    if (configData.config) {
      this.config = { ...this.config, ...configData.config };
    } else {
      this.config = { ...this.config, ...configData };
    }

    // Validate imported configuration
    const validation = this.validateConfig();
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    return this.config;
  }
}

// Create and export singleton instance
const configManager = new ConfigManager();

module.exports = configManager; 