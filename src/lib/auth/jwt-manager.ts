/**
 * JWT Token Management for NestFest Authentication
 * 
 * Handles secure JWT token generation, validation, and refresh logic
 * with proper security measures and token rotation.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole } from '@/types';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  type: 'access' | 'refresh';
  competitionAccess?: string[];
  permissions?: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
}

export class JWTManager {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry = '15m';  // 15 minutes
  private readonly refreshTokenExpiry = '7d';  // 7 days
  private readonly issuer = 'nestfest-platform';
  private readonly audience = 'nestfest-users';

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET!;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;

    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error('JWT secrets not configured. Please set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables.');
    }
  }

  /**
   * Generate a secure session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate access and refresh token pair
   */
  generateTokenPair(payload: Omit<JWTPayload, 'type' | 'sessionId'>): TokenPair {
    const sessionId = this.generateSessionId();
    const now = Math.floor(Date.now() / 1000);

    // Access token payload
    const accessPayload: JWTPayload = {
      ...payload,
      type: 'access',
      sessionId,
      iat: now,
      exp: now + (15 * 60) // 15 minutes
    };

    // Refresh token payload (minimal data)
    const refreshPayload: JWTPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      type: 'refresh',
      sessionId,
      iat: now,
      exp: now + (7 * 24 * 60 * 60) // 7 days
    };

    const accessToken = jwt.sign(accessPayload, this.accessTokenSecret, {
      issuer: this.issuer,
      audience: this.audience,
      algorithm: 'HS256'
    });

    const refreshToken = jwt.sign(refreshPayload, this.refreshTokenSecret, {
      issuer: this.issuer,
      audience: this.audience,
      algorithm: 'HS256'
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 * 1000, // milliseconds
      sessionId
    };
  }

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      }) as JWTPayload;

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // Check if token is expired (additional safety check)
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        throw new Error('Token expired');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Verify and decode refresh token
   */
  verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      }) as JWTPayload;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Generate new access token using refresh token
   */
  refreshAccessToken(
    refreshToken: string, 
    updatedPayload?: Partial<Pick<JWTPayload, 'competitionAccess' | 'permissions'>>
  ): { accessToken: string; expiresIn: number } {
    const refreshPayload = this.verifyRefreshToken(refreshToken);

    const newAccessPayload: JWTPayload = {
      userId: refreshPayload.userId,
      email: refreshPayload.email,
      role: refreshPayload.role,
      sessionId: refreshPayload.sessionId,
      type: 'access',
      competitionAccess: updatedPayload?.competitionAccess || refreshPayload.competitionAccess,
      permissions: updatedPayload?.permissions || refreshPayload.permissions
    };

    const accessToken = jwt.sign(newAccessPayload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: this.issuer,
      audience: this.audience,
      algorithm: 'HS256'
    });

    return {
      accessToken,
      expiresIn: 15 * 60 * 1000 // milliseconds
    };
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Decode token without verification (for inspecting expired tokens)
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }

  /**
   * Check if token is close to expiring (within 5 minutes)
   */
  isTokenNearExpiry(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    
    return timeUntilExpiry <= 300; // 5 minutes
  }

  /**
   * Generate secure random token for email verification, password reset, etc.
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Create token with custom expiry
   */
  generateCustomToken(
    payload: Record<string, any>, 
    secret: string, 
    expiresIn: string
  ): string {
    return jwt.sign(payload, secret, {
      expiresIn,
      issuer: this.issuer,
      audience: this.audience,
      algorithm: 'HS256'
    });
  }

  /**
   * Verify custom token
   */
  verifyCustomToken(token: string, secret: string): any {
    return jwt.verify(token, secret, {
      issuer: this.issuer,
      audience: this.audience,
      algorithms: ['HS256']
    });
  }
}

// Export singleton instance
export const jwtManager = new JWTManager();