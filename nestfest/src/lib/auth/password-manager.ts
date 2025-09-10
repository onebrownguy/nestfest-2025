/**
 * Password Security Management for NestFest
 * 
 * Handles secure password hashing, validation, strength checking,
 * and password reset functionality with industry best practices.
 */

import bcrypt from 'bcryptjs';
import zxcvbn from 'zxcvbn';
import crypto from 'crypto';
import validator from 'validator';

export interface PasswordStrengthResult {
  score: number; // 0-4 (0 is weakest, 4 is strongest)
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTimeDisplay: string;
  isValid: boolean;
}

export interface PasswordValidationOptions {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  blacklistedPasswords?: string[];
}

export class PasswordManager {
  private readonly saltRounds = 12; // Recommended minimum for bcrypt
  private readonly minPasswordLength = 8;
  private readonly maxPasswordLength = 128;
  private readonly resetTokenExpiry = 1000 * 60 * 60; // 1 hour in milliseconds

  // Common weak passwords to blacklist
  private readonly commonWeakPasswords = [
    'password', 'password123', '123456', '12345678', 'qwerty',
    'abc123', 'password1', 'admin', 'letmein', 'welcome',
    'monkey', '1234567890', 'password12', 'qwerty123'
  ];

  /**
   * Validate password strength and requirements
   */
  validatePasswordStrength(
    password: string, 
    options: PasswordValidationOptions = {},
    userInputs: string[] = []
  ): PasswordStrengthResult {
    const {
      minLength = this.minPasswordLength,
      maxLength = this.maxPasswordLength,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecialChars = true,
      blacklistedPasswords = this.commonWeakPasswords
    } = options;

    // Basic length validation
    if (password.length < minLength) {
      return {
        score: 0,
        feedback: {
          warning: `Password must be at least ${minLength} characters long`,
          suggestions: [`Use at least ${minLength} characters`]
        },
        crackTimeDisplay: 'instant',
        isValid: false
      };
    }

    if (password.length > maxLength) {
      return {
        score: 0,
        feedback: {
          warning: `Password must be less than ${maxLength} characters`,
          suggestions: [`Use fewer than ${maxLength} characters`]
        },
        crackTimeDisplay: 'instant',
        isValid: false
      };
    }

    // Check against blacklisted passwords
    if (blacklistedPasswords.includes(password.toLowerCase())) {
      return {
        score: 0,
        feedback: {
          warning: 'This password is commonly used and not secure',
          suggestions: ['Choose a more unique password']
        },
        crackTimeDisplay: 'instant',
        isValid: false
      };
    }

    // Character requirement validation
    const requirements = [];
    if (requireUppercase && !/[A-Z]/.test(password)) {
      requirements.push('at least one uppercase letter');
    }
    if (requireLowercase && !/[a-z]/.test(password)) {
      requirements.push('at least one lowercase letter');
    }
    if (requireNumbers && !/\d/.test(password)) {
      requirements.push('at least one number');
    }
    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      requirements.push('at least one special character');
    }

    if (requirements.length > 0) {
      return {
        score: 1,
        feedback: {
          warning: 'Password does not meet complexity requirements',
          suggestions: [`Include ${requirements.join(', ')}`]
        },
        crackTimeDisplay: 'very weak',
        isValid: false
      };
    }

    // Use zxcvbn for advanced password strength analysis
    const strengthAnalysis = zxcvbn(password, [...userInputs, 'nestfest', 'competition', 'judge', 'student']);

    return {
      score: strengthAnalysis.score,
      feedback: {
        warning: strengthAnalysis.feedback.warning || '',
        suggestions: strengthAnalysis.feedback.suggestions || []
      },
      crackTimeDisplay: strengthAnalysis.crack_times_display.offline_slow_hashing_1e4_per_second,
      isValid: strengthAnalysis.score >= 3 // Require score of 3 or higher
    };
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string, userInputs: string[] = []): Promise<string> {
    const strengthResult = this.validatePasswordStrength(password, {}, userInputs);
    
    if (!strengthResult.isValid) {
      throw new Error(`Password validation failed: ${strengthResult.feedback.warning}`);
    }

    return await bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    if (!password || !hashedPassword) {
      return false;
    }

    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Generate secure random password
   */
  generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*(),.?":{}|<>';
    
    // Ensure at least one character from each required category
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the rest with random characters from all categories
    const allChars = lowercase + uppercase + numbers + specialChars;
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Generate password reset token
   */
  generateResetToken(): { token: string; expires: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + this.resetTokenExpiry);
    
    return { token, expires };
  }

  /**
   * Validate reset token (check if not expired)
   */
  validateResetToken(tokenExpiry: Date): boolean {
    return new Date() < new Date(tokenExpiry);
  }

  /**
   * Hash reset token for storage (security best practice)
   */
  hashResetToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Check if password needs rehashing (for salt rounds upgrade)
   */
  needsRehashing(hashedPassword: string): boolean {
    try {
      const rounds = parseInt(hashedPassword.split('$')[2]);
      return rounds < this.saltRounds;
    } catch {
      return true; // If we can't parse, assume it needs rehashing
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }

    if (!validator.isEmail(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    if (email.length > 254) {
      return { isValid: false, error: 'Email is too long' };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.{2,}/, // Multiple consecutive dots
      /^\./, // Starts with dot
      /\.$/, // Ends with dot
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(email)) {
        return { isValid: false, error: 'Invalid email format' };
      }
    }

    return { isValid: true };
  }

  /**
   * Normalize email address
   */
  normalizeEmail(email: string): string {
    return validator.normalizeEmail(email, {
      gmail_lowercase: true,
      gmail_remove_dots: true,
      gmail_remove_subaddress: true,
      outlookdotcom_lowercase: true,
      outlookdotcom_remove_subaddress: true,
      yahoo_lowercase: true,
      yahoo_remove_subaddress: true,
    }) || email.toLowerCase().trim();
  }

  /**
   * Generate secure session token
   */
  generateSessionToken(): string {
    return crypto.randomBytes(48).toString('hex');
  }

  /**
   * Create verification code for 2FA
   */
  generateVerificationCode(length: number = 6): string {
    const digits = '0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return code;
  }

  /**
   * Time-safe string comparison to prevent timing attacks
   */
  timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(
        Buffer.from(a, 'utf8'),
        Buffer.from(b, 'utf8')
      );
    } catch {
      return false;
    }
  }

  /**
   * Rate limiting helper for password attempts
   */
  calculateDelayForFailedAttempts(attempts: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc. up to max of 30 minutes
    const baseDelay = 1000; // 1 second
    const maxDelay = 30 * 60 * 1000; // 30 minutes
    
    const delay = Math.min(baseDelay * Math.pow(2, attempts - 1), maxDelay);
    return delay;
  }
}

// Export singleton instance
export const passwordManager = new PasswordManager();