import { supabase } from "./supabase-client";
import { dataStore } from "./data-store";
import crypto from 'crypto';

interface MigrationResult {
  success: boolean;
  migrated: number;
  errors: string[];
  table: string;
}

interface MigrationSummary {
  totalMigrated: number;
  totalErrors: number;
  results: MigrationResult[];
  duration: number;
}

export class DatabaseMigration {
  private startTime: number = 0;
  private errors: string[] = [];

  async migrateAll(): Promise<MigrationSummary> {
    this.startTime = Date.now();
    this.errors = [];
    
    console.log("[MIGRATION] Starting full database migration from in-memory to Supabase");
    
    const results: MigrationResult[] = [];
    
    // Migrate in order of dependencies
    const migrations = [
      { name: 'profiles', fn: () => this.migrateProfiles() },
      { name: 'user_settings', fn: () => this.migrateUserSettings() },
      { name: 'projects', fn: () => this.migrateProjects() },
      { name: 'project_files', fn: () => this.migrateProjectFiles() },
      { name: 'project_analyses', fn: () => this.migrateProjectAnalyses() },
      { name: 'analysis_history', fn: () => this.migrateAnalysisHistory() },
      { name: 'api_keys', fn: () => this.migrateApiKeys() },
      { name: 'teams', fn: () => this.migrateTeams() },
      { name: 'team_members', fn: () => this.migrateTeamMembers() },
      { name: 'team_invitations', fn: () => this.migrateTeamInvitations() },
      { name: 'project_subscriptions', fn: () => this.migrateProjectSubscriptions() },
      { name: 'project_usage', fn: () => this.migrateProjectUsage() },
      { name: 'fix_history', fn: () => this.migrateFixHistory() },
      { name: 'billing_cycles', fn: () => this.migrateBillingCycles() },
      { name: 'webhooks', fn: () => this.migrateWebhooks() },
      { name: 'webhook_events', fn: () => this.migrateWebhookEvents() },
      { name: 'integrations', fn: () => this.migrateIntegrations() },
      { name: 'integration_runs', fn: () => this.migrateIntegrationRuns() },
      { name: 'collaboration_sessions', fn: () => this.migrateCollaborationSessions() },
      { name: 'collaboration_participants', fn: () => this.migrateCollaborationParticipants() },
      { name: 'collaboration_comments', fn: () => this.migrateCollaborationComments() },
      { name: 'collaboration_presence', fn: () => this.migrateCollaborationPresence() },
      { name: 'collaboration_activity', fn: () => this.migrateCollaborationActivity() },
      { name: 'dashboard_sessions', fn: () => this.migrateDashboardSessions() },
    ];

    for (const migration of migrations) {
      try {
        console.log(`[MIGRATION] Migrating ${migration.name}...`);
        const result = await migration.fn();
        results.push(result);
        
        if (result.success) {
          console.log(`[MIGRATION] ✓ ${migration.name}: ${result.migrated} records migrated`);
        } else {
          console.error(`[MIGRATION] ✗ ${migration.name}: ${result.errors.length} errors`);
        }
      } catch (error) {
        const errorMsg = `Failed to migrate ${migration.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[MIGRATION] ✗ ${errorMsg}`);
        results.push({
          success: false,
          migrated: 0,
          errors: [errorMsg],
          table: migration.name
        });
      }
    }

    const summary: MigrationSummary = {
      totalMigrated: results.reduce((sum, r) => sum + r.migrated, 0),
      totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
      results,
      duration: Date.now() - this.startTime
    };

    console.log(`[MIGRATION] Migration completed in ${summary.duration}ms`);
    console.log(`[MIGRATION] Total migrated: ${summary.totalMigrated} records`);
    console.log(`[MIGRATION] Total errors: ${summary.totalErrors}`);

