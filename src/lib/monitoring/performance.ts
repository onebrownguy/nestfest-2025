/**
 * Performance Monitoring Utilities
 * Track API response times, user interactions, and system performance
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface APIMetric extends PerformanceMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  userAgent?: string;
  userId?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private apiMetrics: APIMetric[] = [];

  /**
   * Start timing an operation
   */
  startTimer(name: string): () => PerformanceMetric {
    const startTime = performance.now();
    
    return (metadata?: Record<string, any>) => {
      const endTime = performance.now();
      const metric: PerformanceMetric = {
        name,
        value: endTime - startTime,
        timestamp: Date.now(),
        metadata
      };
      
      this.metrics.push(metric);
      
      // Keep only last 1000 metrics in memory
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }
      
      return metric;
    };
  }

  /**
   * Track API response time and details
   */
  trackAPICall(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    userAgent?: string,
    userId?: string
  ): APIMetric {
    const metric: APIMetric = {
      name: `api_${method.toLowerCase()}_${endpoint.replace(/\//g, '_')}`,
      value: responseTime,
      timestamp: Date.now(),
      endpoint,
      method,
      statusCode,
      userAgent,
      userId,
      metadata: {
        endpoint,
        method,
        statusCode,
        userAgent,
        userId
      }
    };

    this.apiMetrics.push(metric);
    
    // Keep only last 1000 API metrics in memory
    if (this.apiMetrics.length > 1000) {
      this.apiMetrics = this.apiMetrics.slice(-1000);
    }

    // Log slow API calls (>2 seconds)
    if (responseTime > 2000) {
      console.warn('Slow API call detected:', {
        endpoint,
        method,
        responseTime: `${responseTime.toFixed(2)}ms`,
        statusCode
      });
    }

    return metric;
  }

  /**
   * Track Web Vitals and Core Web Vitals
   */
  trackWebVital(name: string, value: number, id?: string): void {
    const metric: PerformanceMetric = {
      name: `webvital_${name.toLowerCase()}`,
      value,
      timestamp: Date.now(),
      metadata: { id, vital: true }
    };

    this.metrics.push(metric);

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Send to Vercel Analytics Web Vitals
      window.va?.track('WebVital', {
        name,
        value,
        id
      });
    }
  }

  /**
   * Get performance summary
   */
  getSummary(timeWindowMs: number = 300000): {
    totalMetrics: number;
    avgResponseTime: number;
    slowestAPI: APIMetric | null;
    errorRate: number;
    recentMetrics: PerformanceMetric[];
  } {
    const cutoffTime = Date.now() - timeWindowMs;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    const recentAPIMetrics = this.apiMetrics.filter(m => m.timestamp > cutoffTime);

    const avgResponseTime = recentAPIMetrics.length > 0
      ? recentAPIMetrics.reduce((sum, m) => sum + m.value, 0) / recentAPIMetrics.length
      : 0;

    const slowestAPI = recentAPIMetrics.reduce((slowest, current) => 
      (!slowest || current.value > slowest.value) ? current : slowest, 
      null as APIMetric | null
    );

    const errors = recentAPIMetrics.filter(m => m.statusCode >= 400);
    const errorRate = recentAPIMetrics.length > 0 
      ? (errors.length / recentAPIMetrics.length) * 100 
      : 0;

    return {
      totalMetrics: recentMetrics.length,
      avgResponseTime,
      slowestAPI,
      errorRate,
      recentMetrics
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.apiMetrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): {
    metrics: PerformanceMetric[];
    apiMetrics: APIMetric[];
    summary: ReturnType<typeof this.getSummary>;
  } {
    return {
      metrics: [...this.metrics],
      apiMetrics: [...this.apiMetrics],
      summary: this.getSummary()
    };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Web Vitals reporting function
export function reportWebVitals(metric: any): void {
  performanceMonitor.trackWebVital(metric.name, metric.value, metric.id);
}

// API response time tracking middleware
export function createPerformanceMiddleware() {
  return function trackPerformance<T extends Function>(handler: T): T {
    return (async (...args: any[]) => {
      const timer = performanceMonitor.startTimer('api_call');
      const startTime = Date.now();
      
      try {
        const result = await handler(...args);
        const responseTime = Date.now() - startTime;
        
        // Extract request info if available
        const request = args[0];
        if (request && typeof request === 'object' && 'method' in request) {
          performanceMonitor.trackAPICall(
            request.url || 'unknown',
            request.method || 'unknown',
            result?.status || 200,
            responseTime,
            request.headers?.get?.('user-agent'),
            request.userId
          );
        }
        
        timer({ success: true, responseTime });
        return result;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        // Track failed API calls
        const request = args[0];
        if (request && typeof request === 'object' && 'method' in request) {
          performanceMonitor.trackAPICall(
            request.url || 'unknown',
            request.method || 'unknown',
            500,
            responseTime,
            request.headers?.get?.('user-agent'),
            request.userId
          );
        }
        
        timer({ success: false, error: error.message, responseTime });
        throw error;
      }
    }) as T;
  };
}

// Real User Monitoring (RUM) utilities
export const RUM = {
  /**
   * Track page load performance
   */
  trackPageLoad(pageName: string): void {
    if (typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    const metrics = {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      connection: navigation.connectEnd - navigation.connectStart,
      ttfb: navigation.responseStart - navigation.requestStart,
      download: navigation.responseEnd - navigation.responseStart,
      dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      load: navigation.loadEventEnd - navigation.loadEventStart,
      total: navigation.loadEventEnd - navigation.navigationStart
    };

    Object.entries(metrics).forEach(([name, value]) => {
      performanceMonitor.trackWebVital(`page_${name}`, value, pageName);
    });
  },

  /**
   * Track user interaction timing
   */
  trackInteraction(name: string, startTime?: number): void {
    const endTime = performance.now();
    const duration = startTime ? endTime - startTime : 0;
    
    performanceMonitor.trackWebVital(`interaction_${name}`, duration);
  },

  /**
   * Track resource loading performance
   */
  trackResources(): void {
    if (typeof window === 'undefined') return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    resources.forEach(resource => {
      const duration = resource.responseEnd - resource.startTime;
      const resourceType = resource.initiatorType || 'unknown';
      
      performanceMonitor.trackWebVital(
        `resource_${resourceType}`,
        duration,
        new URL(resource.name).pathname
      );
    });
  }
};

// Export types
export type { PerformanceMetric, APIMetric };