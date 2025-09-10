/**
 * Authentication Hooks for NestFest
 * 
 * Provides convenient hooks for authentication actions,
 * permission checks, and user state management.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useAuthContext } from './mock-auth-provider';
import { UserRole } from '@/types';

// Re-export the main auth hook for convenience
export const useAuth = useAuthContext;

/**
 * Hook for handling login with loading state and error handling
 */
export function useLogin() {
  const { login, state } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(async (
    email: string,
    password: string,
    rememberMe = false,
    redirectTo = '/dashboard'
  ) => {
    setLoading(true);
    setError(null);

    try {
      await login(email, password, rememberMe);
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }, [login, router]);

  return {
    handleLogin,
    loading,
    error,
    clearError: () => setError(null)
  };
}

/**
 * Hook for handling registration
 */
export function useRegister() {
  const { register } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = useCallback(async (
    userData: Parameters<typeof register>[0],
    redirectTo = '/dashboard'
  ) => {
    setLoading(true);
    setError(null);

    try {
      await register(userData);
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }, [register, router]);

  return {
    handleRegister,
    loading,
    error,
    clearError: () => setError(null)
  };
}

/**
 * Hook for handling logout
 */
export function useLogout() {
  const { logout } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = useCallback(async (
    allDevices = false,
    redirectTo = '/login'
  ) => {
    setLoading(true);

    try {
      await logout(allDevices);
      router.push(redirectTo);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  }, [logout, router]);

  return {
    handleLogout,
    loading
  };
}

/**
 * Hook for checking user permissions
 */
export function usePermissions() {
  const { hasPermission, hasRole, canAccessCompetition, state } = useAuthContext();

  const canRead = useCallback((resource: string) => 
    hasPermission(resource, 'read'), [hasPermission]);
  
  const canWrite = useCallback((resource: string) => 
    hasPermission(resource, 'write'), [hasPermission]);
  
  const canDelete = useCallback((resource: string) => 
    hasPermission(resource, 'delete'), [hasPermission]);
  
  const canAdmin = useCallback((resource: string) => 
    hasPermission(resource, 'admin'), [hasPermission]);

  const isAdmin = useCallback(() => 
    hasRole(['admin', 'super_admin']), [hasRole]);
  
  const isJudge = useCallback(() => 
    hasRole('judge'), [hasRole]);
  
  const isReviewer = useCallback(() => 
    hasRole('reviewer'), [hasRole]);
  
  const isStudent = useCallback(() => 
    hasRole('student'), [hasRole]);

  return {
    hasPermission,
    hasRole,
    canAccessCompetition,
    canRead,
    canWrite,
    canDelete,
    canAdmin,
    isAdmin,
    isJudge,
    isReviewer,
    isStudent,
    permissions: state.user?.permissions || []
  };
}

/**
 * Hook for route protection
 */
export function useRouteProtection(options: {
  requireAuth?: boolean;
  requiredRoles?: UserRole[];
  requiredPermissions?: Array<{ resource: string; action: 'read' | 'write' | 'delete' | 'admin' }>;
  redirectTo?: string;
} = {}) {
  const { state, hasRole, hasPermission } = useAuthContext();
  const router = useRouter();
  const {
    requireAuth = true,
    requiredRoles = [],
    requiredPermissions = [],
    redirectTo = '/login'
  } = options;

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (state.isLoading) return;

    // Check authentication
    if (requireAuth && !state.isAuthenticated) {
      router.push(redirectTo);
      setIsAuthorized(false);
      return;
    }

    // Check roles
    if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
      router.push('/unauthorized');
      setIsAuthorized(false);
      return;
    }

    // Check permissions
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(({ resource, action }) =>
        hasPermission(resource, action)
      );

      if (!hasAllPermissions) {
        router.push('/unauthorized');
        setIsAuthorized(false);
        return;
      }
    }

    setIsAuthorized(true);
  }, [
    state.isLoading,
    state.isAuthenticated,
    requireAuth,
    requiredRoles,
    requiredPermissions,
    hasRole,
    hasPermission,
    router,
    redirectTo
  ]);

  return {
    isAuthorized,
    isLoading: state.isLoading || isAuthorized === null,
    user: state.user
  };
}

