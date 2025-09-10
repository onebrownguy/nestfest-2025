/**
 * Session Management for NestFest Authentication
 * 
 * Handles user sessions, device tracking, concurrent session limits,
 * and session security with Redis-backed storage.
 */

import crypto from 'crypto';
import { supabaseAdmin } from '../supabase/client';
import { UserRole } from '@/types';

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  refreshToken: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  isActive: boolean;
  lastActivityAt: Date;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  revokedReason?: string;
}

export interface DeviceInfo {
  fingerprint: string;
  userAgent: string;
  platform: string;
  browser: string;
  version: string;
  isMobile: boolean;
  screenResolution?: string;
  timezone?: string;
}

export interface SessionSecurityEvent {
  sessionId: string;
  userId: string;
  eventType: 'login' | 'logout' | 'refresh' | 'suspicious_activity' | 'concurrent_limit' | 'revoked';
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export class SessionManager {
  private readonly sessionExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly activityTimeout = 30 * 60 * 1000; // 30 minutes
  private readonly maxConcurrentSessions = 5;
  private readonly suspiciousActivityThreshold = 3;

  /**
   * Create a new user session
   */
  async createSession(
    userId: string,
    refreshToken: string,
    deviceInfo: DeviceInfo,
    ipAddress: string
  ): Promise<UserSession> {
    const sessionId = crypto.randomUUID();
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.sessionExpiry);

    // Check concurrent session limits
    await this.enforceConcurrentSessionLimits(userId);

    // Create session record
    const session: UserSession = {
      id: sessionId,
      userId,
      sessionToken,
      refreshToken,
      deviceFingerprint: deviceInfo.fingerprint,
      ipAddress,
      userAgent: deviceInfo.userAgent,
      location: await this.getLocationFromIP(ipAddress),
      isActive: true,
      lastActivityAt: now,
      expiresAt,
      createdAt: now
    };

    // Store in database
    const { error } = await supabaseAdmin
      .from('user_sessions')
      .insert({
        id: session.id,
        user_id: session.userId,
        session_token_hash: this.hashSessionToken(session.sessionToken),
        refresh_token_hash: this.hashSessionToken(session.refreshToken),
        device_fingerprint: session.deviceFingerprint,
        ip_address: session.ipAddress,
        user_agent: session.userAgent,
        location: session.location,
        is_active: session.isActive,
        last_activity_at: session.lastActivityAt.toISOString(),
        expires_at: session.expiresAt.toISOString()
      });

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    // Log security event
    await this.logSecurityEvent({
      sessionId: session.id,
      userId,
      eventType: 'login',
      ipAddress,
      userAgent: deviceInfo.userAgent,
      timestamp: now,
      details: {
        deviceFingerprint: deviceInfo.fingerprint,
        platform: deviceInfo.platform,
        browser: deviceInfo.browser
      }
    });

    return session;
  }

  /**
   * Validate and refresh session
   */
  async validateSession(sessionToken: string): Promise<UserSession | null> {
    const hashedToken = this.hashSessionToken(sessionToken);

    const { data: sessionData, error } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('session_token_hash', hashedToken)
      .eq('is_active', true)
      .single();

    if (error || !sessionData) {
      return null;
    }

    const session = this.mapDatabaseToSession(sessionData);

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await this.revokeSession(session.id, 'expired');
      return null;
    }

    // Check activity timeout
    const timeSinceActivity = Date.now() - session.lastActivityAt.getTime();
    if (timeSinceActivity > this.activityTimeout) {
      await this.updateSessionActivity(session.id);
    }

