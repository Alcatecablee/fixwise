/**
 * NeuroLint Pro - Enterprise Migration Tier System
 * 
 * This module defines the proper tier system for one-time migration services,
 * replacing the previous architecture flaw where migration bypassed the established tier system.
 * 
 * CRITICAL: This integrates properly with the existing freemium model
 */

export interface MigrationTierConfig {
  unlimited: boolean;
  layers: number[];
  duration: number; // in milliseconds
  supportLevel: 'standard' | 'priority';
  features: string[];
  maxFileSize: number;
  maxFiles: number;
}

export interface MigrationAccess {
  hasAccess: boolean;
  tier: string;
  config?: MigrationTierConfig;
  reason?: string;
  upgradeUrl?: string;
}

/**
 * Enterprise tier configurations for migration services
 * These tiers extend the existing system without bypassing it
 */
export const MIGRATION_TIERS: Record<string, MigrationTierConfig> = {
  // One-time migration service (quote-based $999-$9,999)
  migration: {
    unlimited: true,
    layers: [1, 2, 3, 4, 5, 6, 7], // All layers enabled
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days
    supportLevel: 'priority',
    features: [
      'unlimited_fixes',
      'all_layers',
      'full_codebase_migration', 
      'detailed_migration_report',
      'rollback_safety_suite',
      'priority_support',
      'custom_rules'
    ],
    maxFileSize: 50 * 1024 * 1024, // 50MB per file
    maxFiles: 10000 // Up to 10k files
  },
  
  // Enterprise tier (regular subscription)
  enterprise: {
    unlimited: true,
    layers: [1, 2, 3, 4, 5, 6, 7],
    duration: Infinity, // Unlimited as long as subscription is active
    supportLevel: 'priority',
    features: [
      'unlimited_fixes',
      'all_layers',
      'custom_rules',
      'priority_support',
      'advanced_analytics'
    ],
    maxFileSize: 10 * 1024 * 1024, // 10MB per file
    maxFiles: 1000
  },
  
  // Premium tier (high-end subscription)
  premium: {
    unlimited: false,
    layers: [1, 2, 3, 4, 5, 6, 7],
    duration: Infinity,
    supportLevel: 'standard',
    features: [
      'unlimited_fixes',
      'all_layers',
      'white_glove_support'
    ],
    maxFileSize: 5 * 1024 * 1024, // 5MB per file  
    maxFiles: 500
  }
};

/**
 * Check if user has access to migration services
 * This replaces the previous bypass flag system
 */
export function checkMigrationAccess(
  userTier: string, 
  migrationQuoteApproved?: boolean,
  migrationExpiresAt?: Date
): MigrationAccess {
  
  // Check for active migration service (quote-based)
  if (migrationQuoteApproved && migrationExpiresAt) {
    const now = new Date();
    if (now <= migrationExpiresAt) {
      return {
        hasAccess: true,
        tier: 'migration',
        config: MIGRATION_TIERS.migration
      };
    } else {
      return {
        hasAccess: false,
        tier: userTier,
        reason: 'Migration service access has expired',
        upgradeUrl: 'https://app.neurolint.dev/migration-request'
      };
    }
  }
  
  // Check regular tier access
  if (userTier === 'enterprise') {
    return {
      hasAccess: true,
      tier: 'enterprise',
      config: MIGRATION_TIERS.enterprise
    };
  }
  
  if (userTier === 'premium') {
    return {
      hasAccess: true,
      tier: 'premium', 
      config: MIGRATION_TIERS.premium
    };
  }
  
  // Free and other tiers don't have migration access
  return {
    hasAccess: false,
    tier: userTier,
    reason: 'Migration service requires enterprise access or approved quote',
    upgradeUrl: 'https://app.neurolint.dev/migration-request'
  };
}

/**
 * Validate migration request against tier limits
 */
export function validateMigrationRequest(
  migrationConfig: MigrationTierConfig,
  fileCount: number,
  totalFileSize: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (fileCount > migrationConfig.maxFiles) {
    errors.push(`File count (${fileCount}) exceeds limit (${migrationConfig.maxFiles})`);
  }
  
  if (totalFileSize > migrationConfig.maxFileSize * fileCount) {
    errors.push(`Total file size exceeds limits`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if specific features are available for a migration tier
 */
export function hasMigrationFeature(tierConfig: MigrationTierConfig, feature: string): boolean {
  return tierConfig.features.includes(feature);
}

/**
 * Get usage limits for a migration tier
 */
export function getMigrationLimits(tierConfig: MigrationTierConfig) {
  return {
    unlimited: tierConfig.unlimited,
    maxLayers: tierConfig.layers.length,
    availableLayers: tierConfig.layers,
    supportLevel: tierConfig.supportLevel,
    maxFileSize: tierConfig.maxFileSize,
    maxFiles: tierConfig.maxFiles,
    duration: tierConfig.duration
  };
}

/**
 * Generate migration tier info for API responses
 */
export function getMigrationTierInfo(tierName: string, config: MigrationTierConfig) {
  return {
    tier: tierName,
    limits: getMigrationLimits(config),
    features: config.features,
    supportLevel: config.supportLevel
  };
}
