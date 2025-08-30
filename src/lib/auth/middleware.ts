/**
 * Authentication Middleware for NestFest API Routes
 * 
 * Provides comprehensive authentication and authorization middleware
 * with role-based access control and security features.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtManager } from './jwt-manager';
import { permissionManager } from './permissions';
import { supabaseAdmin } from '../supabase/client';
import { UserRole, User } from '@/types';

export interface AuthContext {
  user: User;
  sessionId: string;
  permissions: string[];
  isAuthenticated: true;
}

export interface AuthError {
  error: string;
  code: number;
  details?: any;
}

export type AuthResult = AuthContext | AuthError;

/**
 * Extract and validate JWT token from request
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = jwtManager.extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        error: 'Authorization header missing or invalid',
        code: 401
      };
    }

    // Verify JWT token
    let payload;
    try {
      payload = jwtManager.verifyAccessToken(token);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Token validation failed',
        code: 401
      };
    }

    // Fetch user from database
    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (dbError || !user) {
      return {
        error: 'User not found or inactive',
        code: 401
      };
    }

    // Check if user account is active
    if (user.status !== 'active') {
      return {
        error: `Account is ${user.status}`,
        code: 403
      };
    }

    // Get user permissions
    const permissions = permissionManager.getRolePermissions(user.role)
      .map(p => p.id);

    return {
      user,
      sessionId: payload.sessionId,
      permissions,
      isAuthenticated: true
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      error: 'Internal authentication error',
      code: 500
    };
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth() {
  return async (request: NextRequest) => {
    const authResult = await authenticateRequest(request);
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.code }
      );
    }

    // Add user context to request headers for downstream handlers
    const response = NextResponse.next();
    response.headers.set('X-User-ID', authResult.user.id);
    response.headers.set('X-User-Role', authResult.user.role);
    response.headers.set('X-Session-ID', authResult.sessionId);

    return response;
  };
}

/**
 * Middleware to require specific role(s)
 */
export function requireRole(...roles: UserRole[]) {
  return async (request: NextRequest) => {
    const authResult = await authenticateRequest(request);
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.code }
      );
    }

    if (!roles.includes(authResult.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Add context to headers
    const response = NextResponse.next();
    response.headers.set('X-User-ID', authResult.user.id);
    response.headers.set('X-User-Role', authResult.user.role);
    response.headers.set('X-Session-ID', authResult.sessionId);

    return response;
  };
}

/**
 * Middleware to require specific permission
 */
export function requirePermission(
  resource: string,
  action: 'read' | 'write' | 'delete' | 'admin'
) {
  return async (request: NextRequest) => {
    const authResult = await authenticateRequest(request);
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.code }
      );
    }

    const hasPermission = permissionManager.hasPermission(
      authResult.user.role,
      resource,
      action
    );

    if (!hasPermission) {
      return NextResponse.json(
        { 
          error: `Insufficient permissions for ${action} on ${resource}`,
          required: `${resource}:${action}`
        },
        { status: 403 }
      );
    }

    // Add context to headers
    const response = NextResponse.next();
    response.headers.set('X-User-ID', authResult.user.id);
    response.headers.set('X-User-Role', authResult.user.role);
    response.headers.set('X-Session-ID', authResult.sessionId);

    return response;
  };
}

/**
 * Middleware for optional authentication (user may or may not be authenticated)
 */
export function optionalAuth() {
  return async (request: NextRequest) => {
    const authResult = await authenticateRequest(request);
    
    const response = NextResponse.next();
    
    if ('user' in authResult) {
      // User is authenticated
      response.headers.set('X-User-ID', authResult.user.id);
      response.headers.set('X-User-Role', authResult.user.role);
      response.headers.set('X-Session-ID', authResult.sessionId);
      response.headers.set('X-Authenticated', 'true');
    } else {
      // User is not authenticated, but continue
      response.headers.set('X-Authenticated', 'false');
    }

    return response;
  };
}

/**
 * Validate API request with comprehensive checks
 */
