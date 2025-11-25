import Analytics from '@vercel/analytics';

interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

interface AnalyticsEvent {
  id: string;
  timestamp: Date;
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

interface PerformanceMetric {
  id: string;
  timestamp: Date;
  metric: string;
  value: number;
  unit: string;
  context?: Record<string, any>;
}

interface UsageStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  activeSessions: number;
  totalAnalyses: number;
  avgResponseTime: number;
  errorRate: number;
  uptime: number;
}

export class MonitoringService {
  private errorLogs: ErrorLog[] = [];
  private analyticsEvents: AnalyticsEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private maxLogSize = 1000; // Keep last 1000 entries of each type

  constructor() {
    // Initialize error handlers
    this.initializeErrorHandling();
    this.initializePerformanceMonitoring();
  }

  private initializeErrorHandling() {
    if (typeof window !== 'undefined') {
      // Global error handler
      window.addEventListener('error', (event) => {
        this.logError({
          level: 'error',
          message: event.message,
          stack: event.error?.stack,
          context: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            type: 'javascript_error'
          },
          url: window.location.href,
          userAgent: navigator.userAgent
        });
      });

      // Unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        this.logError({
          level: 'error',
          message: `Unhandled promise rejection: ${event.reason}`,
          stack: event.reason?.stack,
          context: {
            type: 'unhandled_promise_rejection',
            reason: event.reason
          },
          url: window.location.href,
          userAgent: navigator.userAgent
        });
      });
    }
  }

  private initializePerformanceMonitoring() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor page load performance
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          if (navigation) {
            this.logPerformanceMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart, 'ms', {
              dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
              tcp_handshake: navigation.connectEnd - navigation.connectStart,
              server_response: navigation.responseEnd - navigation.requestStart,
              dom_processing: navigation.domContentLoadedEventEnd - navigation.responseEnd
            });
          }
        }, 0);
      });

      // Monitor resource loading
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.logPerformanceMetric('resource_load_time', resourceEntry.duration, 'ms', {
              name: resourceEntry.name,
              type: resourceEntry.initiatorType,
              size: resourceEntry.transferSize
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }
  }

  // Error Logging
  logError(error: Omit<ErrorLog, 'id' | 'timestamp'>): void {
    const errorLog: ErrorLog = {
      id: `error_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      timestamp: new Date(),
      ...error
    };

    this.errorLogs.push(errorLog);
    
    // Keep only the most recent logs
    if (this.errorLogs.length > this.maxLogSize) {
      this.errorLogs = this.errorLogs.slice(-this.maxLogSize);
    }

    // Send to external monitoring service if configured
    this.sendToExternalMonitoring('error', errorLog);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[MONITORING]', errorLog);
    }
  }

  // Analytics Event Tracking
  trackEvent(event: string, properties?: Record<string, any>, userId?: string, sessionId?: string): void {
    const analyticsEvent: AnalyticsEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      timestamp: new Date(),
      event,
      properties,
      userId,
      sessionId
    };

    this.analyticsEvents.push(analyticsEvent);
    
    if (this.analyticsEvents.length > this.maxLogSize) {
      this.analyticsEvents = this.analyticsEvents.slice(-this.maxLogSize);
    }

    // Send to analytics service
    this.sendToAnalytics(analyticsEvent);
  }

  // Performance Metrics
  logPerformanceMetric(metric: string, value: number, unit: string, context?: Record<string, any>): void {
    const performanceMetric: PerformanceMetric = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      timestamp: new Date(),
      metric,
      value,
      unit,
      context
    };

    this.performanceMetrics.push(performanceMetric);
    
    if (this.performanceMetrics.length > this.maxLogSize) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxLogSize);
    }

    // Send to monitoring service
    this.sendToExternalMonitoring('performance', performanceMetric);
  }

  // NeuroLint Specific Analytics
  trackCodeAnalysis(sessionId: string, filename: string, layers: number[], executionTime: number, issuesFound: number, userId?: string): void {
    this.trackEvent('code_analysis', {
      filename,
      layers,
      execution_time: executionTime,
      issues_found: issuesFound,
      analysis_type: 'neurolint'
    }, userId, sessionId);

    this.logPerformanceMetric('analysis_execution_time', executionTime, 'ms', {
      filename,
      layers: layers.length,
      issues_found: issuesFound
    });
  }

  trackCollaborationSession(action: 'create' | 'join' | 'leave', sessionId: string, participantCount: number, userId?: string): void {
    this.trackEvent('collaboration_session', {
      action,
      participant_count: participantCount,
      session_duration: action === 'leave' ? this.getSessionDuration(sessionId) : undefined
    }, userId, sessionId);
  }

  trackUserAuthentication(action: 'login' | 'signup' | 'logout', method: 'email' | 'oauth', userId?: string): void {
    this.trackEvent('user_auth', {
      action,
      method,
      timestamp: new Date().toISOString()
    }, userId);
  }

  trackAPICall(endpoint: string, method: string, statusCode: number, responseTime: number, userId?: string): void {
    this.trackEvent('api_call', {
      endpoint,
      method,
      status_code: statusCode,
      response_time: responseTime,
      success: statusCode >= 200 && statusCode < 400
    }, userId);

    this.logPerformanceMetric('api_response_time', responseTime, 'ms', {
      endpoint,
      method,
      status_code: statusCode
    });
  }

  trackWebSocketConnection(action: 'connect' | 'disconnect' | 'error', sessionId?: string, userId?: string): void {
    this.trackEvent('websocket', {
      action,
      connection_time: action === 'connect' ? Date.now() : undefined
    }, userId, sessionId);
  }

  // Error Recovery Tracking
  trackErrorRecovery(errorType: string, recoveryAction: string, success: boolean, userId?: string): void {
    this.trackEvent('error_recovery', {
      error_type: errorType,
      recovery_action: recoveryAction,
      success,
      timestamp: new Date().toISOString()
    }, userId);
  }

  // Health Monitoring
  async checkSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    checks: Record<string, { status: 'ok' | 'error'; message?: string; responseTime?: number }>;
  }> {
    const checks: Record<string, { status: 'ok' | 'error'; message?: string; responseTime?: number }> = {};

    // Check API health
    try {
      const start = Date.now();
      const response = await fetch('/api/health');
      const responseTime = Date.now() - start;
      
      if (response.ok) {
        checks.api = { status: 'ok', responseTime };
      } else {
        checks.api = { status: 'error', message: `HTTP ${response.status}`, responseTime };
      }
    } catch (error) {
      checks.api = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Check WebSocket connectivity
    try {
      const wsHealthy = await this.checkWebSocketHealth();
      checks.websocket = { status: wsHealthy ? 'ok' : 'error', message: wsHealthy ? undefined : 'Connection failed' };
    } catch (error) {
      checks.websocket = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Check local storage
    try {
      localStorage.setItem('health_check', 'test');
      localStorage.removeItem('health_check');
      checks.localStorage = { status: 'ok' };
    } catch (error) {
      checks.localStorage = { status: 'error', message: 'LocalStorage not available' };
    }

    // Determine overall status
    const hasErrors = Object.values(checks).some(check => check.status === 'error');
    const status = hasErrors ? 'degraded' : 'healthy';

    return { status, checks };
  }

  private async checkWebSocketHealth(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/collaboration/ws?sessionId=health_check&userName=health_check`;
        const ws = new WebSocket(wsUrl);
        
        const timeout = setTimeout(() => {
          ws.close();
          resolve(false);
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      } catch (error) {
        resolve(false);
      }
    });
  }

  // Usage Statistics
  getUsageStats(): UsageStats {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const recentEvents = this.analyticsEvents.filter(event => 
      now - event.timestamp.getTime() < hour
    );

    const uniqueUsers = new Set(
      recentEvents.filter(e => e.userId).map(e => e.userId)
    ).size;

    const uniqueSessions = new Set(
      recentEvents.filter(e => e.sessionId).map(e => e.sessionId)
    ).size;

    const analyses = recentEvents.filter(e => e.event === 'code_analysis').length;
    
    const apiCalls = recentEvents.filter(e => e.event === 'api_call');
    const avgResponseTime = apiCalls.length > 0 
      ? apiCalls.reduce((sum, event) => sum + (event.properties?.response_time || 0), 0) / apiCalls.length
      : 0;

    const errorRate = recentEvents.filter(e => e.event === 'api_call' && !e.properties?.success).length / 
                     Math.max(apiCalls.length, 1);

    return {
      totalUsers: uniqueUsers,
      activeUsers: uniqueUsers,
      totalSessions: uniqueSessions,
      activeSessions: uniqueSessions,
      totalAnalyses: analyses,
      avgResponseTime,
      errorRate,
      uptime: 99.9 // Placeholder - would be calculated from actual uptime monitoring
    };
  }

  // Data Export for Analytics Dashboard
  getErrorLogs(limit = 100): ErrorLog[] {
    return this.errorLogs
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getAnalyticsEvents(limit = 100): AnalyticsEvent[] {
    return this.analyticsEvents
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getPerformanceMetrics(limit = 100): PerformanceMetric[] {
    return this.performanceMetrics
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Private helper methods
  private getSessionDuration(sessionId: string): number | undefined {
    const sessionEvents = this.analyticsEvents.filter(e => e.sessionId === sessionId);
    if (sessionEvents.length < 2) return undefined;

    const firstEvent = sessionEvents[sessionEvents.length - 1];
    const lastEvent = sessionEvents[0];
    return lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();
  }

  private async sendToExternalMonitoring(type: 'error' | 'performance', data: any): Promise<void> {
    // Send to external monitoring services like Sentry, DataDog, etc.
    // This is a placeholder for actual implementation
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MONITORING ${type.toUpperCase()}]`, data);
    }

    // Example integration with Sentry
    if (typeof window !== 'undefined' && (window as any).Sentry && type === 'error') {
      (window as any).Sentry.captureException(new Error(data.message), {
        extra: data.context,
        tags: {
          level: data.level,
          userId: data.userId,
          sessionId: data.sessionId
        }
      });
    }
  }

  private sendToAnalytics(event: AnalyticsEvent): void {
    // Send to analytics services like Google Analytics, Mixpanel, etc.
    
    // Vercel Analytics integration
    if (typeof window !== 'undefined') {
      try {
        // Use Vercel Analytics if available
        Analytics.track?.(event.event, event.properties);
      } catch (error) {
        console.warn('Failed to send to Vercel Analytics:', error);
      }
    }

    // Example Google Analytics integration
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.event, {
        custom_parameter_1: event.properties,
        user_id: event.userId,
        session_id: event.sessionId
      });
    }
  }

  // Real-time monitoring dashboard data
  getRealTimeMetrics(): {
    errorRate: number;
    averageResponseTime: number;
    activeUsers: number;
    activeSessions: number;
    systemHealth: 'healthy' | 'degraded' | 'down';
  } {
    const recentEvents = this.analyticsEvents.filter(e => 
      Date.now() - e.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    const apiCalls = recentEvents.filter(e => e.event === 'api_call');
    const errors = apiCalls.filter(e => !e.properties?.success);
    
    const errorRate = apiCalls.length > 0 ? errors.length / apiCalls.length : 0;
    const averageResponseTime = apiCalls.length > 0 
      ? apiCalls.reduce((sum, e) => sum + (e.properties?.response_time || 0), 0) / apiCalls.length
      : 0;

    const activeUsers = new Set(recentEvents.map(e => e.userId).filter(Boolean)).size;
    const activeSessions = new Set(recentEvents.map(e => e.sessionId).filter(Boolean)).size;

    const systemHealth = errorRate > 0.1 ? 'degraded' : 'healthy';

    return {
      errorRate,
      averageResponseTime,
      activeUsers,
      activeSessions,
      systemHealth
    };
  }
}

export const monitoringService = new MonitoringService();

// Export singleton instance
export default monitoringService;
