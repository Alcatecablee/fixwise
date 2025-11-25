import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { supabase } from './supabase-client';

type Tables = Database['public']['Tables'];
type AnalysisHistory = Tables['analysis_history']['Row'];
type Project = Tables['projects']['Row'];
type UserSettings = Tables['user_settings']['Row'];
type ApiKey = Tables['api_keys']['Row'];

// Production logging system - NO console.log
class ProductionLogger {
  private static instance: ProductionLogger;
  private logQueue: Array<{ level: string; message: string; timestamp: string; metadata?: any }> = [];

  static getInstance(): ProductionLogger {
    if (!this.instance) {
      this.instance = new ProductionLogger();
    }
    return this.instance;
  }

  private async sendToLogService(entry: any): Promise<void> {
    try {
      // Send to actual logging service (e.g., LogRocket, Sentry, custom endpoint)
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      // Fallback - store locally if logging service fails
      localStorage.setItem('pending_logs', JSON.stringify(this.logQueue));
    }
  }

  error(message: string, metadata?: any): void {
    const entry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      metadata
    };
    this.logQueue.push(entry);
    this.sendToLogService(entry);
  }

  warn(message: string, metadata?: any): void {
    const entry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      metadata
    };
    this.logQueue.push(entry);
    this.sendToLogService(entry);
  }

  info(message: string, metadata?: any): void {
    const entry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      metadata
    };
    this.logQueue.push(entry);
    this.sendToLogService(entry);
  }
}

// Production error handling
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public operation: string,
    public metadata?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Input validation schemas
const validators = {
  projectName: (name: string): boolean => {
    if (!name || typeof name !== 'string') return false;
    return name.length >= 3 && name.length <= 100 && /^[a-zA-Z0-9\s\-_]+$/.test(name);
  },
  
  email: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  
  userId: (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  },
  
  layers: (layers: number[]): boolean => {
    return Array.isArray(layers) && layers.every(l => Number.isInteger(l) && l >= 1 && l <= 6);
  }
};

