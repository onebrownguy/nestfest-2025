/**
 * Login API Route for NestFest Authentication
 * 
 * Handles user login with comprehensive security features including
 * rate limiting, brute force protection, and session management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtManager } from '@/lib/auth/jwt-manager';
import { passwordManager } from '@/lib/auth/password-manager';
import { sessionManager } from '@/lib/auth/session-manager';
import { permissionManager } from '@/lib/auth/permissions';
import { supabaseAdmin } from '@/lib/supabase/client';
import validator from 'validator';

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: {
    fingerprint: string;
    platform: string;
    userAgent: string;
  };
}

interface LoginAttempt {
  userId: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
  failureReason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password, rememberMe = false, deviceInfo } = body;

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const emailValidation = passwordManager.validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = passwordManager.normalizeEmail(email);
    
    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Rate limiting check
    const rateLimitResult = await checkLoginRateLimit(ipAddress);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { status: 429 }
      );
    }

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !user) {
      await logLoginAttempt({
        userId: 'unknown',
        ipAddress,
        userAgent,
        success: false,
        timestamp: new Date(),
        failureReason: 'user_not_found'
      });

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status !== 'active') {
      await logLoginAttempt({
        userId: user.id,
        ipAddress,
        userAgent,
        success: false,
        timestamp: new Date(),
        failureReason: `account_${user.status}`
      });

      return NextResponse.json(
        { error: `Account is ${user.status}` },
        { status: 403 }
      );
    }

    // Check for account lockout
    const lockoutResult = await checkAccountLockout(user.id);
    if (lockoutResult.isLocked) {
      return NextResponse.json(
        { 
          error: 'Account temporarily locked due to multiple failed attempts',
          retryAfter: lockoutResult.retryAfter 
        },
        { status: 423 }
      );
    }

    // Verify password
    const isPasswordValid = await passwordManager.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      await recordFailedAttempt(user.id);
      await logLoginAttempt({
        userId: user.id,
        ipAddress,
        userAgent,
        success: false,
        timestamp: new Date(),
        failureReason: 'invalid_password'
      });

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if password needs rehashing
    if (passwordManager.needsRehashing(user.password)) {
      const newHash = await passwordManager.hashPassword(password);
      await supabaseAdmin
        .from('users')
        .update({ password: newHash })
        .eq('id', user.id);
    }

    // Clear failed attempts on successful login
    await clearFailedAttempts(user.id);

    // Get user permissions
    const permissions = permissionManager.getRolePermissions(user.role)
      .map(p => p.id);

    // Get competition access (simplified - you might have more complex logic)
    const competitionAccess = await getUserCompetitionAccess(user.id, user.role);

    // Generate JWT tokens
    const tokenPair = jwtManager.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions,
      competitionAccess
    });

    // Create session
    const deviceInfoForSession = deviceInfo || {
      fingerprint: sessionManager.generateDeviceFingerprint(userAgent),
      platform: 'unknown',
      userAgent
    };

    const session = await sessionManager.createSession(
      user.id,
      tokenPair.refreshToken,
      deviceInfoForSession as any,
      ipAddress
    );

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ 
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    // Log successful login
    await logLoginAttempt({
      userId: user.id,
      ipAddress,
      userAgent,
      success: true,
      timestamp: new Date()
    });

    // Prepare user data for response (exclude sensitive fields)
    const { password: _, ...safeUser } = user;
    const responseUser = {
      ...safeUser,
      permissions,
      competitionAccess,
      mfaEnabled: !!user.mfa_secret,
      emailVerified: !!user.email_verified_at
    };

    const response = NextResponse.json({
      success: true,
      user: responseUser,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      sessionId: session.id,
      expiresIn: tokenPair.expiresIn
    });

    // Set secure cookies if remember me is enabled
    if (rememberMe) {
      const isProduction = process.env.NODE_ENV === 'production';
      
      response.cookies.set('nestfest_refresh_token', tokenPair.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check login rate limiting
 */
async function checkLoginRateLimit(ipAddress: string): Promise<{
  allowed: boolean;
  retryAfter?: number;
}> {
  try {
    // In production, implement Redis-based rate limiting
    // For now, implement basic database-based rate limiting
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const { data: attempts, error } = await supabaseAdmin
      .from('login_attempts')
      .select('id')
      .eq('ip_address', ipAddress)
      .eq('success', false)
      .gte('timestamp', fiveMinutesAgo.toISOString());

    if (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true }; // Fail open
    }

    const attemptCount = attempts?.length || 0;
    const maxAttempts = 5;

    if (attemptCount >= maxAttempts) {
      return { 
        allowed: false, 
        retryAfter: 5 * 60 // 5 minutes
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit error:', error);
    return { allowed: true }; // Fail open
  }
}

/**
 * Check account lockout status
 */
async function checkAccountLockout(userId: string): Promise<{
  isLocked: boolean;
  retryAfter?: number;
}> {
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('login_attempts, lock_until')
      .eq('id', userId)
      .single();

    if (!user) return { isLocked: false };

    // Check if account is currently locked
    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      const retryAfter = Math.ceil((new Date(user.lock_until).getTime() - Date.now()) / 1000);
      return { isLocked: true, retryAfter };
    }

    return { isLocked: false };
  } catch (error) {
    console.error('Account lockout check error:', error);
    return { isLocked: false };
  }
}

/**
 * Record failed login attempt
 */
async function recordFailedAttempt(userId: string): Promise<void> {
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('login_attempts')
      .eq('id', userId)
      .single();

    if (!user) return;

    const attempts = (user.login_attempts || 0) + 1;
    const maxAttempts = 5;
    const lockDuration = passwordManager.calculateDelayForFailedAttempts(attempts);

    const updates: any = {
      login_attempts: attempts,
      updated_at: new Date().toISOString()
    };

    // Lock account if max attempts reached
    if (attempts >= maxAttempts) {
      updates.lock_until = new Date(Date.now() + lockDuration).toISOString();
    }

    await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId);
  } catch (error) {
    console.error('Failed attempt recording error:', error);
  }
}

/**
 * Clear failed login attempts
 */
async function clearFailedAttempts(userId: string): Promise<void> {
  try {
    await supabaseAdmin
      .from('users')
      .update({
        login_attempts: 0,
        lock_until: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
  } catch (error) {
    console.error('Clear failed attempts error:', error);
  }
}

/**
 * Log login attempt
 */
async function logLoginAttempt(attempt: LoginAttempt): Promise<void> {
  try {
    await supabaseAdmin
      .from('login_attempts')
      .insert({
        user_id: attempt.userId === 'unknown' ? null : attempt.userId,
        ip_address: attempt.ipAddress,
        user_agent: attempt.userAgent,
        success: attempt.success,
        failure_reason: attempt.failureReason,
        timestamp: attempt.timestamp.toISOString()
      });
  } catch (error) {
    console.error('Login attempt logging error:', error);
  }
}

/**
 * Get user's competition access
 */
async function getUserCompetitionAccess(userId: string, userRole: string): Promise<string[]> {
  try {
    // Admins get access to all competitions
    if (userRole === 'admin' || userRole === 'super_admin') {
      const { data: competitions } = await supabaseAdmin
        .from('competitions')
        .select('id');
      
      return competitions?.map(c => c.id) || [];
    }

    // For other roles, get specific assignments
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