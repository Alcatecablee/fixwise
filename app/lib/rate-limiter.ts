/**
 * Production Rate Limiting System
 * Designed for Vercel serverless environment with proper fallbacks
 */

import { logger } from './production-logger';

export interface RateLimitConfig {
  requestsPerHour: number;
  requestsPerDay: number;
  burstSize?: number;
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  limit: number;
  window: 'hour' | 'day';
}

export interface RateLimitKey {
  userId?: string;
  ip?: string;
  action: string;
  tier: string;
}

class RateLimiter {
  private static instance: RateLimiter;
  private memoryStore: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly cleanupInterval = 60000; // 1 minute
  private lastCleanup = Date.now();

  private constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check rate limit for a specific key
   */
  checkRateLimit(
    key: RateLimitKey,
    config: RateLimitConfig,
    requestId?: string
  ): RateLimitResult {
    try {
      const now = Date.now();
      const keyString = this.generateKeyString(key);
      
      // Check both hourly and daily limits
      const hourlyResult = this.checkWindow(keyString, 'hour', config.requestsPerHour, now);
      const dailyResult = this.checkWindow(keyString, 'day', config.requestsPerDay, now);

      // Use the more restrictive limit
      const allowed = hourlyResult.allowed && dailyResult.allowed;
      const remaining = Math.min(hourlyResult.remaining, dailyResult.remaining);
      const resetTime = Math.max(hourlyResult.resetTime, dailyResult.resetTime);
      const window = hourlyResult.resetTime > dailyResult.resetTime ? 'hour' : 'day';

      const result: RateLimitResult = {
        allowed,
        remaining,
        resetTime,
        limit: window === 'hour' ? config.requestsPerHour : config.requestsPerDay,
        window
      };

      if (!allowed) {
        result.retryAfter = Math.ceil((resetTime - now) / 1000);
        logger.warn('Rate limit exceeded', {
          key: keyString,
          action: key.action,
          tier: key.tier,
          window,
          remaining: 0,
          retryAfter: result.retryAfter
        }, requestId);
      } else {
        logger.debug('Rate limit check passed', {
          key: keyString,
          action: key.action,
          tier: key.tier,
          window,
          remaining
        }, requestId);
      }

      return result;
    } catch (error) {
      logger.error('Rate limit check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key: key.action,
        tier: key.tier
      }, requestId);

      // Fail open in case of errors
      return {
        allowed: true,
        remaining: 100,
        resetTime: Date.now() + 3600000,
        limit: config.requestsPerHour,
        window: 'hour'
      };
    }
  }

  /**
   * Check rate limit for API key
   */
  checkApiKeyRateLimit(
    apiKey: string,
    action: string,
    config: RateLimitConfig,
    requestId?: string
  ): RateLimitResult {
    return this.checkRateLimit(
      { action, tier: 'api' },
      config,
      requestId
    );
  }

  /**
   * Check rate limit for user
   */
  checkUserRateLimit(
    userId: string,
    action: string,
    tier: string,
    config: RateLimitConfig,
    requestId?: string
  ): RateLimitResult {
    return this.checkRateLimit(
      { userId, action, tier },
      config,
      requestId
    );
  }

  /**
   * Check rate limit for IP address
   */
  checkIpRateLimit(
    ip: string,
    action: string,
    config: RateLimitConfig,
    requestId?: string
  ): RateLimitResult {
    return this.checkRateLimit(
      { ip, action, tier: 'anonymous' },
      config,
      requestId
    );
  }

  /**
   * Get tier-specific rate limits
   */
  getTierLimits(tier: string): RateLimitConfig {
    const tierLimits = {
      free: {
        requestsPerHour: 10,
        requestsPerDay: 50,
        burstSize: 5,
        windowMs: 3600000
      },
      basic: {
        requestsPerHour: 50,
        requestsPerDay: 200,
        burstSize: 20,
        windowMs: 3600000
      },
      professional: {
        requestsPerHour: 200,
        requestsPerDay: 1000,
        burstSize: 100,
        windowMs: 3600000
      },
      enterprise: {
        requestsPerHour: 1000,
        requestsPerDay: 5000,
        burstSize: 500,
        windowMs: 3600000
      }
    };

    return tierLimits[tier as keyof typeof tierLimits] || tierLimits.free;
  }

  /**
   * Reset rate limit for a key (for testing or manual override)
   */
  resetRateLimit(key: RateLimitKey): void {
    const keyString = this.generateKeyString(key);
    this.memoryStore.delete(keyString);
    logger.info('Rate limit reset', { key: keyString });
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(key: RateLimitKey): { count: number; resetTime: number } | null {
    const keyString = this.generateKeyString(key);
    return this.memoryStore.get(keyString) || null;
  }

  private checkWindow(
    keyString: string,
    window: 'hour' | 'day',
    limit: number,
    now: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const windowMs = window === 'hour' ? 3600000 : 86400000;
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const resetTime = windowStart + windowMs;

    const current = this.memoryStore.get(keyString);
    
    if (!current || now > current.resetTime) {
      // New window or expired
      this.memoryStore.set(keyString, { count: 1, resetTime });
      return { allowed: true, remaining: limit - 1, resetTime };
    }

    if (current.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: current.resetTime };
    }

    // Increment count
    current.count++;
    this.memoryStore.set(keyString, current);
    
    return { 
      allowed: true, 
      remaining: limit - current.count, 
      resetTime: current.resetTime 
    };
  }

  private generateKeyString(key: RateLimitKey): string {
    const parts = [
      key.userId || key.ip || 'anonymous',
      key.action,
      key.tier
    ];
    return parts.join(':');
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.memoryStore.entries()) {
      if (now > value.resetTime) {
        this.memoryStore.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }

    this.lastCleanup = now;
  }

  /**
   * Get memory usage statistics
   */
  getStats(): { 
    totalEntries: number; 
    memoryUsage: number; 
    lastCleanup: number 
  } {
    return {
      totalEntries: this.memoryStore.size,
      memoryUsage: process.memoryUsage().heapUsed,
      lastCleanup: this.lastCleanup
    };
  }
}

export const rateLimiter = RateLimiter.getInstance();

// Convenience functions for common rate limiting patterns
export const checkApiRateLimit = (
  apiKey: string,
  action: string,
  config: RateLimitConfig,
  requestId?: string
) => rateLimiter.checkApiKeyRateLimit(apiKey, action, config, requestId);

export const checkUserRateLimit = (
  userId: string,
  action: string,
  tier: string,
  config: RateLimitConfig,
  requestId?: string
) => rateLimiter.checkUserRateLimit(userId, action, tier, config, requestId);

export const checkIpRateLimit = (
  ip: string,
  action: string,
  config: RateLimitConfig,
  requestId?: string
) => rateLimiter.checkIpRateLimit(ip, action, config, requestId);

export const getTierRateLimits = (tier: string) => rateLimiter.getTierLimits(tier); 