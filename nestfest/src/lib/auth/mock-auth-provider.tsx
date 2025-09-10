'use client';

/**
 * Mock Authentication Provider for Development/Testing
 * 
 * Provides a simplified auth interface without external dependencies
 * to allow the application to load and be tested
 */

import React, { createContext, useContext, useCallback, useState } from 'react';
import { User, UserRole } from '@/types';

export interface MockAuthUser extends User {
  permissions: string[];
  competitionAccess: string[];
  mfaEnabled: boolean;
  emailVerified: boolean;
}

export interface MockAuthState {
  user: MockAuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: Date | null;
  deviceInfo: {
    fingerprint: string;
    platform: string;
    userAgent: string;
  } | null;
}

export interface MockAuthContextValue {
  // State
  state: MockAuthState;
  
  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: (allDevices?: boolean) => Promise<void>;
  register: (userData: any) => Promise<void>;
  refreshAuth: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  
  // OAuth
  loginWithOAuth: (provider: 'google' | 'github' | 'microsoft') => Promise<void>;
  
  // MFA
  enableMFA: () => Promise<{ qrCode: string; backupCodes: string[] }>;
  verifyMFA: (token: string) => Promise<void>;
  disableMFA: (password: string) => Promise<void>;
  
  // Permissions
  hasPermission: (resource: string, action: 'read' | 'write' | 'delete' | 'admin') => boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccessCompetition: (competitionId: string) => boolean;
  
  // Session management
  getSessions: () => Promise<any[]>;
  revokeSession: (sessionId: string) => Promise<void>;
}

const MockAuthContext = createContext<MockAuthContextValue | null>(null);

// Mock user data for development
const mockUser: MockAuthUser = {
  id: 'mock-user-1',
  email: 'demo@nestfest.com',
  name: 'Demo User',
  firstName: 'Demo',
  lastName: 'User',
  role: 'admin', // Give admin access for demo
  status: 'active',
  university: 'Demo University',
  graduationYear: 2024,
  program: 'Computer Science',
  phoneNumber: null,
  timezone: 'UTC',
  avatarUrl: null,
  emailVerified: true,
  lastLoginAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  permissions: ['*:admin'], // Full permissions for demo
  competitionAccess: ['*'], // Access to all competitions
  mfaEnabled: false,
  emailVerified: true
};

const initialState: MockAuthState = {
  user: mockUser,
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  sessionId: 'mock-session-id',
  isAuthenticated: true, // Start authenticated for demo
  isLoading: false,
  error: null,
  lastActivity: new Date(),
  deviceInfo: {
    fingerprint: 'mock-fingerprint',
    platform: 'Web',
    userAgent: 'Demo Browser'
  }
};

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MockAuthState>(initialState);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    setState(prev => ({
      ...prev,
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null
    }));
  }, []);

  const logout = useCallback(async (allDevices = false) => {
    setState(prev => ({
      ...prev,
      user: null,
      accessToken: null,
      refreshToken: null,
      sessionId: null,
      isAuthenticated: false,
      error: null
    }));
  }, []);

  const register = useCallback(async (userData: any) => {
    setState(prev => ({
      ...prev,
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null
    }));
  }, []);

  const refreshAuth = useCallback(async () => {
    // Mock refresh - no-op
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    // Mock verify - no-op
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    // Mock reset - no-op
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    // Mock update - no-op
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null
    }));
  }, []);

  const loginWithOAuth = useCallback(async (provider: 'google' | 'github' | 'microsoft') => {
    // Mock OAuth - no-op
  }, []);

  const enableMFA = useCallback(async () => {
    return {
      qrCode: 'mock-qr-code',
      backupCodes: ['code1', 'code2', 'code3']
    };
  }, []);

  const verifyMFA = useCallback(async (token: string) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, mfaEnabled: true } : null
    }));
  }, []);

  const disableMFA = useCallback(async (password: string) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, mfaEnabled: false } : null
    }));
  }, []);

  const hasPermission = useCallback((
    resource: string, 
    action: 'read' | 'write' | 'delete' | 'admin'
  ) => {
    if (!state.user) return false;
    
    const permission = `${resource}:${action}`;
    return state.user.permissions.includes(permission) ||
           state.user.permissions.includes(`*:${action}`) ||
           state.user.permissions.includes(`${resource}:admin`) ||
           state.user.permissions.includes('*:admin');
  }, [state.user]);

  const hasRole = useCallback((roles: UserRole | UserRole[]) => {
    if (!state.user) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(state.user.role);
  }, [state.user]);

  const canAccessCompetition = useCallback((competitionId: string) => {
    if (!state.user) return false;
    
    // Admins can access all competitions
    if (hasRole(['admin', 'super_admin'])) return true;
    
    // Check specific competition access
    return state.user.competitionAccess.includes(competitionId) || 
           state.user.competitionAccess.includes('*');
  }, [state.user, hasRole]);

  const getSessions = useCallback(async () => {
    return [
      {
        id: 'mock-session-1',
        deviceInfo: 'Demo Browser',
        location: 'Demo Location',
        lastActivity: new Date(),
        isCurrent: true
      }
    ];
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    // Mock revoke - no-op
  }, []);

  const contextValue: MockAuthContextValue = {
    state,
    login,
    logout,
    register,
    refreshAuth,
    verifyEmail,
    resetPassword,
    updatePassword,
    updateProfile,
    loginWithOAuth,
    enableMFA,
    verifyMFA,
    disableMFA,
    hasPermission,
    hasRole,
    canAccessCompetition,
    getSessions,
    revokeSession
  };

  return (
    <MockAuthContext.Provider value={contextValue}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useAuth(): MockAuthContextValue {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a MockAuthProvider');
  }
  return context;
}