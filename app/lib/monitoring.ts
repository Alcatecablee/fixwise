/**
 * Production Monitoring System
 * Tracks performance, errors, and business metrics for production deployment
 */

import { logger } from './production-logger';

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: number;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface BusinessMetric {
  event: string;
  userId?: string;
  tier?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export interface ErrorMetric {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

class MonitoringSystem {
  private static instance: MonitoringSystem;
  private metrics: MetricData[] = [];
  private readonly maxMetrics = 1000;
  private readonly flushInterval = 60000; // 1 minute

  private constructor() {
    // Start periodic metric flushing
    setInterval(() => this.flushMetrics(), this.flushInterval);
  }

  static getInstance(): MonitoringSystem {
    if (!MonitoringSystem.instance) {
      MonitoringSystem.instance = new MonitoringSystem();
    }
    return MonitoringSystem.instance;
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: PerformanceMetric): void {
    const metricData: MetricData = {
      name: `performance.${metric.operation}`,
      value: metric.duration,
      tags: {
        success: metric.success.toString(),
        ...(metric.error && { error: metric.error }),
        ...metric.metadata
      },
      timestamp: Date.now()
    };

    this.addMetric(metricData);
    
    logger.info(`Performance metric: ${metric.operation}`, {
      duration: metric.duration,
      success: metric.success,
      ...(metric.error && { error: metric.error }),
      ...metric.metadata
    });
  }

  /**
   * Track business metric
   */
  trackBusiness(metric: BusinessMetric): void {
    const metricData: MetricData = {
      name: `business.${metric.event}`,
      value: metric.value || 1,
      tags: {
        ...(metric.userId && { userId: metric.userId }),
        ...(metric.tier && { tier: metric.tier }),
        ...metric.metadata
      },
      timestamp: Date.now()
    };

    this.addMetric(metricData);
    
    logger.info(`Business metric: ${metric.event}`, {
      userId: metric.userId,
      tier: metric.tier,
      value: metric.value,
      ...metric.metadata
    });
  }

  /**
   * Track error metric
   */
  trackError(metric: ErrorMetric): void {
    const metricData: MetricData = {
      name: `error.${metric.type}`,
      value: 1,
      tags: {
        severity: metric.severity,
        message: metric.message,
        ...(metric.stack && { hasStack: 'true' }),
        ...metric.context
      },
      timestamp: Date.now()
    };

    this.addMetric(metricData);
    
    logger.error(`Error metric: ${metric.type}`, {
      severity: metric.severity,
      message: metric.message,
      ...(metric.stack && { stack: metric.stack }),
      ...metric.context
    });
  }

  /**
   * Track API usage
   */
  trackApiUsage(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    userId?: string,
    tier?: string
  ): void {
    const success = statusCode < 400;
    
    this.trackPerformance({
      operation: `api.${method.toLowerCase()}.${endpoint}`,
      duration,
      success,
      metadata: {
        endpoint,
        method,
        statusCode,
        userId,
        tier
      }
    });

    this.trackBusiness({
      event: 'api_request',
      userId,
      tier,
      metadata: {
        endpoint,
        method,
        statusCode,
        duration
      }
    });
  }

  /**
   * Track user activity
   */
  trackUserActivity(
    activity: string,
    userId: string,
    tier: string,
    metadata?: Record<string, any>
  ): void {
    this.trackBusiness({
      event: `user_activity.${activity}`,
      userId,
      tier,
      metadata
    });
  }

  /**
   * Track tier usage
   */
  trackTierUsage(
    tier: string,
    action: string,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    this.trackBusiness({
      event: `tier_usage.${action}`,
      tier,
      metadata: {
        success,
        ...metadata
      }
    });
  }

  /**
   * Track engine performance
   */
  trackEnginePerformance(
    operation: string,
    duration: number,
    success: boolean,
    layers?: number[],
    metadata?: Record<string, any>
  ): void {
    this.trackPerformance({
      operation: `engine.${operation}`,
      duration,
      success,
      metadata: {
        ...(layers && { layers: layers.join(',') }),
        ...metadata
      }
    });
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): {
    totalMetrics: number;
    performanceMetrics: number;
    businessMetrics: number;
    errorMetrics: number;
    lastFlush: number;
  } {
    const performanceMetrics = this.metrics.filter(m => m.name.startsWith('performance.')).length;
    const businessMetrics = this.metrics.filter(m => m.name.startsWith('business.')).length;
    const errorMetrics = this.metrics.filter(m => m.name.startsWith('error.')).length;

    return {
      totalMetrics: this.metrics.length,
      performanceMetrics,
      businessMetrics,
      errorMetrics,
      lastFlush: Date.now()
    };
  }

  /**
   * Get metrics for specific time range
   */
  getMetricsByTimeRange(
    startTime: number,
    endTime: number,
    filter?: (metric: MetricData) => boolean
  ): MetricData[] {
    return this.metrics.filter(metric => {
      const inTimeRange = metric.timestamp && metric.timestamp >= startTime && metric.timestamp <= endTime;
      const passesFilter = !filter || filter(metric);
      return inTimeRange && passesFilter;
    });
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(timeWindow: number = 3600000): Record<string, any> {
    const now = Date.now();
    const startTime = now - timeWindow;
    
    const recentMetrics = this.getMetricsByTimeRange(startTime, now);
    
    const aggregated: Record<string, any> = {
      totalRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      tierUsage: {},
      endpointUsage: {}
    };

    let totalDuration = 0;
    let totalErrors = 0;
    let totalRequests = 0;

    for (const metric of recentMetrics) {
      if (metric.name.startsWith('performance.api.')) {
        totalRequests++;
        totalDuration += metric.value;
        
        if (metric.tags?.success === 'false') {
          totalErrors++;
        }

        // Track endpoint usage
        const endpoint = metric.tags?.endpoint;
        if (endpoint) {
          aggregated.endpointUsage[endpoint] = (aggregated.endpointUsage[endpoint] || 0) + 1;
        }
      }

      if (metric.name.startsWith('business.tier_usage.')) {
        const tier = metric.tags?.tier;
        if (tier) {
          if (!aggregated.tierUsage[tier]) {
            aggregated.tierUsage[tier] = { total: 0, successful: 0 };
          }
          aggregated.tierUsage[tier].total++;
          if (metric.tags?.success === 'true') {
            aggregated.tierUsage[tier].successful++;
          }
        }
      }
    }

    if (totalRequests > 0) {
      aggregated.totalRequests = totalRequests;
      aggregated.averageResponseTime = totalDuration / totalRequests;
      aggregated.errorRate = (totalErrors / totalRequests) * 100;
    }

    return aggregated;
  }

  private addMetric(metric: MetricData): void {
    this.metrics.push(metric);
    
    // Keep only the latest metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  private flushMetrics(): void {
    if (this.metrics.length === 0) return;

    // In production, this would send metrics to a monitoring service
    // For now, we just log the summary
    const summary = this.getMetricsSummary();
    
    logger.info('Metrics flush', {
      totalMetrics: summary.totalMetrics,
      performanceMetrics: summary.performanceMetrics,
      businessMetrics: summary.businessMetrics,
      errorMetrics: summary.errorMetrics
    });

    // Clear metrics after flushing
    this.metrics = [];
  }
}

export const monitoring = MonitoringSystem.getInstance();

// Convenience functions for common monitoring patterns
export const trackApiRequest = (
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number,
  userId?: string,
  tier?: string
) => monitoring.trackApiUsage(endpoint, method, statusCode, duration, userId, tier);

export const trackUserAction = (
  activity: string,
  userId: string,
  tier: string,
  metadata?: Record<string, any>
) => monitoring.trackUserActivity(activity, userId, tier, metadata);

export const trackTierAction = (
  tier: string,
  action: string,
  success: boolean,
  metadata?: Record<string, any>
) => monitoring.trackTierUsage(tier, action, success, metadata);

export const trackEngineOperation = (
  operation: string,
  duration: number,
  success: boolean,
  layers?: number[],
  metadata?: Record<string, any>
) => monitoring.trackEnginePerformance(operation, duration, success, layers, metadata); 