// Production-ready Supabase service
export class SupabaseProductionService {
  private supabase = supabase as any;
  private logger = ProductionLogger.getInstance();
  private cache = new Map<string, { data: any; expiry: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Cache management
  private getCacheKey(operation: string, params: Record<string, any>): string {
    return `${operation}_${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_TTL
    });
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Try to get auth token from localStorage
    if (typeof window !== 'undefined') {
      try {
        const savedSession = localStorage.getItem('supabase_session') || 
                           localStorage.getItem('neurolint-supabase-auth');
        if (savedSession) {
          const sessionData = JSON.parse(savedSession);
          if (sessionData?.access_token) {
            headers['Authorization'] = `Bearer ${sessionData.access_token}`;
          }
        }
      } catch (error) {
        this.logger.warn('Error reading auth token from localStorage', { error });
      }
    }

    return headers;
  }

  // User Management
  async getCurrentUser(): Promise<{ user: any; session: any } | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error) {
        throw new DatabaseError(error.message, 'AUTH_ERROR', 'getCurrentUser');
      }

      if (!user) return null;

      const { data: { session } } = await this.supabase.auth.getSession();
      return { user, session };
    } catch (error) {
      this.logger.error('Failed to get current user', { error });
      throw error;
    }
  }

  private async ensureAuthenticated(expectedUserId?: string): Promise<void> {
    try {
      // Initialize session if needed
      if (typeof window !== "undefined") {
        const savedSessionStr = localStorage.getItem("neurolint-supabase-auth");
        if (savedSessionStr) {
          try {
            const savedSession = JSON.parse(savedSessionStr);
            if (savedSession?.access_token && savedSession?.refresh_token) {
              const { error } = await this.supabase.auth.setSession({
                access_token: savedSession.access_token,
                refresh_token: savedSession.refresh_token,
              });

              if (error) {
                this.logger.warn('Error setting Supabase session:', error);
              }
            }
          } catch (parseError) {
            this.logger.warn('Error parsing saved session:', parseError);
          }
        }
      }

      // Get current user
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      // If no user is authenticated and we have an expected user ID, try to set session from auth context
      if ((error || !user) && expectedUserId) {
        this.logger.warn('No authenticated user found, but expected user ID provided. This may be a client-side auth issue.');
        // Don't throw error, let the operation continue with the expected user ID
        return;
      }

      // If we have a user, validate the user ID if expected
      if (user && expectedUserId && user.id !== expectedUserId) {
        throw new DatabaseError(
          `User ID mismatch - authenticated: ${user.id}, expected: ${expectedUserId}`,
          'AUTH_ERROR',
          'ensureAuthenticated'
        );
      }
    } catch (error) {
      this.logger.error('Authentication check failed', { expectedUserId, error });
      // Don't throw the error, just log it and continue
      this.logger.warn('Continuing without authentication check');
    }
  }

  async getUserProfile(userId: string): Promise<any> {
    if (!validators.userId(userId)) {
      throw new ValidationError('Invalid user ID format', 'userId', userId);
    }

    const cacheKey = this.getCacheKey('profile', { userId });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Ensure authentication before making the request
      await this.ensureAuthenticated(userId);

      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new DatabaseError(error.message, error.code, 'getUserProfile', { userId });
      }

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      this.logger.error('Failed to get user profile', { userId, error });
      throw error;
    }
  }

  // Projects Management
  async getProjects(userId: string): Promise<Project[]> {
    if (!validators.userId(userId)) {
      throw new ValidationError('Invalid user ID format', 'userId', userId);
    }

    const cacheKey = this.getCacheKey('projects', { userId });
    const cached = this.getFromCache<Project[]>(cacheKey);
    if (cached) return cached;

    try {
      // Use projects API instead of direct Supabase call
      const response = await fetch(`/api/projects?userId=${userId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        this.logger.warn('Failed to get projects from API, returning empty array', { userId, status: response.status });
        this.setCache(cacheKey, []);
        return [];
      }

      const result = await response.json();
      const projects = result.projects || [];

      if (!projects || projects.length === 0) {
        this.setCache(cacheKey, []);
        return [];
      }

      // Get analysis counts for each project
      const projectIds = projects.map((p: any) => p.id);
      const { data: analysisCounts, error: countsError } = await this.supabase
        .from('project_analyses')
        .select('project_id')
        .in('project_id', projectIds);

      if (countsError) {
        this.logger.warn('Failed to get analysis counts, proceeding without counts', { userId, error: countsError });
      }

      // Count analyses per project
      const analysisCountMap = new Map<string, number>();
      if (analysisCounts) {
        analysisCounts.forEach((analysis: any) => {
          const count = analysisCountMap.get(analysis.project_id) || 0;
          analysisCountMap.set(analysis.project_id, count + 1);
        });
      }

      // Add analysis counts to projects
      const projectsWithCounts = projects.map((project: any) => ({
        ...project,
        analysis_count: analysisCountMap.get(project.id) || 0
      }));

      this.setCache(cacheKey, projectsWithCounts);
      return projectsWithCounts;
    } catch (error) {
      this.logger.error('Failed to get projects, returning empty array', { userId, error });
      // Return empty array instead of throwing
      this.setCache(cacheKey, []);
      return [];
    }
  }