    return summary;
  }

  private async migrateProfiles(): Promise<MigrationResult> {
    // Profiles are created automatically by Supabase auth triggers
    // This is a placeholder for any profile-specific data migration
    return {
      success: true,
      migrated: 0,
      errors: [],
      table: 'profiles'
    };
  }

  private async migrateUserSettings(): Promise<MigrationResult> {
    // User settings are created automatically by triggers
    // This is a placeholder for any settings-specific data migration
    return {
      success: true,
      migrated: 0,
      errors: [],
      table: 'user_settings'
    };
  }

  private async migrateProjects(): Promise<MigrationResult> {
    const errors: string[] = [];
    let migrated = 0;

    try {
      const projects = Array.from(dataStore.projects.values());
      
      if (projects.length === 0) {
        return { success: true, migrated: 0, errors: [], table: 'projects' };
      }

      for (const project of projects as any[]) {
        try {
          const { error } = await supabase
            .from('projects')
            .insert({
              id: project.id,
              user_id: project.userId,
              name: project.name,
              description: project.description,
              files: project.files || [],
              stats: project.stats || {},
              created_at: project.createdAt,
              updated_at: project.updatedAt,
              last_analyzed: project.lastAnalyzed
            });

          if (error) {
            errors.push(`Project ${project.id}: ${error.message}`);
          } else {
            migrated++;
          }
        } catch (err) {
          errors.push(`Project ${project.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        migrated,
        errors,
        table: 'projects'
      };
    } catch (error) {
      return {
        success: false,
        migrated: 0,
        errors: [`Failed to migrate projects: ${error instanceof Error ? error.message : 'Unknown error'}`],
        table: 'projects'
      };
    }
  }

  private async migrateProjectFiles(): Promise<MigrationResult> {
    const errors: string[] = [];
    let migrated = 0;

    try {
      const files = Array.from(dataStore.projectFiles.values());
      
      if (files.length === 0) {
        return { success: true, migrated: 0, errors: [], table: 'project_files' };
      }

      for (const file of files as any[]) {
        try {
          const { error } = await supabase
            .from('project_files')
            .insert({
              id: file.id,
              project_id: file.projectId,
              filename: file.filename,
              content: file.content,
              file_type: file.fileType,
              size_bytes: file.sizeBytes,
              last_analyzed: file.lastAnalyzed,
              analysis_result: file.analysisResult,
              created_at: file.createdAt,
              updated_at: file.updatedAt
            });

          if (error) {
            errors.push(`Project file ${file.id}: ${error.message}`);
          } else {
            migrated++;
          }
        } catch (err) {
          errors.push(`Project file ${file.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        migrated,
        errors,
        table: 'project_files'
      };
    } catch (error) {
      return {
        success: false,
        migrated: 0,
        errors: [`Failed to migrate project files: ${error instanceof Error ? error.message : 'Unknown error'}`],
        table: 'project_files'
      };
    }
  }

  private async migrateProjectAnalyses(): Promise<MigrationResult> {
    const errors: string[] = [];
    let migrated = 0;

    try {
      // Flatten all project analyses from the map
      const allAnalyses: any[] = [];
      for (const [projectId, analyses] of dataStore.projectAnalyses.entries()) {
        analyses.forEach((analysis: any) => {
          allAnalyses.push({
            ...analysis,
            project_id: projectId
          });
        });
      }
      
      if (allAnalyses.length === 0) {
        return { success: true, migrated: 0, errors: [], table: 'project_analyses' };
      }

      for (const analysis of allAnalyses as any[]) {
        try {
          const { error } = await supabase
            .from('project_analyses')
            .insert({
              id: analysis.id,
              project_id: analysis.project_id,
              filename: analysis.filename,
              timestamp: analysis.timestamp,
              result: analysis.result,
              layers: analysis.layers || [],
              execution_time: analysis.executionTime || 0,
              user_id: analysis.userId,
              metadata: analysis.metadata || {}
            });

          if (error) {
            errors.push(`Project analysis ${analysis.id}: ${error.message}`);
          } else {
            migrated++;
          }
        } catch (err) {
          errors.push(`Project analysis ${analysis.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        migrated,
        errors,
        table: 'project_analyses'
      };
    } catch (error) {
      return {
        success: false,
        migrated: 0,
        errors: [`Failed to migrate project analyses: ${error instanceof Error ? error.message : 'Unknown error'}`],
        table: 'project_analyses'
      };
    }
  }

  private async migrateAnalysisHistory(): Promise<MigrationResult> {
    // Analysis history migration would be handled separately
    // as it may come from localStorage or other sources
    return {
      success: true,
      migrated: 0,
      errors: [],
      table: 'analysis_history'
    };
  }

  private async migrateApiKeys(): Promise<MigrationResult> {
    const errors: string[] = [];
    let migrated = 0;

    try {
      const apiKeys = Array.from(dataStore.apiKeys.values());
      
      if (apiKeys.length === 0) {
        return { success: true, migrated: 0, errors: [], table: 'api_keys' };
      }

      for (const apiKey of apiKeys as any[]) {
        try {
          const { error } = await supabase
            .from('api_keys')
            .insert({
              id: apiKey.id,
              user_id: apiKey.userId,
                            key_hash: crypto.createHash('sha256').update(apiKey.key).digest('hex'),
              key_preview: apiKey.key.substring(0, 8) + '...',
              name: apiKey.name || 'API Key',
              permissions: apiKey.permissions || ['analyze'],
              rate_limit: apiKey.rateLimit || { requestsPerHour: 100, requestsPerDay: 1000 },
              usage_count: apiKey.usageCount || 0,
              hourly_usage: apiKey.hourlyUsage || 0,
              daily_usage: apiKey.dailyUsage || 0,
              last_hour_reset: apiKey.lastHourReset ? new Date(apiKey.lastHourReset) : new Date(),
              last_day_reset: apiKey.lastDayReset ? new Date(apiKey.lastDayReset) : new Date(),
              last_used: apiKey.lastUsed ? new Date(apiKey.lastUsed) : null,
              expires_at: apiKey.expiresAt ? new Date(apiKey.expiresAt) : null,
              is_active: apiKey.isActive !== false,
              metadata: apiKey.metadata || {},
              created_at: apiKey.createdAt ? new Date(apiKey.createdAt) : new Date(),
              updated_at: new Date()
            });

          if (error) {
            errors.push(`API Key ${apiKey.id}: ${error.message}`);
          } else {
            migrated++;
          }
        } catch (err) {
          errors.push(`API Key ${apiKey.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        migrated,
        errors,
        table: 'api_keys'
      };
    } catch (error) {
      return {
        success: false,
        migrated: 0,
        errors: [`Failed to migrate API keys: ${error instanceof Error ? error.message : 'Unknown error'}`],
        table: 'api_keys'
      };
    }
  }

  // Placeholder methods for other tables
  private async migrateTeams(): Promise<MigrationResult> {
    return { success: true, migrated: 0, errors: [], table: 'teams' };
  }

  private async migrateTeamMembers(): Promise<MigrationResult> {
    return { success: true, migrated: 0, errors: [], table: 'team_members' };
  }

  private async migrateTeamInvitations(): Promise<MigrationResult> {
    return { success: true, migrated: 0, errors: [], table: 'team_invitations' };
  }

  private async migrateProjectSubscriptions(): Promise<MigrationResult> {
    const errors: string[] = [];
    let migrated = 0;

    try {
      const subscriptions = Array.from(dataStore.projectSubscriptions.values());
      
      if (subscriptions.length === 0) {
        return { success: true, migrated: 0, errors: [], table: 'project_subscriptions' };
      }

      for (const subscription of subscriptions as any[]) {
        try {
          const { error } = await supabase
            .from('project_subscriptions')
            .insert({
              id: subscription.id,
              project_id: subscription.projectId,
              user_id: subscription.userId,
              plan: subscription.plan,
              billing_period: subscription.billingPeriod || 'monthly',
              status: subscription.status || 'active',
              paypal_subscription_id: subscription.paypalSubscriptionId,
              next_billing_date: subscription.nextBillingDate ? new Date(subscription.nextBillingDate) : null,
              created_at: subscription.createdAt ? new Date(subscription.createdAt) : new Date(),
              updated_at: new Date()
            });

          if (error) {
            errors.push(`Project subscription ${subscription.id}: ${error.message}`);
          } else {
            migrated++;
          }
        } catch (err) {
          errors.push(`Project subscription ${subscription.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        migrated,
        errors,
        table: 'project_subscriptions'
      };
    } catch (error) {
      return {
        success: false,
        migrated: 0,
        errors: [`Failed to migrate project subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`],
        table: 'project_subscriptions'
      };
    }
  }

  private async migrateProjectUsage(): Promise<MigrationResult> {
    return { success: true, migrated: 0, errors: [], table: 'project_usage' };
  }

  private async migrateFixHistory(): Promise<MigrationResult> {
    return { success: true, migrated: 0, errors: [], table: 'fix_history' };
  }

  private async migrateBillingCycles(): Promise<MigrationResult> {
    return { success: true, migrated: 0, errors: [], table: 'billing_cycles' };
  }

  private async migrateWebhooks(): Promise<MigrationResult> {
    return { success: true, migrated: 0, errors: [], table: 'webhooks' };
  }

  private async migrateWebhookEvents(): Promise<MigrationResult> {
    return { success: true, migrated: 0, errors: [], table: 'webhook_events' };
  }

  private async migrateIntegrations(): Promise<MigrationResult> {
    return { success: true, migrated: 0, errors: [], table: 'integrations' };
  }

  private async migrateIntegrationRuns(): Promise<MigrationResult> {
    return { success: true, migrated: 0, errors: [], table: 'integration_runs' };
  }

  private async migrateCollaborationSessions(): Promise<MigrationResult> {
    return { success: true, migrated: 0, errors: [], table: 'collaboration_sessions' };
  }

  private async migrateCollaborationParticipants(): Promise<MigrationResult> {
    return { success: true, migrated: 0, errors: [], table: 'collaboration_participants' };
  }

  private async migrateCollaborationComments(): Promise<MigrationResult> {
    return { success: true, migrated: 0, errors: [], table: 'collaboration_comments' };
  }

  private async migrateCollaborationPresence(): Promise<MigrationResult> {
    return { success: true, migrated: 0, errors: [], table: 'collaboration_presence' };
  }

  private async migrateCollaborationActivity(): Promise<MigrationResult> {
    return { success: true, migrated: 0, errors: [], table: 'collaboration_activity' };
  }

  private async migrateDashboardSessions(): Promise<MigrationResult> {
    const errors: string[] = [];
    let migrated = 0;

    try {
      const sessions = Array.from(dataStore.dashboardSessions.entries());
      
      if (sessions.length === 0) {
        return { success: true, migrated: 0, errors: [], table: 'dashboard_sessions' };
      }

      for (const [sessionId, session] of sessions as any) {
        try {
          const { error } = await supabase
            .from('dashboard_sessions')
            .insert({
              id: sessionId,
              user_id: null, // Dashboard sessions are anonymous
              created_at: new Date(session.created),
              last_used: new Date(session.lastUsed),
              analysis_count: session.analysisCount || 0,
              plan: session.plan || 'free',
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
            });

          if (error) {
            errors.push(`Dashboard session ${sessionId}: ${error.message}`);
          } else {
            migrated++;
          }
        } catch (err) {
          errors.push(`Dashboard session ${sessionId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        migrated,
        errors,
        table: 'dashboard_sessions'
      };
    } catch (error) {
      return {
        success: false,
        migrated: 0,
        errors: [`Failed to migrate dashboard sessions: ${error instanceof Error ? error.message : 'Unknown error'}`],
        table: 'dashboard_sessions'
      };
    }
  }
}

export const databaseMigration = new DatabaseMigration();
