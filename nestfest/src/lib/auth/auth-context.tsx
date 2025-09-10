'use client';

/**
 * Authentication Context Provider for NestFest Frontend
 * 
 * Provides comprehensive authentication state management,
 * user context, permissions, and authentication actions.
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '../supabase/client';

export interface AuthUser extends User {
  permissions: string[];
  competitionAccess: string[];
  mfaEnabled: boolean;
  emailVerified: boolean;
}

export interface AuthState {
  user: AuthUser | null;
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

export interface AuthContextValue {
  // State
  state: AuthState;
  
  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: (allDevices?: boolean) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
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
  getSessions: () => Promise<SessionInfo[]>;
  revokeSession: (sessionId: string) => Promise<void>;
}

export interface RegisterData {
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
}

export interface SessionInfo {
  id: string;
  deviceInfo: string;
  location?: string;
  lastActivity: Date;
  isCurrent: boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { user: AuthUser; accessToken: string; refreshToken: string; sessionId: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<AuthUser> }
  | { type: 'UPDATE_TOKENS'; payload: { accessToken: string; refreshToken?: string } }
  | { type: 'SET_DEVICE_INFO'; payload: AuthState['deviceInfo'] }
  | { type: 'UPDATE_ACTIVITY' };

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  sessionId: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  lastActivity: null,
  deviceInfo: null
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
      
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        sessionId: action.payload.sessionId,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        lastActivity: new Date()
      };
      
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
        deviceInfo: state.deviceInfo // Preserve device info
      };
      
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null
      };
      
    case 'UPDATE_TOKENS':
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken || state.refreshToken,
        lastActivity: new Date()
      };
      
    case 'SET_DEVICE_INFO':
      return { ...state, deviceInfo: action.payload };
      
    case 'UPDATE_ACTIVITY':
      return { ...state, lastActivity: new Date() };
      
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize device fingerprinting
  useEffect(() => {
    const generateDeviceFingerprint = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx?.fillText('Device fingerprint', 10, 10);
      const canvasFingerprint = canvas.toDataURL();
      
      const fingerprint = btoa(JSON.stringify({
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvas: canvasFingerprint.slice(-50) // Last 50 chars for brevity
      }));

      dispatch({
        type: 'SET_DEVICE_INFO',
        payload: {
          fingerprint,
          platform: navigator.platform,
          userAgent: navigator.userAgent
        }
      });
    };

    generateDeviceFingerprint();
  }, []);

  // Initialize authentication state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = localStorage.getItem('nestfest_access_token');
        const refreshToken = localStorage.getItem('nestfest_refresh_token');
        
        if (accessToken && refreshToken) {
          // Verify token and restore session
          await refreshAuth();
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!state.accessToken) return;

    const checkTokenExpiry = () => {
      try {
        const payload = JSON.parse(atob(state.accessToken!.split('.')[1]));
        const expiresIn = (payload.exp * 1000) - Date.now();
        
        // Refresh if token expires in less than 5 minutes
        if (expiresIn < 5 * 60 * 1000) {
          refreshAuth();
        }
      } catch (error) {
        console.error('Token expiry check error:', error);
      }
    };

    const interval = setInterval(checkTokenExpiry, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [state.accessToken]);

  // Track user activity
  useEffect(() => {
    const trackActivity = () => dispatch({ type: 'UPDATE_ACTIVITY' });
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, trackActivity, { passive: true }));
    
    return () => {
      events.forEach(event => document.removeEventListener(event, trackActivity));
    };
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          rememberMe,
          deviceInfo: state.deviceInfo
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store tokens
      localStorage.setItem('nestfest_access_token', data.accessToken);
      if (rememberMe) {
        localStorage.setItem('nestfest_refresh_token', data.refreshToken);
      } else {
        sessionStorage.setItem('nestfest_refresh_token', data.refreshToken);
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          sessionId: data.sessionId
        }
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Login failed'
      });
      throw error;
    }
  }, [state.deviceInfo]);

  const logout = useCallback(async (allDevices = false) => {
    try {
      if (state.accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${state.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ allDevices })
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('nestfest_access_token');
      localStorage.removeItem('nestfest_refresh_token');
      sessionStorage.removeItem('nestfest_refresh_token');
      
      dispatch({ type: 'LOGOUT' });
    }
  }, [state.accessToken]);

  const register = useCallback(async (userData: RegisterData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          deviceInfo: state.deviceInfo
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data = await response.json();
      
      // Auto-login after registration
      localStorage.setItem('nestfest_access_token', data.accessToken);
      localStorage.setItem('nestfest_refresh_token', data.refreshToken);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          sessionId: data.sessionId
        }
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Registration failed'
      });
      throw error;
    }
  }, [state.deviceInfo]);

  const refreshAuth = useCallback(async () => {
    const refreshToken = localStorage.getItem('nestfest_refresh_token') || 
                        sessionStorage.getItem('nestfest_refresh_token');
    
    if (!refreshToken) {
      dispatch({ type: 'LOGOUT' });
      return;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      localStorage.setItem('nestfest_access_token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('nestfest_refresh_token', data.refreshToken);
      }

      dispatch({
        type: 'UPDATE_TOKENS',
        payload: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        }
      });

      if (data.user) {
        dispatch({
          type: 'UPDATE_USER',
          payload: data.user
        });
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Email verification failed');
    }

    if (state.user) {
      dispatch({
        type: 'UPDATE_USER',
        payload: { emailVerified: true }
      });
    }
  }, [state.user]);

  const resetPassword = useCallback(async (email: string) => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password reset failed');
    }
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!state.accessToken) throw new Error('Not authenticated');

    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password update failed');
    }
  }, [state.accessToken]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!state.accessToken) throw new Error('Not authenticated');

    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${state.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Profile update failed');
    }

    const data = await response.json();
    dispatch({
      type: 'UPDATE_USER',
      payload: data.user
    });
  }, [state.accessToken]);

  const loginWithOAuth = useCallback(async (provider: 'google' | 'github' | 'microsoft') => {
    // Redirect to OAuth provider
    window.location.href = `/api/auth/oauth/${provider}`;
  }, []);

  const enableMFA = useCallback(async () => {
    if (!state.accessToken) throw new Error('Not authenticated');

    const response = await fetch('/api/auth/mfa/setup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'MFA setup failed');
    }

    return await response.json();
  }, [state.accessToken]);

  const verifyMFA = useCallback(async (token: string) => {
    if (!state.accessToken) throw new Error('Not authenticated');

    const response = await fetch('/api/auth/mfa/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'MFA verification failed');
    }

    dispatch({
      type: 'UPDATE_USER',
      payload: { mfaEnabled: true }
    });
  }, [state.accessToken]);

  const disableMFA = useCallback(async (password: string) => {
    if (!state.accessToken) throw new Error('Not authenticated');

    const response = await fetch('/api/auth/mfa/disable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'MFA disable failed');
    }

    dispatch({
      type: 'UPDATE_USER',
      payload: { mfaEnabled: false }
    });
  }, [state.accessToken]);

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
    return state.user.competitionAccess.includes(competitionId);
  }, [state.user, hasRole]);

  const getSessions = useCallback(async (): Promise<SessionInfo[]> => {
    if (!state.accessToken) throw new Error('Not authenticated');

    const response = await fetch('/api/auth/sessions', {
      headers: { 'Authorization': `Bearer ${state.accessToken}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }

    return await response.json();
  }, [state.accessToken]);

  const revokeSession = useCallback(async (sessionId: string) => {
    if (!state.accessToken) throw new Error('Not authenticated');

    const response = await fetch(`/api/auth/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${state.accessToken}` }
    });

    if (!response.ok) {
      throw new Error('Failed to revoke session');
    }
  }, [state.accessToken]);

  const contextValue: AuthContextValue = {
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
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}