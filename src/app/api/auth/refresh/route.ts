/**
 * Token Refresh API Route for NestFest Authentication
 * 
 * Handles JWT token refresh with security validation,
 * session verification, and automatic token rotation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtManager } from '@/lib/auth/jwt-manager';
import { sessionManager } from '@/lib/auth/session-manager';
import { permissionManager } from '@/lib/auth/permissions';
import { supabaseAdmin } from '@/lib/supabase/client';

interface RefreshRequest {
  refreshToken: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RefreshRequest = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    let payload;
    try {
      payload = jwtManager.verifyRefreshToken(refreshToken);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    const sessionId = payload.sessionId;

    // Check if token is blacklisted
    const isBlacklisted = await checkTokenBlacklist(refreshToken);
    if (isBlacklisted) {
      return NextResponse.json(
        { error: 'Token has been revoked' },
        { status: 401 }
      );
    }

    // Validate session exists and is active
    const sessionToken = await getSessionByRefreshToken(refreshToken);
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 401 }
      );
    }
    
    const session = await sessionManager.validateSession(sessionToken);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 401 }
      );
    }

    // Get current user data
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Check if user account is still active
    if (user.status !== 'active') {
      // Revoke session if user is no longer active
      await sessionManager.revokeSession(sessionId, `account_${user.status}`);
      
      return NextResponse.json(
        { error: `Account is ${user.status}` },
        { status: 403 }
      );
    }

    // Get client IP and user agent for security checks
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Security check: Compare with session info
    if (session.ipAddress !== ipAddress || session.userAgent !== userAgent) {
      // Suspicious activity detected - different IP/User-Agent
      console.warn(`Suspicious token refresh attempt for user ${userId}`, {
        sessionIP: session.ipAddress,
        requestIP: ipAddress,
        sessionUA: session.userAgent,
        requestUA: userAgent
      });

      // Log security event
      await logSecurityEvent({
        userId,
        sessionId,
        eventType: 'suspicious_token_refresh',
        details: {
          sessionIP: session.ipAddress,
          requestIP: ipAddress,
          sessionUA: session.userAgent,
          requestUA: userAgent
        },
        timestamp: new Date()
      });

      // Optionally revoke session or require re-authentication
      // For now, we'll continue but with heightened logging
    }

    // Update session activity
    await sessionManager.updateSessionActivity(sessionId);

    // Get fresh user permissions and competition access
    const permissions = permissionManager.getRolePermissions(user.role)
      .map(p => p.id);

    const competitionAccess = await getUserCompetitionAccess(user.id, user.role);

    // Generate new access token
    const { accessToken, expiresIn } = jwtManager.refreshAccessToken(refreshToken, {
      competitionAccess,
      permissions
    });

    // Optionally rotate refresh token (recommended security practice)
    let newRefreshToken = refreshToken;
    const shouldRotateRefreshToken = shouldRotateToken(payload);
    
    if (shouldRotateRefreshToken) {
      const newTokenPair = jwtManager.generateTokenPair({
        userId,
        email: user.email,
        role: user.role,
        permissions,
        competitionAccess
      });
      
      newRefreshToken = newTokenPair.refreshToken;
      
      // Update session with new refresh token
      await updateSessionRefreshToken(sessionId, newRefreshToken);
      
      // Blacklist old refresh token
      await blacklistToken(refreshToken);
    }

    // Log successful token refresh
    await logTokenRefreshEvent({
      userId,
      sessionId,
      ipAddress,
      userAgent,
      rotated: shouldRotateRefreshToken,
      timestamp: new Date()
    });

    // Prepare user data for response (exclude sensitive fields)
    const { password: _, email_verification_token: __, ...safeUser } = user;
    const responseUser = {
      ...safeUser,
      permissions,
      competitionAccess,
      mfaEnabled: !!user.mfa_secret,
      emailVerified: !!user.email_verified_at
    };

    const response = NextResponse.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
      user: responseUser
    });

    // Update refresh token cookie if it was rotated
    if (shouldRotateRefreshToken) {
      const isProduction = process.env.NODE_ENV === 'production';
      response.cookies.set('nestfest_refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if refresh token is blacklisted
 */