    return session;
  }

  /**
   * Update session activity timestamp
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_sessions')
      .update({
        last_activity_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string, reason: string = 'user_logout'): Promise<void> {
    const { data: sessionData } = await supabaseAdmin
      .from('user_sessions')
      .select('user_id, ip_address, user_agent')
      .eq('id', sessionId)
      .single();

    const { error } = await supabaseAdmin
      .from('user_sessions')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_reason: reason
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to revoke session: ${error.message}`);
    }

    // Log security event
    if (sessionData) {
      await this.logSecurityEvent({
        sessionId,
        userId: sessionData.user_id,
        eventType: 'logout',
        ipAddress: sessionData.ip_address,
        userAgent: sessionData.user_agent,
        timestamp: new Date(),
        details: { reason }
      });
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    let query = supabaseAdmin
      .from('user_sessions')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_reason: 'all_sessions_revoked'
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (exceptSessionId) {
      query = query.neq('id', exceptSessionId);
    }

    const { error } = await query;

    if (error) {
      throw new Error(`Failed to revoke user sessions: ${error.message}`);
    }

    // Log security event
    await this.logSecurityEvent({
      sessionId: exceptSessionId || 'system',
      userId,
      eventType: 'revoked',
      ipAddress: '0.0.0.0',
      userAgent: 'system',
      timestamp: new Date(),
      details: { reason: 'all_sessions_revoked', exceptSessionId }
    });
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<UserSession[]> {
    const { data: sessions, error } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user sessions: ${error.message}`);
    }

    return sessions.map(this.mapDatabaseToSession);
  }

  /**
   * Enforce concurrent session limits
   */
  async enforceConcurrentSessionLimits(userId: string): Promise<void> {
    const activeSessions = await this.getUserSessions(userId);

    if (activeSessions.length >= this.maxConcurrentSessions) {
      // Revoke oldest sessions to make room
      const sessionsToRevoke = activeSessions
        .sort((a, b) => a.lastActivityAt.getTime() - b.lastActivityAt.getTime())
        .slice(0, activeSessions.length - this.maxConcurrentSessions + 1);

      for (const session of sessionsToRevoke) {
        await this.revokeSession(session.id, 'concurrent_limit_exceeded');
      }

      // Log security event
      await this.logSecurityEvent({
        sessionId: 'system',
        userId,
        eventType: 'concurrent_limit',
        ipAddress: '0.0.0.0',
        userAgent: 'system',
        timestamp: new Date(),
        details: { 
          revokedSessions: sessionsToRevoke.length,
          maxConcurrentSessions: this.maxConcurrentSessions
        }
      });
    }
  }

  /**
   * Detect suspicious session activity
   */
  async detectSuspiciousActivity(
    userId: string,
    newDeviceInfo: DeviceInfo,
    ipAddress: string
  ): Promise<{ isSuspicious: boolean; reasons: string[] }> {
    const reasons: string[] = [];
    let isSuspicious = false;

    // Get recent sessions for comparison
    const { data: recentSessions } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentSessions && recentSessions.length > 0) {
      // Check for rapid location changes
      const uniqueLocations = new Set(recentSessions.map(s => s.location).filter(Boolean));
      if (uniqueLocations.size > 3) {
        reasons.push('Multiple locations in short time');
        isSuspicious = true;
      }

      // Check for unusual device patterns
      const uniqueFingerprints = new Set(recentSessions.map(s => s.device_fingerprint));
      if (uniqueFingerprints.size > 5) {
        reasons.push('Multiple devices in short time');
        isSuspicious = true;
      }

      // Check for rapid session creation
      const recentSessionCount = recentSessions.filter(
        s => new Date(s.created_at).getTime() > Date.now() - 60 * 60 * 1000
      ).length;

      if (recentSessionCount > this.suspiciousActivityThreshold) {
        reasons.push('Rapid session creation');
        isSuspicious = true;
      }
    }

    // Check for known malicious IP patterns (simplified)
    if (this.isKnownMaliciousIP(ipAddress)) {
      reasons.push('Known malicious IP address');
      isSuspicious = true;
    }

    if (isSuspicious) {
      await this.logSecurityEvent({
        sessionId: 'system',
        userId,
        eventType: 'suspicious_activity',
        ipAddress,
        userAgent: newDeviceInfo.userAgent,
        timestamp: new Date(),
        details: { reasons, deviceFingerprint: newDeviceInfo.fingerprint }
      });
    }

    return { isSuspicious, reasons };
  }

  /**
   * Generate device fingerprint
   */
  generateDeviceFingerprint(userAgent: string, additionalData: Record<string, any> = {}): string {
    const fingerprintData = {
      userAgent,
      ...additionalData
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprintData))
      .digest('hex');
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_sessions')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_reason: 'expired'
      })
      .eq('is_active', true)
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Failed to cleanup expired sessions:', error);
    }
  }

  /**
   * Hash session token for secure storage
   */
  private hashSessionToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Map database record to session object
   */
  private mapDatabaseToSession(data: any): UserSession {
    return {
      id: data.id,
      userId: data.user_id,
      sessionToken: '', // Don't expose actual token
      refreshToken: '', // Don't expose actual token
      deviceFingerprint: data.device_fingerprint,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      location: data.location,
      isActive: data.is_active,
      lastActivityAt: data.last_activity_at ? new Date(data.last_activity_at) : new Date(data.created_at || Date.now()),
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at),
      revokedAt: data.revoked_at ? new Date(data.revoked_at) : undefined,
      revokedReason: data.revoked_reason
    };
  }

  /**
   * Get approximate location from IP address
   */
  private async getLocationFromIP(ipAddress: string): Promise<string | undefined> {
    try {
      // In production, you would use a proper geolocation service
      // For now, return undefined
      return undefined;
    } catch (error) {
      console.error('Failed to get location from IP:', error);
      return undefined;
    }
  }

  /**
   * Check if IP address is known to be malicious
   */
  private isKnownMaliciousIP(ipAddress: string): boolean {
    // In production, check against threat intelligence feeds
    // For now, just return false
    return false;
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: SessionSecurityEvent): Promise<void> {
    // Security events logging disabled - table doesn't exist yet
    // TODO: Re-enable when security_events table is created
    return;
    
    /* DISABLED - security_events table missing
    try {
      const { error } = await supabaseAdmin
        .from('security_events')
        .insert({
          session_id: event.sessionId,
          user_id: event.userId,
          event_type: event.eventType,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          timestamp: event.timestamp.toISOString(),
          details: event.details || {}
        });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Security event logging error:', error);
    }
    */
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();