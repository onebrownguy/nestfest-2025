/**
 * Base Service Abstract Class
 * Provides common functionality for all external service integrations
 */

import { config, ServiceConfig } from './config';

export interface RetryOptions {
  attempts: number;
  delay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    requestId?: string;
    duration?: number;
    retryCount?: number;
    timestamp: string;
  };
}

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export abstract class BaseService {
  protected config: ServiceConfig;
  protected serviceName: string;
  private circuitBreakerState: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;

  constructor(serviceName: string, serviceConfig: ServiceConfig) {
    this.serviceName = serviceName;
    this.config = serviceConfig;
  }

  /**
   * Execute operation with retry logic and circuit breaker
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    options?: Partial<RetryOptions>
  ): Promise<ServiceResponse<T>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    const retryOptions: RetryOptions = {
      attempts: this.config.retryAttempts,
      delay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      retryCondition: (error) => this.isRetryableError(error),
      ...options
    };

    // Check circuit breaker
    if (!this.shouldExecute()) {
      return {
        success: false,
        error: 'Service temporarily unavailable (circuit breaker open)',
        metadata: {
          requestId,
          duration: Date.now() - startTime,
          retryCount: 0,
          timestamp: new Date().toISOString()
        }
      };
    }

    let lastError: any;
    let retryCount = 0;

    for (let attempt = 0; attempt < retryOptions.attempts; attempt++) {
      try {
        const result = await Promise.race([
          operation(),
          this.createTimeoutPromise(this.config.timeout)
        ]);

        // Success - update circuit breaker
        this.onSuccess();

        return {
          success: true,
          data: result,
          metadata: {
            requestId,
            duration: Date.now() - startTime,
            retryCount,
            timestamp: new Date().toISOString()
          }
        };

      } catch (error) {
        lastError = error;
        retryCount = attempt + 1;

        // Log the error
        this.logError(error, requestId, attempt + 1);

        // Check if we should retry
        if (
          attempt < retryOptions.attempts - 1 &&
          retryOptions.retryCondition?.(error)
        ) {
          const delay = Math.min(
            retryOptions.delay * Math.pow(retryOptions.backoffFactor, attempt),
            retryOptions.maxDelay
          );
          await this.sleep(delay);
          continue;
        }

        // Final failure - update circuit breaker
        this.onFailure();
        break;
      }
    }

    return {
      success: false,
      error: this.formatError(lastError),
      metadata: {
        requestId,
        duration: Date.now() - startTime,
        retryCount,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Circuit Breaker Logic
   */
  private shouldExecute(): boolean {
    const now = Date.now();
    
    switch (this.circuitBreakerState) {
      case CircuitBreakerState.CLOSED:
        return true;
        
      case CircuitBreakerState.OPEN:
        if (now - this.lastFailureTime >= 30000) { // 30 seconds recovery timeout
          this.circuitBreakerState = CircuitBreakerState.HALF_OPEN;
          this.successCount = 0;
          return true;
        }
        return false;
        
      case CircuitBreakerState.HALF_OPEN:
        return true;
        
      default:
        return true;
    }
  }

  private onSuccess(): void {
    if (this.circuitBreakerState === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) { // 3 successful calls to close circuit
        this.circuitBreakerState = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
      }
    } else {
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= 5) { // 5 failures to open circuit
      this.circuitBreakerState = CircuitBreakerState.OPEN;
    }
  }

  /**
   * Utility Methods
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
      return true;
    }

    // HTTP errors
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode;
      return status >= 500 || status === 408 || status === 429;
    }

    // Timeout errors
    if (error.message?.includes('timeout')) {
      return true;
    }

    return false;
  }

  private formatError(error: any): string {
    if (error.message) {
      return error.message;
    }
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'Unknown error occurred';
  }

  private logError(error: any, requestId: string, attempt: number): void {
    const errorInfo = {
      service: this.serviceName,
      requestId,
      attempt,
      error: this.formatError(error),
      timestamp: new Date().toISOString(),
      circuitBreakerState: this.circuitBreakerState
    };

    if (this.config.environment === 'production') {
      // In production, use proper logging service
      console.error(`[${this.serviceName}] Error:`, errorInfo);
    } else {
      console.error(`[${this.serviceName}] Error:`, errorInfo);
    }
  }

  /**
   * Health Check
   */
  public getHealthStatus() {
    return {
      service: this.serviceName,
      enabled: this.config.enabled,
      circuitBreakerState: this.circuitBreakerState,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      environment: this.config.environment
    };
  }

  /**
   * Rate Limiting Helper
   */
  protected async checkRateLimit(identifier: string): Promise<boolean> {
    if (!this.config.rateLimit) {
      return true;
    }

    // This would integrate with Redis for distributed rate limiting
    // For now, we'll implement a simple in-memory rate limiter
    const key = `${this.serviceName}:${identifier}`;
    
    // This is a placeholder - in production, use Redis-based rate limiting
    return true;
  }

  /**
   * Abstract methods to be implemented by concrete services
   */
  abstract initialize(): Promise<void>;
  abstract validateConfiguration(): { valid: boolean; errors: string[] };
}