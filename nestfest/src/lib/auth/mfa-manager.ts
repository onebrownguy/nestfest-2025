/**
 * Multi-Factor Authentication (MFA) Manager for NestFest
 * 
 * Handles TOTP (Time-based One-Time Passwords), backup codes,
 * and comprehensive MFA workflows for enhanced security.
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

export interface TOTPSecret {
  base32: string;
  otpauth_url: string;
  qr_code_data_url?: string;
}

export interface BackupCode {
  code: string;
  used: boolean;
  usedAt?: Date;
}

export interface MFASetupResult {
  secret: TOTPSecret;
  backupCodes: string[];
  qrCodeUrl: string;
}

export interface MFAVerificationResult {
  isValid: boolean;
  method: 'totp' | 'backup_code' | null;
  error?: string;
}

export class MFAManager {
  private readonly serviceName = 'NestFest';
  private readonly issuer = 'NestFest Competition Platform';
  private readonly window = 2; // Allow 2 time steps tolerance (60 seconds)
  private readonly backupCodeLength = 8;
  private readonly backupCodeCount = 10;

  /**
   * Generate TOTP secret for a user
   */
  generateTOTPSecret(userEmail: string, userName: string): TOTPSecret {
    const secret = speakeasy.generateSecret({
      name: `${this.serviceName} (${userEmail})`,
      issuer: this.issuer,
      length: 32
    });

    return {
      base32: secret.base32!,
      otpauth_url: secret.otpauth_url!
    };
  }

  /**
   * Generate QR code for TOTP secret
   */
  async generateQRCode(secret: TOTPSecret): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify TOTP token
   */
  verifyTOTPToken(token: string, secret: string): boolean {
    if (!token || !secret) {
      return false;
    }

    // Remove spaces and ensure 6 digits
    const cleanToken = token.replace(/\s/g, '');
    if (!/^\d{6}$/.test(cleanToken)) {
      return false;
    }

    try {
      return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: cleanToken,
        window: this.window
      });
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(count: number = this.backupCodeCount): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate cryptographically secure random code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      // Format as XXXX-XXXX for readability
      const formattedCode = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
      codes.push(formattedCode);
    }
    
    return codes;
  }

  /**
   * Hash backup code for secure storage
   */
  hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
  }

  /**
   * Verify backup code
   */
  verifyBackupCode(inputCode: string, hashedCode: string): boolean {
    if (!inputCode || !hashedCode) {
      return false;
    }

    // Clean and normalize input
    const cleanCode = inputCode.replace(/[-\s]/g, '').toUpperCase();
    
    // Validate format (8 hex characters)
    if (!/^[0-9A-F]{8}$/.test(cleanCode)) {
      return false;
    }

    const hashedInput = crypto.createHash('sha256').update(cleanCode).digest('hex');
    
    // Use timing-safe comparison
    try {
      return crypto.timingSafeEqual(
        Buffer.from(hashedInput, 'hex'),
        Buffer.from(hashedCode, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Complete MFA setup for a user
   */
  async setupMFA(userEmail: string, userName: string): Promise<MFASetupResult> {
    // Generate TOTP secret
    const secret = this.generateTOTPSecret(userEmail, userName);
    
    // Generate QR code
    const qrCodeUrl = await this.generateQRCode(secret);
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    return {
      secret,
      backupCodes,
      qrCodeUrl
    };
  }

  /**
   * Verify MFA token (TOTP or backup code)
   */
  verifyMFAToken(
    token: string,
    totpSecret: string,
    backupCodes: { code: string; used: boolean }[]
  ): MFAVerificationResult {
    if (!token) {
      return { isValid: false, method: null, error: 'Token is required' };
    }

    const cleanToken = token.replace(/[-\s]/g, '').toUpperCase();

    // Try TOTP first (6 digits)
    if (/^\d{6}$/.test(cleanToken)) {
      const isValidTOTP = this.verifyTOTPToken(cleanToken, totpSecret);
      if (isValidTOTP) {
        return { isValid: true, method: 'totp' };
      }
    }

    // Try backup code (8 hex characters)
    if (/^[0-9A-F]{8}$/.test(cleanToken)) {
      for (const backupCode of backupCodes) {
        if (!backupCode.used && this.verifyBackupCode(cleanToken, backupCode.code)) {
          return { isValid: true, method: 'backup_code' };
        }
      }
      return { isValid: false, method: null, error: 'Invalid or used backup code' };
    }

    return { isValid: false, method: null, error: 'Invalid token format' };
  }

  /**
   * Generate recovery codes for account recovery
   */
  generateRecoveryCodes(count: number = 5): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate longer recovery codes (16 characters)
      const code = crypto.randomBytes(8).toString('hex').toUpperCase();
      // Format as XXXX-XXXX-XXXX-XXXX for readability
      const formattedCode = code.match(/.{4}/g)!.join('-');
      codes.push(formattedCode);
    }
    
    return codes;
  }

  /**
   * Validate MFA setup token during enrollment
   */
  validateMFASetup(token: string, secret: string): { isValid: boolean; error?: string } {
    if (!token || !secret) {
      return { isValid: false, error: 'Token and secret are required' };
    }

    const isValid = this.verifyTOTPToken(token, secret);
    
    if (!isValid) {
      return { isValid: false, error: 'Invalid verification code. Please check your authenticator app.' };
    }

    return { isValid: true };
  }

  /**
   * Get current TOTP code for testing (development only)
   */
  getCurrentTOTPCode(secret: string): string {
    return speakeasy.totp({
      secret: secret,
      encoding: 'base32'
    });
  }

  /**
   * Check if TOTP token is valid within time window
   */
  getTOTPTimeRemaining(): number {
    const timeStep = 30; // TOTP time step in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    const timeInStep = currentTime % timeStep;
    
    return timeStep - timeInStep;
  }

  /**
   * Generate MFA challenge for login
   */
  generateMFAChallenge(): { challengeId: string; expiresAt: Date } {
    const challengeId = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    return { challengeId, expiresAt };
  }

  /**
   * Validate MFA challenge
   */
  validateMFAChallenge(challengeExpiry: Date): boolean {
    return new Date() < challengeExpiry;
  }

  /**
   * Format backup codes for display
   */
  formatBackupCodesForDisplay(codes: string[]): string[] {
    return codes.map(code => {
      // Add hyphens for readability if not present
      if (!code.includes('-')) {
        return code.match(/.{4}/g)!.join('-');
      }
      return code;
    });
  }

  /**
   * Generate secure emergency access code
   */
  generateEmergencyAccessCode(): { code: string; hashedCode: string; expiresAt: Date } {
    const code = crypto.randomBytes(12).toString('hex').toUpperCase();
    const formattedCode = code.match(/.{4}/g)!.join('-');
    const hashedCode = crypto.createHash('sha256').update(formattedCode).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      code: formattedCode,
      hashedCode,
      expiresAt
    };
  }
}

// Export singleton instance
export const mfaManager = new MFAManager();