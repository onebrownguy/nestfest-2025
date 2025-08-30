/**
 * Rate Limiting and Security Features for NestFest Authentication
 * 
 * Provides comprehensive rate limiting, brute force protection,
 * and request throttling with Redis-based storage (fallback to database).
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../supabase/client';

export interface RateLimitRule {
  windowMs: number;  // Time window in milliseconds
  maxAttempts: number;  // Maximum attempts within window
  skipSuccessful?: boolean;  // Don't count successful requests
  skipFailedRequests?: boolean;  // Don't count failed requests
  message?: string;  // Custom error message
  statusCode?: number;  // Custom status code
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;  // Seconds until retry allowed
}

export interface BruteForceConfig {
  maxAttempts: number;
  lockoutDuration: number;  // milliseconds
  progressiveLockout: boolean;  // Increase lockout duration with each violation
}

export class RateLimiter {
  private readonly defaultRules: Record<string, RateLimitRule> = {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5,
      message: 'Too many login attempts. Please try again later.',
      statusCode: 429
    },
    register: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 3,
      message: 'Too many registration attempts. Please try again later.',
      statusCode: 429
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 3,
      message: 'Too many password reset requests. Please try again later.',
      statusCode: 429
    },
    emailVerification: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 5,
      message: 'Too many email verification attempts. Please try again later.',
      statusCode: 429
    },
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 100,
      message: 'Rate limit exceeded. Please slow down.',
      statusCode: 429
    },
    mfa: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxAttempts: 5,
      message: 'Too many MFA attempts. Please wait before trying again.',
      statusCode: 429
    }
  };

  /**
   * Check rate limit for a specific identifier and rule
   */
  async checkRateLimit(
    identifier: string,
    ruleKey: string,
    customRule?: Partial<RateLimitRule>
  ): Promise<RateLimitResult> {
    const rule = { ...this.defaultRules[ruleKey], ...customRule };
    
    if (!rule) {
      throw new Error(`Unknown rate limit rule: ${ruleKey}`);
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - rule.windowMs);
    const key = `rate_limit:${ruleKey}:${identifier}`;

    try {
      // Clean up old attempts first
      await this.cleanupOldAttempts(key, windowStart);

      // Get current attempts within window
      const { data: attempts, error } = await supabaseAdmin
        .from('rate_limit_attempts')
        .select('id, timestamp, success')
        .eq('identifier', key)
        .gte('timestamp', windowStart.toISOString())
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Rate limit check error:', error);
        return this.createAllowedResult(rule);
      }

      // Filter attempts based on rule configuration
      let relevantAttempts = attempts || [];
      
      if (rule.skipSuccessful) {
        relevantAttempts = relevantAttempts.filter(a => !a.success);
      }
      
      if (rule.skipFailedRequests) {
        relevantAttempts = relevantAttempts.filter(a => a.success);
      }

      const attemptCount = relevantAttempts.length;
      const remaining = Math.max(0, rule.maxAttempts - attemptCount);
      const resetTime = new Date(now.getTime() + rule.windowMs);

      if (attemptCount >= rule.maxAttempts) {
        const oldestAttempt = relevantAttempts[relevantAttempts.length - 1];
        const retryAfter = oldestAttempt 
          ? Math.ceil((new Date(oldestAttempt.timestamp).getTime() + rule.windowMs - now.getTime()) / 1000)
          : Math.ceil(rule.windowMs / 1000);

        return {
          allowed: false,
          limit: rule.maxAttempts,
          remaining: 0,
          resetTime,
          retryAfter: Math.max(retryAfter, 0)
        };
      }

      return {
        allowed: true,
        limit: rule.maxAttempts,
        remaining,
        resetTime
      };

    } catch (error) {
      console.error('Rate limit error:', error);
      return this.createAllowedResult(rule);
    }
  }

  /**
   * Record an attempt (success or failure)
   */
  async recordAttempt(
    identifier: string,
    ruleKey: string,
    success: boolean = true,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const key = `rate_limit:${ruleKey}:${identifier}`;
      
      await supabaseAdmin
        .from('rate_limit_attempts')
        .insert({
          identifier: key,
          rule_key: ruleKey,
          timestamp: new Date().toISOString(),
          success,
          metadata: metadata || {}
        });
    } catch (error) {
      console.error('Rate limit recording error:', error);
    }
  }

  /**
   * Check and enforce brute force protection
   */
  async checkBruteForce(
    identifier: string,
    config: BruteForceConfig
  ): Promise<{ allowed: boolean; lockoutEnd?: Date; attempt: number }> {
    try {
      const key = `brute_force:${identifier}`;
      const now = new Date();

      // Get current brute force status
      const { data: record } = await supabaseAdmin
        .from('brute_force_protection')
        .select('*')
        .eq('identifier', key)
        .single();

      if (!record) {
        return { allowed: true, attempt: 0 };
      }

      // Check if lockout period has expired
      if (record.locked_until && new Date(record.locked_until) > now) {
        return {
          allowed: false,
          lockoutEnd: new Date(record.locked_until),
          attempt: record.failed_attempts
        };
      }

      // Check if we should reset the counter (after successful period or lockout expiry)
      const timeSinceLastAttempt = now.getTime() - new Date(record.last_attempt_at).getTime();
      const resetWindow = 60 * 60 * 1000; // 1 hour

      if (record.locked_until && new Date(record.locked_until) <= now) {
        // Lockout expired, reset
        await this.resetBruteForce(identifier);
        return { allowed: true, attempt: 0 };
      }

      if (timeSinceLastAttempt > resetWindow && record.failed_attempts < config.maxAttempts) {
        // Reset counter after period of good behavior
        await this.resetBruteForce(identifier);
        return { allowed: true, attempt: 0 };
      }

      return {
        allowed: record.failed_attempts < config.maxAttempts,
        attempt: record.failed_attempts
      };

    } catch (error) {
      console.error('Brute force check error:', error);
      return { allowed: true, attempt: 0 };
    }
  }

  /**
   * Record failed attempt for brute force protection
   */
  async recordFailedAttempt(
    identifier: string,
    config: BruteForceConfig,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const key = `brute_force:${identifier}`;
      const now = new Date();

      const { data: existing } = await supabaseAdmin
        .from('brute_force_protection')
        .select('*')
        .eq('identifier', key)
        .single();

      const failedAttempts = (existing?.failed_attempts || 0) + 1;
      
      let lockoutEnd: Date | null = null;
      if (failedAttempts >= config.maxAttempts) {
        let lockoutDuration = config.lockoutDuration;
        
        if (config.progressiveLockout && existing) {
          // Progressive lockout: double the duration each time
          const previousLockouts = existing.lockout_count || 0;
          lockoutDuration = config.lockoutDuration * Math.pow(2, previousLockouts);
        }
        
        lockoutEnd = new Date(now.getTime() + lockoutDuration);
      }

      const updateData = {
        identifier: key,
        failed_attempts: failedAttempts,
        last_attempt_at: now.toISOString(),
        locked_until: lockoutEnd?.toISOString() || null,
        lockout_count: existing ? (existing.lockout_count || 0) + (lockoutEnd ? 1 : 0) : (lockoutEnd ? 1 : 0),
        metadata: { ...existing?.metadata, ...metadata }
      };

      if (existing) {
        await supabaseAdmin
          .from('brute_force_protection')
          .update(updateData)
          .eq('id', existing.id);
      } else {
        await supabaseAdmin
          .from('brute_force_protection')
          .insert(updateData);
      }

    } catch (error) {
      console.error('Failed attempt recording error:', error);
    }
  }

  /**
   * Reset brute force protection for identifier
   */
  async resetBruteForce(identifier: string): Promise<void> {
    try {
      const key = `brute_force:${identifier}`;
      
      await supabaseAdmin
        .from('brute_force_protection')
        .delete()
        .eq('identifier', key);
    } catch (error) {
      console.error('Brute force reset error:', error);
    }
  }

  /**
   * Get rate limit info for client
   */
  async getRateLimitInfo(
    identifier: string,
    ruleKey: string
  ): Promise<{ limit: number; remaining: number; resetTime: Date }> {
    const result = await this.checkRateLimit(identifier, ruleKey);
    return {
      limit: result.limit,
      remaining: result.remaining,
      resetTime: result.resetTime
    };
  }

  /**
   * Clean up old rate limit attempts
   */
  private async cleanupOldAttempts(key: string, cutoff: Date): Promise<void> {
    try {
      await supabaseAdmin
        .from('rate_limit_attempts')
        .delete()
        .eq('identifier', key)
        .lt('timestamp', cutoff.toISOString());
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Create allowed result for error scenarios
   */
  private createAllowedResult(rule: RateLimitRule): RateLimitResult {
    return {
      allowed: true,
      limit: rule.maxAttempts,
      remaining: rule.maxAttempts,
      resetTime: new Date(Date.now() + rule.windowMs)
    };
  }

  /**
   * Extract identifier from request (IP, user ID, etc.)
   */
  getIdentifierFromRequest(
    request: NextRequest,
    type: 'ip' | 'user' | 'combined' = 'ip',
    userId?: string
  ): string {
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              '127.0.0.1';

    switch (type) {
      case 'ip':
        return ip;
      case 'user':
        return userId || 'anonymous';
      case 'combined':
        return `${ip}:${userId || 'anonymous'}`;
      default:
        return ip;
    }
  }

  /**
   * Create rate limit headers for response
   */
  createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
      ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() })
    };
  }

  /**
   * Cleanup old records (run periodically)
   */
  async cleanupOldRecords(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days old

      // Clean up rate limit attempts
      await supabaseAdmin
        .from('rate_limit_attempts')
        .delete()
        .lt('timestamp', cutoff.toISOString());

      // Clean up expired brute force records
      await supabaseAdmin
        .from('brute_force_protection')
        .delete()
        .or(`locked_until.lt.${new Date().toISOString()},last_attempt_at.lt.${cutoff.toISOString()}`);

      console.log('Rate limit cleanup completed');
    } catch (error) {
      console.error('Rate limit cleanup error:', error);
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Helper functions for common rate limit scenarios
export const checkLoginRateLimit = (request: NextRequest, userId?: string) => {
  const identifier = rateLimiter.getIdentifierFromRequest(request, 'combined', userId);
  return rateLimiter.checkRateLimit(identifier, 'login');
};

export const checkRegisterRateLimit = (request: NextRequest) => {
  const identifier = rateLimiter.getIdentifierFromRequest(request, 'ip');
  return rateLimiter.checkRateLimit(identifier, 'register');
};

export const checkPasswordResetRateLimit = (request: NextRequest) => {
  const identifier = rateLimiter.getIdentifierFromRequest(request, 'ip');
  return rateLimiter.checkRateLimit(identifier, 'passwordReset');
};

export const checkAPIRateLimit = (request: NextRequest, userId?: string) => {
  const identifier = rateLimiter.getIdentifierFromRequest(request, userId ? 'user' : 'ip', userId);
  return rateLimiter.checkRateLimit(identifier, 'api');
};