export async function validateAPIRequest(
  request: NextRequest,
  options: {
    requireAuth?: boolean;
    roles?: UserRole[];
    resource?: string;
    action?: 'read' | 'write' | 'delete' | 'admin';
    checkOwnership?: boolean;
    resourceId?: string;
  } = {}
): Promise<AuthResult> {
  const {
    requireAuth = true,
    roles = [],
    resource,
    action,
    checkOwnership = false,
    resourceId
  } = options;

  // Authentication check
  if (requireAuth) {
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) {
      return authResult;
    }

    // Role check
    if (roles.length > 0 && !roles.includes(authResult.user.role)) {
      return {
        error: 'Insufficient role permissions',
        code: 403,
        details: { requiredRoles: roles, userRole: authResult.user.role }
      };
    }

    // Permission check
    if (resource && action) {
      const hasPermission = permissionManager.hasPermission(
        authResult.user.role,
        resource,
        action
      );

      if (!hasPermission) {
        return {
          error: `Insufficient permissions for ${action} on ${resource}`,
          code: 403,
          details: { resource, action, userRole: authResult.user.role }
        };
      }
    }

    // Ownership check
    if (checkOwnership && resourceId) {
      const canAccess = await checkResourceOwnership(
        authResult.user.id,
        authResult.user.role,
        resource!,
        resourceId
      );

      if (!canAccess) {
        return {
          error: 'Access denied - not resource owner',
          code: 403
        };
      }
    }

    return authResult;
  }

  // For optional authentication, return unauthenticated context
  return {
    error: 'Not authenticated',
    code: 401
  };
}

/**
 * Check if user owns or can access a specific resource
 */
export async function checkResourceOwnership(
  userId: string,
  userRole: UserRole,
  resource: string,
  resourceId: string
): Promise<boolean> {
  try {
    // Admins can access everything
    if (userRole === 'admin' || userRole === 'super_admin') {
      return true;
    }

    switch (resource) {
      case 'submissions': {
        const { data: submission } = await supabaseAdmin
          .from('submissions')
          .select('user_id, team_id')
          .eq('id', resourceId)
          .single();

        if (submission?.user_id === userId) {
          return true;
        }

        // Check team membership if submission belongs to a team
        if (submission?.team_id) {
          const { data: teamMember } = await supabaseAdmin
            .from('team_members')
            .select('id')
            .eq('team_id', submission.team_id)
            .eq('user_id', userId)
            .single();

          return !!teamMember;
        }

        return false;
      }

      case 'users':
        return userId === resourceId;

      case 'teams': {
        const { data: teamMember } = await supabaseAdmin
          .from('team_members')
          .select('id')
          .eq('team_id', resourceId)
          .eq('user_id', userId)
          .single();

        return !!teamMember;
      }

      default:
        return false;
    }
  } catch (error) {
    console.error('Ownership check error:', error);
    return false;
  }
}

/**
 * Extract user context from request headers (set by middleware)
 */
export function getUserFromHeaders(request: NextRequest): Partial<AuthContext> | null {
  const userId = request.headers.get('X-User-ID');
  const userRole = request.headers.get('X-User-Role') as UserRole;
  const sessionId = request.headers.get('X-Session-ID');
  const isAuthenticated = request.headers.get('X-Authenticated') === 'true';

  if (!userId || !userRole || !sessionId || !isAuthenticated) {
    return null;
  }

  return {
    user: { id: userId, role: userRole } as User,
    sessionId,
    isAuthenticated: true
  };
}

/**
 * Rate limiting check for authentication endpoints
 */
export async function checkAuthRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): Promise<{ allowed: boolean; remainingAttempts?: number; resetTime?: Date }> {
  try {
    const key = `auth_rate_limit:${identifier}`;
    const windowMs = windowMinutes * 60 * 1000;
    const now = Date.now();

    // In a production environment, you'd use Redis here
    // For now, we'll use a simple in-memory store (not suitable for production)
    
    return { allowed: true }; // Simplified for now
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true }; // Fail open for now
  }
}

/**
 * Security headers middleware
 */
export function addSecurityHeaders() {
  return (request: NextRequest) => {
    const response = NextResponse.next();
    
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Only add HSTS in production with HTTPS
    if (process.env.NODE_ENV === 'production' && request.nextUrl.protocol === 'https:') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return response;
  };
}

/**
 * CORS middleware for API routes
 */
export function corsMiddleware(allowedOrigins: string[] = []) {
  return (request: NextRequest) => {
    const response = NextResponse.next();
    const origin = request.headers.get('origin');

    // Allow same-origin requests
    if (!origin || allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200 });
    }

    return response;
  };
}