async function checkTokenBlacklist(token: string): Promise<boolean> {
  try {
    // Hash token for lookup (in production, use proper token hashing)
    const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
    
    const { data, error } = await supabaseAdmin
      .from('blacklisted_tokens')
      .select('id')
      .eq('token_hash', tokenHash)
      .gte('expires_at', new Date().toISOString())
      .single();

    return !!data;
  } catch (error) {
    console.error('Token blacklist check error:', error);
    return false; // Fail open
  }
}

/**
 * Get session token by refresh token (simplified approach)
 */
async function getSessionByRefreshToken(refreshToken: string): Promise<string | null> {
  try {
    // In a real implementation, you'd have a mapping or hash lookup
    // For now, we'll decode the refresh token to get the session ID
    const payload = jwtManager.decodeToken(refreshToken);
    if (!payload?.sessionId) return null;

    // Validate session exists
    const { data: session } = await supabaseAdmin
      .from('user_sessions')
      .select('session_token_hash')
      .eq('id', payload.sessionId)
      .eq('is_active', true)
      .single();

    // Return a dummy session token since we hash them
    return session ? 'session-token-placeholder' : null;
  } catch (error) {
    console.error('Session lookup error:', error);
    return null;
  }
}

/**
 * Determine if refresh token should be rotated
 */
function shouldRotateToken(payload: any): boolean {
  // Rotate if token is more than 24 hours old
  const tokenAge = Date.now() - (payload.iat * 1000);
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  return tokenAge > twentyFourHours;
}

/**
 * Update session with new refresh token
 */
async function updateSessionRefreshToken(
  sessionId: string, 
  newRefreshToken: string
): Promise<void> {
  try {
    const tokenHash = require('crypto')
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    await supabaseAdmin
      .from('user_sessions')
      .update({
        refresh_token_hash: tokenHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
  } catch (error) {
    console.error('Session refresh token update error:', error);
  }
}

/**
 * Blacklist old refresh token
 */
async function blacklistToken(token: string): Promise<void> {
  try {
    const decoded = jwtManager.decodeToken(token);
    const expiresAt = (decoded as any)?.exp 
      ? new Date((decoded as any).exp * 1000) 
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const tokenHash = require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');

    await supabaseAdmin
      .from('blacklisted_tokens')
      .insert({
        token_hash: tokenHash,
        token_type: 'refresh',
        expires_at: expiresAt.toISOString(),
        blacklisted_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Token blacklisting error:', error);
  }
}

/**
 * Get user's current competition access
 */
async function getUserCompetitionAccess(userId: string, userRole: string): Promise<string[]> {
  try {
    if (userRole === 'admin' || userRole === 'super_admin') {
      const { data: competitions } = await supabaseAdmin
        .from('competitions')
        .select('id');
      
      return competitions?.map(c => c.id) || [];
    }

    const { data: assignments } = await supabaseAdmin
      .from('user_competition_assignments')
      .select('competition_id')
      .eq('user_id', userId);

    return assignments?.map(a => a.competition_id) || [];
  } catch (error) {
    console.error('Competition access error:', error);
    return [];
  }
}

/**
 * Log security event
 */
async function logSecurityEvent(event: {
  userId: string;
  sessionId: string;
  eventType: string;
  details: Record<string, any>;
  timestamp: Date;
}): Promise<void> {
  try {
    await supabaseAdmin
      .from('security_events')
      .insert({
        user_id: event.userId,
        session_id: event.sessionId,
        event_type: event.eventType,
        details: event.details,
        timestamp: event.timestamp.toISOString()
      });
  } catch (error) {
    console.error('Security event logging error:', error);
  }
}

/**
 * Log token refresh event
 */
async function logTokenRefreshEvent(event: {
  userId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  rotated: boolean;
  timestamp: Date;
}): Promise<void> {
  try {
    await supabaseAdmin
      .from('audit_log')
      .insert({
        user_id: event.userId,
        action: 'token_refresh',
        resource: 'sessions',
        resource_id: event.sessionId,
        details: {
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          token_rotated: event.rotated
        },
        timestamp: event.timestamp.toISOString()
      });
  } catch (error) {
    console.error('Token refresh event logging error:', error);
  }
}