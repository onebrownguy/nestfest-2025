/**
 * Password Utilities
 * Secure password hashing and verification using bcrypt
 */

import bcrypt from 'bcryptjs'

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12 // High security salt rounds
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-='
  let password = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  
  return password
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
  score: number // 0-100
} {
  const errors: string[] = []
  let score = 0

  // Length requirements
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  } else if (password.length >= 8) {
    score += 20
  }
  
  if (password.length >= 12) {
    score += 10
  }

  // Character type requirements
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else {
    score += 15
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else {
    score += 15
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  } else {
    score += 15
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  } else {
    score += 15
  }

  // Common patterns to avoid
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters')
    score -= 10
  }

  const commonPatterns = [
    'password', '123456', 'qwerty', 'abc123', 'admin', 
    'letmein', 'welcome', 'monkey', 'dragon', 'master'
  ]
  
  if (commonPatterns.some(pattern => 
    password.toLowerCase().includes(pattern.toLowerCase())
  )) {
    errors.push('Password should not contain common words or patterns')
    score -= 20
  }

  // Sequential characters
  if (/123|abc|xyz/i.test(password)) {
    errors.push('Password should not contain sequential characters')
    score -= 10
  }

  // Bonus points for extra length
  if (password.length >= 16) {
    score += 10
  }

  return {
    isValid: errors.length === 0 && score >= 60,
    errors,
    score: Math.max(0, Math.min(100, score))
  }
}

/**
 * Check if password needs to be rehashed (salt rounds changed)
 */
export async function needsRehash(hash: string, saltRounds: number = 12): Promise<boolean> {
  // Extract rounds from hash
  const rounds = hash.split('$')[2]
  return parseInt(rounds) !== saltRounds
}

/**
 * Securely compare two strings to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}