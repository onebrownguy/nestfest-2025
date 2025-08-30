'use client';

/**
 * Protected Route Component for NestFest
 * 
 * Provides route protection with role-based access control,
 * loading states, and automatic redirects.
 */

import React from 'react';
import { useRouteProtection } from '@/lib/auth/hooks';
import { UserRole } from '@/types';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: UserRole[];
  requiredPermissions?: Array<{ 
    resource: string; 
    action: 'read' | 'write' | 'delete' | 'admin' 
  }>;
  redirectTo?: string;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requiredRoles = [],
  requiredPermissions = [],
  redirectTo = '/auth/login',
  fallback = null,
  loadingComponent,
  unauthorizedComponent
}: ProtectedRouteProps) {
  const { isAuthorized, isLoading, user } = useRouteProtection({
    requireAuth,
    requiredRoles,
    requiredPermissions,
    redirectTo
  });

  // Show loading state
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">
            Verifying permissions...
          </p>
        </div>
      </div>
    );
  }

  // Show unauthorized message
  if (isAuthorized === false) {
    if (unauthorizedComponent) {
      return <>{unauthorizedComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-md bg-red-100">
              <svg 
                className="h-6 w-6 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Access Denied
            </h2>
            
            <p className="mt-2 text-sm text-gray-600">
              {!user 
                ? "You need to sign in to access this page."
                : "You don't have permission to access this page."
              }
            </p>

            {/* Show required permissions */}
            {user && (requiredRoles.length > 0 || requiredPermissions.length > 0) && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Required Access:
                </h3>
                <div className="text-xs text-gray-600 space-y-1">
                  {requiredRoles.length > 0 && (
                    <p>
                      <span className="font-medium">Roles:</span> {requiredRoles.join(', ')}
                    </p>
                  )}
                  {requiredPermissions.length > 0 && (
                    <div>
                      <span className="font-medium">Permissions:</span>
                      <ul className="mt-1 ml-4 list-disc">
                        {requiredPermissions.map((perm, index) => (
                          <li key={index}>
                            {perm.action} access to {perm.resource}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="mt-2">
                    <span className="font-medium">Your role:</span> {user.role}
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-6 space-y-3">
              {!user ? (
                <a
                  href="/auth/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign In
                </a>
              ) : (
                <button
                  onClick={() => window.history.back()}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go Back
                </button>
              )}
              
              <a
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Home
              </a>
            </div>

            {/* Contact support */}
            {user && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Need access? Contact your administrator or{' '}
                  <a 
                    href="mailto:support@nestfest.com" 
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    support team
                  </a>
                  .
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // User is authorized, render children
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Fallback component
  return <>{fallback}</>;
}

// Helper components for common use cases

/**
 * Admin-only route protection
 */
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute
      {...props}
      requiredRoles={['admin', 'super_admin']}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Judge-only route protection
 */
export function JudgeRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute
      {...props}
      requiredRoles={['judge']}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Reviewer-only route protection
 */
export function ReviewerRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute
      {...props}
      requiredRoles={['reviewer']}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Student-only route protection
 */
export function StudentRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute
      {...props}
      requiredRoles={['student']}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Multi-role route protection
 */
export function MultiRoleRoute({ 
  children, 
  roles,
  ...props 
}: Omit<ProtectedRouteProps, 'requiredRoles'> & { roles: UserRole[] }) {
  return (
    <ProtectedRoute
      {...props}
      requiredRoles={roles}
    >
      {children}
    </ProtectedRoute>
  );
}