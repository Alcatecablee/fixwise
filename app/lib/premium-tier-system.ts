/**
 * Premium Tier System for NeuroLint Pro
 * Implements comprehensive premium features and tier management
 */

interface TierLimits {
  maxFileSize: number;
  maxAnalysesPerDay: number;
  maxFixesPerDay: number;
  featuresIncluded: string[];
  collaborationSessions: number;
  apiRequestsPerHour: number;
  storageGB: number;
}

interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  availableIn: string[];
  enabled: boolean;
}

interface TierUpgrade {
  fromTier: string;
  toTier: string;
  price: number;
  features: string[];
  benefits: string[];
}

export class PremiumTierSystem {
  private static readonly TIER_LIMITS: Record<string, TierLimits> = {
    free: {
      maxFileSize: 50 * 1024, // 50KB
      maxAnalysesPerDay: 5,
      maxFixesPerDay: 2,
      featuresIncluded: [
        'basic-analysis',
        'limited-reports'
      ],
      collaborationSessions: 0,
      apiRequestsPerHour: 10,
      storageGB: 0.1
    },
    basic: {
      maxFileSize: 500 * 1024, // 500KB
      maxAnalysesPerDay: 50,
      maxFixesPerDay: 25,
      featuresIncluded: [
        'basic-analysis',
        'fix-application',
        'detailed-reports',
        'api-access',
        'email-support'
      ],
      collaborationSessions: 2,
      apiRequestsPerHour: 100,
      storageGB: 1
    },
    professional: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxAnalysesPerDay: 500,
      maxFixesPerDay: 250,
      featuresIncluded: [
        'basic-analysis',
        'fix-application',
        'detailed-reports',
        'api-access',
        'priority-support',
        'collaboration',
        'custom-rules',
        'batch-processing',
        'webhook-integrations'
      ],
      collaborationSessions: 10,
      apiRequestsPerHour: 1000,
      storageGB: 10
    },
    enterprise: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxAnalysesPerDay: -1, // Unlimited
      maxFixesPerDay: -1, // Unlimited
      featuresIncluded: [
        'basic-analysis',
        'fix-application',
        'detailed-reports',
        'api-access',
        'dedicated-support',
        'unlimited-collaboration',
        'custom-rules',
        'batch-processing',
        'webhook-integrations',
        'on-premise-deployment',
        'custom-integrations',
        'sla-guarantee',
        'white-label',
        'advanced-analytics'
      ],
      collaborationSessions: -1, // Unlimited
      apiRequestsPerHour: -1, // Unlimited
      storageGB: 100
    }
  };

  private static readonly PREMIUM_FEATURES: PremiumFeature[] = [
    {
      id: 'fix-application',
      name: 'Automatic Fix Application',
      description: 'Automatically apply fixes to your codebase',
      availableIn: ['basic', 'professional', 'enterprise'],
      enabled: true
    },
    {
      id: 'detailed-reports',
      name: 'Detailed Analysis Reports',
      description: 'Comprehensive reports with actionable insights',
      availableIn: ['basic', 'professional', 'enterprise'],
      enabled: true
    },
    {
      id: 'api-access',
      name: 'API Access',
      description: 'Programmatic access to NeuroLint capabilities',
      availableIn: ['basic', 'professional', 'enterprise'],
      enabled: true
    },
    {
      id: 'collaboration',
      name: 'Real-time Collaboration',
      description: 'Collaborate with team members in real-time',
      availableIn: ['professional', 'enterprise'],
      enabled: true
    },
    {
      id: 'custom-rules',
      name: 'Custom Rules Engine',
      description: 'Create and apply custom analysis rules',
      availableIn: ['professional', 'enterprise'],
      enabled: true
    },
    {
      id: 'batch-processing',
      name: 'Batch Processing',
      description: 'Process multiple files simultaneously',
      availableIn: ['professional', 'enterprise'],
      enabled: true
    },
    {
      id: 'webhook-integrations',
      name: 'Webhook Integrations',
      description: 'Integrate with your existing tools and workflows',
      availableIn: ['professional', 'enterprise'],
      enabled: true
    },
    {
      id: 'on-premise-deployment',
      name: 'On-Premise Deployment',
      description: 'Deploy NeuroLint in your own infrastructure',
      availableIn: ['enterprise'],
      enabled: true
    },
    {
      id: 'custom-integrations',
      name: 'Custom Integrations',
      description: 'Build custom integrations for your specific needs',
      availableIn: ['enterprise'],
      enabled: true
    },
    {
      id: 'sla-guarantee',
      name: 'SLA Guarantee',
      description: 'Service level agreement with guaranteed uptime',
      availableIn: ['enterprise'],
      enabled: true
    },
    {
      id: 'white-label',
      name: 'White Label Solution',
      description: 'Rebrand NeuroLint as your own product',
      availableIn: ['enterprise'],
      enabled: true
    },
    {
      id: 'advanced-analytics',
      name: 'Advanced Analytics',
      description: 'Deep insights into code quality trends',
      availableIn: ['enterprise'],
      enabled: true
    }
  ];

  private static readonly TIER_UPGRADES: TierUpgrade[] = [
    {
      fromTier: 'free',
      toTier: 'basic',
      price: 29,
      features: [
        'Automatic Fix Application',
        'Detailed Reports',
        'API Access',
        'Email Support'
      ],
      benefits: [
        '10x more analyses per day',
        'Apply fixes automatically',
        'Get detailed insights',
        'Integrate with your tools'
      ]
    },
    {
      fromTier: 'basic',
      toTier: 'professional',
      price: 99,
      features: [
        'Real-time Collaboration',
        'Custom Rules Engine',
        'Batch Processing',
        'Webhook Integrations',
        'Priority Support'
      ],
      benefits: [
        'Collaborate with your team',
        'Create custom analysis rules',
        'Process multiple files at once',
        'Integrate with your workflow',
        'Get priority support'
      ]
    },
    {
      fromTier: 'professional',
      toTier: 'enterprise',
      price: 299,
      features: [
        'On-Premise Deployment',
        'Custom Integrations',
        'SLA Guarantee',
        'White Label Solution',
        'Advanced Analytics',
        'Dedicated Support'
      ],
      benefits: [
        'Deploy in your infrastructure',
        'Build custom integrations',
        'Guaranteed uptime',
        'Rebrand as your own',
        'Advanced insights',
        'Dedicated support team'
      ]
    }
  ];

  /**
   * Get tier limits for a specific tier
   */
  static getTierLimits(tier: string): TierLimits {
    return this.TIER_LIMITS[tier] || this.TIER_LIMITS.free;
  }

  /**
   * Check if a feature is available in a tier
   */
  static isFeatureAvailable(featureId: string, tier: string): boolean {
    const feature = this.PREMIUM_FEATURES.find(f => f.id === featureId);
    if (!feature) return false;
    return feature.availableIn.includes(tier) && feature.enabled;
  }

  /**
   * Get all features available in a tier
   */
  static getAvailableFeatures(tier: string): PremiumFeature[] {
    return this.PREMIUM_FEATURES.filter(feature => 
      feature.availableIn.includes(tier) && feature.enabled
    );
  }

  /**
   * Get upgrade options for a tier
   */
  static getUpgradeOptions(currentTier: string): TierUpgrade[] {
    return this.TIER_UPGRADES.filter(upgrade => upgrade.fromTier === currentTier);
  }

  /**
   * Check if user can perform an action based on tier limits
   */
  static canPerformAction(
    action: 'analyze' | 'fix' | 'collaborate' | 'api-request',
    tier: string,
    currentUsage: {
      analysesToday?: number;
      fixesToday?: number;
      apiRequestsThisHour?: number;
      collaborationSessions?: number;
    } = {}
  ): { allowed: boolean; reason?: string; limit?: number } {
    const limits = this.getTierLimits(tier);

    switch (action) {
      case 'analyze':
        if (limits.maxAnalysesPerDay === -1) return { allowed: true };
        if ((currentUsage.analysesToday || 0) >= limits.maxAnalysesPerDay) {
          return { 
            allowed: false, 
            reason: 'Daily analysis limit reached',
            limit: limits.maxAnalysesPerDay
          };
        }
        return { allowed: true };

      case 'fix':
        if (limits.maxFixesPerDay === -1) return { allowed: true };
        if ((currentUsage.fixesToday || 0) >= limits.maxFixesPerDay) {
          return { 
            allowed: false, 
            reason: 'Daily fix limit reached',
            limit: limits.maxFixesPerDay
          };
        }
        return { allowed: true };

      case 'collaborate':
        if (limits.collaborationSessions === -1) return { allowed: true };
        if ((currentUsage.collaborationSessions || 0) >= limits.collaborationSessions) {
          return { 
            allowed: false, 
            reason: 'Collaboration session limit reached',
            limit: limits.collaborationSessions
          };
        }
        return { allowed: true };

      case 'api-request':
        if (limits.apiRequestsPerHour === -1) return { allowed: true };
        if ((currentUsage.apiRequestsThisHour || 0) >= limits.apiRequestsPerHour) {
          return { 
            allowed: false, 
            reason: 'Hourly API request limit reached',
            limit: limits.apiRequestsPerHour
          };
        }
        return { allowed: true };

      default:
        return { allowed: false, reason: 'Unknown action' };
    }
  }

  /**
   * Get premium features comparison
   */
  static getFeatureComparison(): Record<string, Record<string, boolean>> {
    const tiers = Object.keys(this.TIER_LIMITS);
    const features = this.PREMIUM_FEATURES;
    
    const comparison: Record<string, Record<string, boolean>> = {};
    
    for (const tier of tiers) {
      comparison[tier] = {};
      for (const feature of features) {
        comparison[tier][feature.id] = this.isFeatureAvailable(feature.id, tier);
      }
    }
    
    return comparison;
  }

  /**
   * Get tier recommendations based on usage
   */
  static getTierRecommendations(usage: {
    analysesPerDay: number;
    fixesPerDay: number;
    fileSize: number;
    collaborationNeeded: boolean;
    apiUsage: number;
  }): string[] {
    const recommendations: string[] = [];
    const limits = this.getTierLimits('free');

    if (usage.analysesPerDay > limits.maxAnalysesPerDay) {
      recommendations.push('Upgrade to Basic for more daily analyses');
    }

    if (usage.fixesPerDay > limits.maxFixesPerDay) {
      recommendations.push('Upgrade to Basic for automatic fix application');
    }

    if (usage.fileSize > limits.maxFileSize) {
      recommendations.push('Upgrade to Professional for larger file support');
    }

    if (usage.collaborationNeeded) {
      recommendations.push('Upgrade to Professional for real-time collaboration');
    }

    if (usage.apiUsage > limits.apiRequestsPerHour) {
      recommendations.push('Upgrade to Professional for higher API limits');
    }

    return recommendations;
  }

  /**
   * Calculate tier pricing
   */
  static getTierPricing(): Record<string, { monthly: number; yearly: number; features: string[] }> {
    return {
      free: {
        monthly: 0,
        yearly: 0,
        features: this.getAvailableFeatures('free').map(f => f.name)
      },
      basic: {
        monthly: 29,
        yearly: 290, // 2 months free
        features: this.getAvailableFeatures('basic').map(f => f.name)
      },
      professional: {
        monthly: 99,
        yearly: 990, // 2 months free
        features: this.getAvailableFeatures('professional').map(f => f.name)
      },
      enterprise: {
        monthly: 299,
        yearly: 2990, // 2 months free
        features: this.getAvailableFeatures('enterprise').map(f => f.name)
      }
    };
  }
} 