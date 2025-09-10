/**
 * Comprehensive Audit Logging System for NestFest
 * 
 * Provides detailed audit trails for security events, user actions,
 * and system changes with structured logging and compliance features.
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../supabase/client';
import { UserRole } from '@/types';

export interface AuditEvent {
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security';
  outcome: 'success' | 'failure' | 'error';
}

export interface SecurityEvent {
  userId?: string;
  sessionId?: string;
  eventType: 'login_success' | 'login_failure' | 'logout' | 'password_change' | 'mfa_enabled' | 'mfa_disabled' | 
           'account_locked' | 'suspicious_activity' | 'token_refresh' | 'permission_escalation' |
           'brute_force_attempt' | 'rate_limit_exceeded' | 'unauthorized_access';
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface ComplianceEvent {
  userId: string;
  action: 'data_export' | 'data_deletion' | 'consent_given' | 'consent_withdrawn' | 'data_access_request';
  dataTypes: string[];
  legalBasis?: string;
  retentionPeriod?: string;
  processingPurpose: string;
  details: Record<string, any>;
  timestamp: Date;
}

export class AuditLogger {
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  /**
   * Log general audit event
   */
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      await this.insertAuditLog({
        user_id: event.userId,
        session_id: event.sessionId,
        action: event.action,
        resource: event.resource,
        resource_id: event.resourceId,
        details: event.details,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        timestamp: event.timestamp.toISOString(),
        severity: event.severity,
        category: event.category,
        outcome: event.outcome
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
      // In production, you might want to send to a backup logging service
    }
  }

  /**
   * Log security-specific event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await this.insertSecurityEvent({
        user_id: event.userId,
        session_id: event.sessionId,
        event_type: event.eventType,
        details: event.details,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        risk_level: event.riskLevel,
        timestamp: event.timestamp.toISOString()
      });

      // Also log as general audit event for comprehensive tracking
      await this.logEvent({
        userId: event.userId,
        sessionId: event.sessionId,
        action: event.eventType,
        resource: 'security',
        details: event.details,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        timestamp: event.timestamp,
        severity: this.mapRiskToSeverity(event.riskLevel),
        category: 'security',
        outcome: 'success' // Security events are logged regardless of outcome
      });

      // Send alerts for high-risk security events
      if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
        await this.sendSecurityAlert(event);
      }

    } catch (error) {
      console.error('Security event logging failed:', error);
    }
  }

  /**
   * Log compliance-related event (GDPR, privacy, etc.)
   */
  async logComplianceEvent(event: ComplianceEvent): Promise<void> {
    try {
      await supabaseAdmin
        .from('compliance_log')
        .insert({
          user_id: event.userId,
          action: event.action,
          data_types: event.dataTypes,
          legal_basis: event.legalBasis,
          retention_period: event.retentionPeriod,
          processing_purpose: event.processingPurpose,
          details: event.details,
          timestamp: event.timestamp.toISOString()
        });
    } catch (error) {
      console.error('Compliance logging failed:', error);
    }
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    userId: string | null,
    action: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'registration',
    request: NextRequest,
    details: Record<string, any> = {}
  ): Promise<void> {
    const ipAddress = this.extractIPAddress(request);
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const severity = action.includes('failure') ? 'medium' : 'low';
    const riskLevel = action.includes('failure') ? 'medium' : 'low';

    await Promise.all([
      this.logEvent({
        userId: userId || undefined,
        action,
        resource: 'authentication',
        details,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        severity,
        category: 'authentication',
        outcome: action.includes('failure') ? 'failure' : 'success'
      }),
      this.logSecurityEvent({
        userId: userId || undefined,
        eventType: action as any,
        details,
        ipAddress,
        userAgent,
        riskLevel,
        timestamp: new Date()
      })
    ]);
  }

  /**
   * Log authorization events (permission checks, access attempts)
   */
  async logAuthorizationEvent(
    userId: string,
    action: string,
    resource: string,
    resourceId: string | null,
    allowed: boolean,
    request: NextRequest,
    details: Record<string, any> = {}
  ): Promise<void> {
    const ipAddress = this.extractIPAddress(request);
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await this.logEvent({
      userId,
      action: `access_${action}`,
      resource,
      resourceId: resourceId || undefined,
      details: {
        ...details,
        access_granted: allowed,
        requested_action: action
      },
      ipAddress,
      userAgent,
      timestamp: new Date(),
      severity: allowed ? 'low' : 'medium',
      category: 'authorization',
      outcome: allowed ? 'success' : 'failure'
    });

    // Log unauthorized access attempts as security events
    if (!allowed) {
      await this.logSecurityEvent({
        userId,
        eventType: 'unauthorized_access',
        details: {
          resource,
          resourceId,
          action,
          ...details
        },
        ipAddress,
        userAgent,
        riskLevel: 'medium',
        timestamp: new Date()
      });
    }
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'read' | 'export' | 'search',
    request: NextRequest,
    details: Record<string, any> = {}
  ): Promise<void> {
    const ipAddress = this.extractIPAddress(request);
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await this.logEvent({
      userId,
      action: `data_${action}`,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      severity: action === 'export' ? 'medium' : 'low',
      category: 'data_access',
      outcome: 'success'
    });
  }

  /**
   * Log data modification events
   */
  async logDataModification(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'create' | 'update' | 'delete',
    oldData: any,
    newData: any,
    request: NextRequest
  ): Promise<void> {
    const ipAddress = this.extractIPAddress(request);
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await this.logEvent({
      userId,
      action: `data_${action}`,
      resource,
      resourceId,
      details: {
        old_data: action !== 'create' ? oldData : null,
        new_data: action !== 'delete' ? newData : null,
        data_diff: action === 'update' ? this.generateDataDiff(oldData, newData) : null
      },
      ipAddress,
      userAgent,
      timestamp: new Date(),
      severity: action === 'delete' ? 'medium' : 'low',
      category: 'data_modification',
      outcome: 'success'
    });
  }

  /**
   * Log administrative actions
   */
  async logAdminAction(
    adminUserId: string,
    action: string,
    targetUserId: string | null,
    details: Record<string, any>,
    request: NextRequest
  ): Promise<void> {
    const ipAddress = this.extractIPAddress(request);
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await this.logEvent({
      userId: adminUserId,
      action: `admin_${action}`,
      resource: 'administration',
      resourceId: targetUserId || undefined,
      details: {
        ...details,
        target_user_id: targetUserId
      },
      ipAddress,
      userAgent,
      timestamp: new Date(),
      severity: 'high',
      category: 'system',
      outcome: 'success'
    });
  }

  /**
   * Search audit logs with filters
   */
  async searchAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    category?: string;
    severity?: string;
    outcome?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    try {
      let query = supabaseAdmin
        .from('audit_log')
        .select('*');

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.action) {
        query = query.ilike('action', `%${filters.action}%`);
      }
      if (filters.resource) {
        query = query.eq('resource', filters.resource);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters.outcome) {
        query = query.eq('outcome', filters.outcome);
      }
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }

      query = query
        .order('timestamp', { ascending: false })
        .limit(filters.limit || 100);

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Audit log search error:', error);
      return [];
    }
  }

  /**
   * Generate audit report for compliance
   */
  async generateAuditReport(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<{
    summary: Record<string, number>;
    events: any[];
    securityEvents: any[];
    complianceEvents: any[];
  }> {
    try {
      const [auditEvents, securityEvents, complianceEvents] = await Promise.all([
        this.getAuditEvents(startDate, endDate, userId),
        this.getSecurityEvents(startDate, endDate, userId),
        this.getComplianceEvents(startDate, endDate, userId)
      ]);

      const summary = this.generateAuditSummary(auditEvents);

      return {
        summary,
        events: auditEvents,
        securityEvents,
        complianceEvents
      };
    } catch (error) {
      console.error('Audit report generation error:', error);
      throw error;
    }
  }

  /**
   * Insert audit log with retry logic
   */
  private async insertAuditLog(data: any, retryCount = 0): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('audit_log')
        .insert(data);

      if (error) {
        throw error;
      }
    } catch (error) {
      if (retryCount < this.maxRetries) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.insertAuditLog(data, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Insert security event
   */
  private async insertSecurityEvent(data: any): Promise<void> {
    const { error } = await supabaseAdmin
      .from('security_events')
      .insert(data);

    if (error) {
      throw error;
    }
  }

  /**
   * Extract IP address from request
   */
  private extractIPAddress(request: NextRequest): string {
    return request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           '127.0.0.1';
  }

  /**
   * Map risk level to severity
   */
  private mapRiskToSeverity(riskLevel: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (riskLevel) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  /**
   * Send security alert for high-risk events
   */
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    try {
      // In production, integrate with alerting system (email, Slack, PagerDuty, etc.)
      console.warn('SECURITY ALERT:', {
        eventType: event.eventType,
        userId: event.userId,
        riskLevel: event.riskLevel,
        ipAddress: event.ipAddress,
        timestamp: event.timestamp,
        details: event.details
      });

      // Store alert in database
      await supabaseAdmin
        .from('security_alerts')
        .insert({
          event_type: event.eventType,
          user_id: event.userId,
          risk_level: event.riskLevel,
          details: event.details,
          ip_address: event.ipAddress,
          timestamp: event.timestamp.toISOString(),
          status: 'open'
        });
    } catch (error) {
      console.error('Security alert failed:', error);
    }
  }

  /**
   * Generate data diff for updates
   */
  private generateDataDiff(oldData: any, newData: any): Record<string, { old: any; new: any }> {
    const diff: Record<string, { old: any; new: any }> = {};

    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

    for (const key of allKeys) {
      if (oldData?.[key] !== newData?.[key]) {
        diff[key] = {
          old: oldData?.[key],
          new: newData?.[key]
        };
      }
    }

    return diff;
  }

  /**
   * Get audit events for report
   */
  private async getAuditEvents(startDate: Date, endDate: Date, userId?: string) {
    let query = supabaseAdmin
      .from('audit_log')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get security events for report
   */
  private async getSecurityEvents(startDate: Date, endDate: Date, userId?: string) {
    let query = supabaseAdmin
      .from('security_events')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get compliance events for report
   */
  private async getComplianceEvents(startDate: Date, endDate: Date, userId?: string) {
    let query = supabaseAdmin
      .from('compliance_log')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Generate audit summary statistics
   */
  private generateAuditSummary(events: any[]): Record<string, number> {
    const summary: Record<string, number> = {
      total_events: events.length,
      success_count: 0,
      failure_count: 0,
      error_count: 0,
      by_category: {},
      by_severity: {},
      by_action: {}
    };

    events.forEach(event => {
      // Count by outcome
      summary[`${event.outcome}_count`]++;

      // Count by category
      if (!summary.by_category[event.category]) {
        summary.by_category[event.category] = 0;
      }
      summary.by_category[event.category]++;

      // Count by severity
      if (!summary.by_severity[event.severity]) {
        summary.by_severity[event.severity] = 0;
      }
      summary.by_severity[event.severity]++;

      // Count by action
      if (!summary.by_action[event.action]) {
        summary.by_action[event.action] = 0;
      }
      summary.by_action[event.action]++;
    });

    return summary;
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();