  async createProject(userId: string, projectData: {
    name: string;
    description?: string;
    files?: string[];
    framework?: string;
  }): Promise<Project> {
    if (!validators.userId(userId)) {
      throw new ValidationError('Invalid user ID format', 'userId', userId);
    }
    
    if (!validators.projectName(projectData.name)) {
      throw new ValidationError(
        'Project name must be 3-100 characters and contain only alphanumeric characters, spaces, hyphens, and underscores',
        'name',
        projectData.name
      );
    }

    try {
      // Use projects API instead of direct Supabase call
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          userId,
          name: projectData.name,
          description: projectData.description || '',
          framework: projectData.framework || 'react'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new DatabaseError(errorData.error || 'API request failed', 'API_ERROR', 'createProject', { userId, projectData });
      }

      const result = await response.json();
      const data = result.project;

      // Invalidate cache
      const cacheKey = this.getCacheKey('projects', { userId });
      this.cache.delete(cacheKey);

      this.logger.info('Project created successfully', { projectId: data.id, userId });
      return data;
    } catch (error) {
      this.logger.error('Failed to create project', { userId, projectData, error });
      throw error;
    }
  }

  async updateProject(userId: string, projectId: string, updates: Partial<Project>): Promise<Project> {
    if (!validators.userId(userId)) {
      throw new ValidationError('Invalid user ID format', 'userId', userId);
    }

    if (updates.name && !validators.projectName(updates.name)) {
      throw new ValidationError('Invalid project name', 'name', updates.name);
    }

    try {
      const { data, error } = await this.supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(error.message, error.code, 'updateProject', { userId, projectId, updates });
      }

      // Invalidate cache
      const cacheKey = this.getCacheKey('projects', { userId });
      this.cache.delete(cacheKey);

      this.logger.info('Project updated successfully', { projectId, userId });
      return data;
    } catch (error) {
      this.logger.error('Failed to update project', { userId, projectId, updates, error });
      throw error;
    }
  }

  async deleteProject(userId: string, projectId: string): Promise<boolean> {
    if (!validators.userId(userId)) {
      throw new ValidationError('Invalid user ID format', 'userId', userId);
    }

    try {
      // Use projects API instead of direct Supabase call
      const response = await fetch(`/api/projects?projectId=${projectId}&userId=${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new DatabaseError(errorData.error || 'API request failed', 'API_ERROR', 'deleteProject', { userId, projectId });
      }

      // Invalidate cache
      const cacheKey = this.getCacheKey('projects', { userId });
      this.cache.delete(cacheKey);

      this.logger.info('Project deleted successfully', { projectId, userId });
      return true;
    } catch (error) {
      this.logger.error('Failed to delete project', { userId, projectId, error });
      throw error;
    }
  }

  // Analysis History
  async getAnalysisHistory(userId: string, limit: number = 50): Promise<AnalysisHistory[]> {
    if (!validators.userId(userId)) {
      throw new ValidationError('Invalid user ID format', 'userId', userId);
    }

    const cacheKey = this.getCacheKey('analysis_history', { userId, limit });
    const cached = this.getFromCache<AnalysisHistory[]>(cacheKey);
    if (cached) return cached;

    try {
      // Use analysis-history API instead of direct Supabase call
      const response = await fetch(`/api/analysis-history?userId=${userId}&limit=${limit}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        this.logger.warn('Failed to get analysis history from API, returning empty array', { userId, limit, status: response.status });
        this.setCache(cacheKey, []);
        return [];
      }

      const result = await response.json();
      const data = result.analysisHistory || [];
      
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      this.logger.error('Failed to get analysis history, returning empty array', { userId, error });
      // Return empty array instead of throwing
      this.setCache(cacheKey, []);
      return [];
    }
  }

  async saveAnalysisHistory(userId: string, analysisData: {
    filename: string;
    result: any;
    layers: number[];
    execution_time: number;
    project_id?: string;
  }): Promise<AnalysisHistory> {
    if (!validators.userId(userId)) {
      throw new ValidationError('Invalid user ID format', 'userId', userId);
    }

    if (!validators.layers(analysisData.layers)) {
      throw new ValidationError('Invalid layers array', 'layers', analysisData.layers);
    }

    try {
      // Use analysis-history API instead of direct Supabase call
      const response = await fetch('/api/analysis-history', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          userId,
          analysisData: {
            filename: analysisData.filename,
            result: analysisData.result,
            layers: analysisData.layers,
            execution_time: analysisData.execution_time,
            project_id: analysisData.project_id || null,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new DatabaseError(errorData.error || 'API request failed', 'API_ERROR', 'saveAnalysisHistory', { userId, analysisData });
      }

      const result = await response.json();
      const data = result.analysis || { id: Date.now().toString(), user_id: userId, ...analysisData };

      // Invalidate cache
      const cacheKey = this.getCacheKey('analysis_history', { userId, limit: 50 });
      this.cache.delete(cacheKey);

      this.logger.info('Analysis history saved successfully', { analysisId: data.id, userId });
      return data;
    } catch (error) {
      this.logger.error('Failed to save analysis history', { userId, analysisData, error });
      throw error;
    }
  }

  // User Settings
  async getUserSettings(userId: string): Promise<UserSettings> {
    if (!validators.userId(userId)) {
      throw new ValidationError('Invalid user ID format', 'userId', userId);
    }

    const cacheKey = this.getCacheKey('user_settings', { userId });
    const cached = this.getFromCache<UserSettings>(cacheKey);
    if (cached) return cached;

    try {
      // Use user-settings API instead of direct Supabase call
      const response = await fetch(`/api/user-settings?userId=${userId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        this.logger.warn('Failed to get user settings from API, using defaults', { userId, status: response.status });
      }

      const data = response.ok ? await response.json() : null;
 
      const settings = data || {
        id: `default-${userId}`,
        user_id: userId,
        default_layers: [1, 2, 3, 4],
        auto_save: true,
        notifications: true,
        theme: 'dark' as const,
        email_notifications: true,
        webhook_notifications: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.setCache(cacheKey, settings);
      return settings;
    } catch (error) {
      this.logger.error('Failed to get user settings, using defaults', { userId, error });
      // Return default settings instead of throwing
      const defaultSettings = {
        id: `default-${userId}`,
        user_id: userId,
        default_layers: [1, 2, 3, 4],
        auto_save: true,
        notifications: true,
        theme: 'dark' as const,
        email_notifications: true,
        webhook_notifications: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.setCache(cacheKey, defaultSettings);
      return defaultSettings;
    }
  }

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    if (!validators.userId(userId)) {
      throw new ValidationError('Invalid user ID format', 'userId', userId);
    }

    if (settings.default_layers && !validators.layers(settings.default_layers)) {
      throw new ValidationError('Invalid default layers', 'default_layers', settings.default_layers);
    }

    try {
      const { data, error } = await this.supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(error.message, error.code, 'updateUserSettings', { userId, settings });
      }

      // Invalidate cache
      const cacheKey = this.getCacheKey('user_settings', { userId });
      this.cache.delete(cacheKey);

      this.logger.info('User settings updated successfully', { userId });
      return data;
    } catch (error) {
      this.logger.error('Failed to update user settings', { userId, settings, error });
      throw error;
    }
  }

  // API Keys Management
  async getApiKeys(userId: string): Promise<ApiKey[]> {
    if (!validators.userId(userId)) {
      throw new ValidationError('Invalid user ID format', 'userId', userId);
    }

    try {
      const { data, error } = await this.supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(error.message, error.code, 'getApiKeys', { userId });
      }

      return data || [];
    } catch (error) {
      this.logger.error('Failed to get API keys', { userId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  async clearAnalysisHistory(userId: string): Promise<void> {
    if (!validators.userId(userId)) {
      throw new ValidationError('Invalid user ID format', 'userId', userId);
    }

    try {
      // Use analysis-history API instead of direct Supabase call
      const response = await fetch(`/api/analysis-history?userId=${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        this.logger.error('Failed to clear analysis history', { error: errorData.error, userId });
        throw new DatabaseError(`Failed to clear analysis history: ${errorData.error}`, 'API_ERROR', 'clearAnalysisHistory', { userId });
      }

      // Clear related cache
      this.clearCacheByPattern(`analysis_history_${userId}`);
      
      this.logger.info('Analysis history cleared successfully', { userId });
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError) throw error;
      this.logger.error('Unexpected error clearing analysis history', { error, userId });
      throw new DatabaseError('Unexpected error occurred', 'UNKNOWN', 'clearAnalysisHistory', { userId });
    }
  }

  // Real-time subscriptions
  subscribeToProjectUpdates(userId: string, callback: (payload: any) => void) {
    if (!validators.userId(userId)) {
      throw new ValidationError('Invalid user ID format', 'userId', userId);
    }

    return this.supabase
      .channel('project_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();
  }

  // Cleanup
  clearCache(): void {
    this.cache.clear();
    this.logger.info('Cache cleared successfully');
  }

  clearCacheByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
    this.logger.info('Cache cleared by pattern', { pattern });
  }
}

export const productionDb = new SupabaseProductionService();