/**
 * Hook for handling password changes
 */
export function usePasswordChange() {
  const { updatePassword } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePasswordChange = useCallback(async (
    currentPassword: string,
    newPassword: string
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updatePassword(currentPassword, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setLoading(false);
    }
  }, [updatePassword]);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    handlePasswordChange,
    loading,
    error,
    success,
    reset
  };
}

/**
 * Hook for handling profile updates
 */
export function useProfileUpdate() {
  const { updateProfile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleProfileUpdate = useCallback(async (
    updates: Parameters<typeof updateProfile>[0]
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile(updates);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile update failed');
    } finally {
      setLoading(false);
    }
  }, [updateProfile]);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    handleProfileUpdate,
    loading,
    error,
    success,
    reset
  };
}

/**
 * Hook for MFA management
 */
export function useMFA() {
  const { enableMFA, verifyMFA, disableMFA, state } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<{ qrCode: string; backupCodes: string[] } | null>(null);

  const handleEnableMFA = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await enableMFA();
      setSetupData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFA setup failed');
    } finally {
      setLoading(false);
    }
  }, [enableMFA]);

  const handleVerifyMFA = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);

    try {
      await verifyMFA(token);
      setSetupData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFA verification failed');
    } finally {
      setLoading(false);
    }
  }, [verifyMFA]);

  const handleDisableMFA = useCallback(async (password: string) => {
    setLoading(true);
    setError(null);

    try {
      await disableMFA(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFA disable failed');
    } finally {
      setLoading(false);
    }
  }, [disableMFA]);

  const reset = useCallback(() => {
    setError(null);
    setSetupData(null);
  }, []);

  return {
    mfaEnabled: state.user?.mfaEnabled || false,
    setupData,
    handleEnableMFA,
    handleVerifyMFA,
    handleDisableMFA,
    loading,
    error,
    reset
  };
}

/**
 * Hook for session management
 */
export function useSessionManagement() {
  const { getSessions, revokeSession } = useAuthContext();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const sessionData = await getSessions();
      setSessions(sessionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [getSessions]);

  const handleRevokeSession = useCallback(async (sessionId: string) => {
    setError(null);

    try {
      await revokeSession(sessionId);
      await loadSessions(); // Reload sessions after revocation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke session');
    }
  }, [revokeSession, loadSessions]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    loading,
    error,
    loadSessions,
    handleRevokeSession
  };
}

/**
 * Hook for handling password reset
 */
export function usePasswordReset() {
  const { resetPassword } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePasswordReset = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setLoading(false);
    }
  }, [resetPassword]);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    handlePasswordReset,
    loading,
    error,
    success,
    reset
  };
}

/**
 * Hook for automatic logout on inactivity
 */
export function useInactivityLogout(timeoutMinutes: number = 30) {
  const { logout, state } = useAuthContext();
  const [warningShown, setWarningShown] = useState(false);

  useEffect(() => {
    if (!state.isAuthenticated || !state.lastActivity) return;

    const checkInactivity = () => {
      const now = Date.now();
      const lastActivity = state.lastActivity!.getTime();
      const inactiveTime = now - lastActivity;
      const timeoutMs = timeoutMinutes * 60 * 1000;
      const warningTime = timeoutMs - (5 * 60 * 1000); // 5 minutes before timeout

      if (inactiveTime >= timeoutMs) {
        logout();
      } else if (inactiveTime >= warningTime && !warningShown) {
        setWarningShown(true);
        // You could show a warning modal here
        console.warn('Session will expire in 5 minutes due to inactivity');
      }
    };

    const interval = setInterval(checkInactivity, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.lastActivity, logout, timeoutMinutes, warningShown]);

  const extendSession = useCallback(() => {
    setWarningShown(false);
    // Activity will be tracked automatically by the AuthProvider
  }, []);

  return {
    warningShown,
    extendSession
  };
}