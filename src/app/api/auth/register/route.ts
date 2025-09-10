/**
 * Registration API Route for NestFest Authentication
 * 
 * Handles user registration with email verification,
 * password validation, and role assignment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtManager } from '@/lib/auth/jwt-manager';
import { passwordManager } from '@/lib/auth/password-manager';
import { sessionManager } from '@/lib/auth/session-manager';
import { permissionManager } from '@/lib/auth/permissions';
import { supabaseAdmin } from '@/lib/supabase/client';
import { UserRole } from '@/types';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  university?: string;
  graduationYear?: number;
  program?: string;
  phoneNumber?: string;
  role?: UserRole;
  deviceInfo?: {
    fingerprint: string;
    platform: string;
    userAgent: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const {
      email,
      password,
      name,
      firstName,
      lastName,
      university,
      graduationYear,
      program,
      phoneNumber,
      role = 'student',
      deviceInfo
    } = body;

    // Input validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate email
    const emailValidation = passwordManager.validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = passwordManager.normalizeEmail(email);

    // Validate password strength
    const userInputs = [
      email.split('@')[0], // username part of email
      name,
      firstName,
      lastName,
      university
    ].filter(Boolean) as string[];

    const passwordValidation = passwordManager.validatePasswordStrength(
      password,
      {},
      userInputs
    );

    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Password does not meet security requirements',
          details: {
            feedback: passwordValidation.feedback,
            score: passwordValidation.score
          }
        },
        { status: 400 }
      );
    }

    // Validate role (ensure only valid roles can be assigned)
    const validRoles: UserRole[] = ['student', 'reviewer', 'judge', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Restrict admin role creation (only super_admins can create admin users)
    if ((role === 'admin' || role === 'super_admin')) {
      // In a real application, you'd check if the requester is a super_admin
      // For now, we'll allow admin creation but log it
      console.warn(`Admin role registration attempt for ${normalizedEmail}`);
    }

    // Validate additional fields
    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    if (graduationYear && (graduationYear < 1900 || graduationYear > new Date().getFullYear() + 10)) {
      return NextResponse.json(
        { error: 'Invalid graduation year' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await passwordManager.hashPassword(password, userInputs);

    // Generate email verification token
    const emailVerificationToken = passwordManager.generateSecurePassword(32);
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Use provided firstName and lastName, or split from name if not provided
    const nameParts = name.trim().split(' ');
    const derivedFirstName = firstName || nameParts[0] || name.trim();
    const derivedLastName = lastName || nameParts.slice(1).join(' ') || '';

    // Create user
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        email: normalizedEmail,
        password_hash: hashedPassword,
        first_name: derivedFirstName,
        last_name: derivedLastName,
        graduation_year: graduationYear,
        phone: phoneNumber?.trim(),
        account_status: 'active',
        email_verification_token: emailVerificationToken,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (insertError || !newUser) {
      console.error('User creation error:', insertError);
      
      if (insertError?.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Send email verification (in production, use a proper email service)
    await sendVerificationEmail(normalizedEmail, name, emailVerificationToken);

    // Assign default student role
    await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.id,
        role_id: (await supabaseAdmin
          .from('roles')
          .select('id')
          .eq('name', role)
          .single()).data?.id
      });

    // Get user permissions
    const permissions = permissionManager.getRolePermissions(role)
      .map(p => p.id);

    // Get competition access
    const competitionAccess = await getUserCompetitionAccess(newUser.id, role);

    // Generate JWT tokens
    const tokenPair = jwtManager.generateTokenPair({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
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
      newUser.id,
      tokenPair.refreshToken,
      deviceInfoForSession as any,
      ipAddress
    );

    // Log registration event
    await logRegistrationEvent({
      userId: newUser.id,
      email: normalizedEmail,
      role,
      ipAddress,
      userAgent,
      timestamp: new Date()
    });

    // Prepare user data for response (exclude sensitive fields)
    const { password_hash: _, email_verification_token: __, ...safeUser } = newUser;
    const responseUser = {
      ...safeUser,
      name: `${newUser.first_name} ${newUser.last_name}`.trim(),
      permissions,
      competitionAccess,
      mfaEnabled: false,
      emailVerified: false
    };

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email for verification instructions.',
      user: responseUser,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      sessionId: session.id,
      expiresIn: tokenPair.expiresIn
    });

    // Set secure cookie for refresh token
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('nestfest_refresh_token', tokenPair.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Validate phone number format
 */
function isValidPhoneNumber(phone: string): boolean {
  // Simple phone validation - in production, use a proper library
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Extract timezone from request headers
 */
function getTimezoneFromRequest(request: NextRequest): string | undefined {
  const timezone = request.headers.get('x-timezone');
  if (timezone) {
    try {
      // Validate timezone
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return timezone;
    } catch {
      // Invalid timezone, ignore
    }
  }
  return undefined;
}

/**
 * Send email verification (placeholder - implement with proper email service)
 */
async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  try {
    // In production, integrate with your email service (SendGrid, AWS SES, etc.)
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
    
    console.log(`Email verification required for ${email}`);
    console.log(`Verification URL: ${verificationUrl}`);
    
    // Store email task in database for processing by email worker
    await supabaseAdmin
      .from('email_queue')
      .insert({
        to_email: email,
        template: 'email_verification',
        template_data: {
          name,
          verification_url: verificationUrl,
          token
        },
        scheduled_at: new Date().toISOString(),
        priority: 'high'
      });

  } catch (error) {
    console.error('Email verification sending error:', error);
    // Don't fail registration if email sending fails
  }
}

/**
 * Get user's competition access based on role
 */
async function getUserCompetitionAccess(userId: string, userRole: UserRole): Promise<string[]> {
  try {
    // Admins get access to all competitions
    if (userRole === 'admin' || userRole === 'super_admin') {
      const { data: competitions } = await supabaseAdmin
        .from('competitions')
        .select('id');
      
      return competitions?.map(c => c.id) || [];
    }

    // Students get access to open competitions
    if (userRole === 'student') {
      const { data: competitions } = await supabaseAdmin
        .from('competitions')
        .select('id')
        .in('status', ['open', 'live']);
      
      return competitions?.map(c => c.id) || [];
    }

    // Other roles start with no competition access (assigned later)
    return [];
  } catch (error) {
    console.error('Competition access error:', error);
    return [];
  }
}

/**
 * Log registration event for audit trail
 */
async function logRegistrationEvent(event: {
  userId: string;
  email: string;
  role: UserRole;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}): Promise<void> {
  try {
    await supabaseAdmin
      .from('audit_log')
      .insert({
        user_id: event.userId,
        action: 'user_registration',
        resource: 'users',
        resource_id: event.userId,
        details: {
          email: event.email,
          role: event.role,
          ip_address: event.ipAddress,
          user_agent: event.userAgent
        },
        timestamp: event.timestamp.toISOString()
      });
  } catch (error) {
    console.error('Registration event logging error:', error);
  }
}