/**
 * Production Authentication Provider
 * Replaces MockAuthProvider with NextAuth.js integration
 */

'use client'

import React, { createContext, useContext } from 'react'
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react'
import { Session } from 'next-auth'

// Enhanced user interface that matches our database schema
export interface AuthUser {
  id: string
  email: string
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  image?: string | null
  role: 'student' | 'judge' | 'reviewer' | 'admin' | 'super_admin'
  university?: string | null
  graduationYear?: number | null
  program?: string | null
  emailVerified?: boolean
}

export interface AuthContextValue {
  // Session state
  user: AuthUser | null
  session: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  
  // Authentication methods
  signIn: typeof signIn
  signOut: typeof signOut
  
  // Utility methods
  isAuthenticated: boolean
  isLoading: boolean
  hasRole: (roles: string | string[]) => boolean
  isAdmin: boolean
  isJudge: boolean
  isStudent: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Internal component that uses NextAuth session
function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  // Convert NextAuth session to our AuthUser format
  const user: AuthUser | null = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
    role: (session.user.role || 'student') as AuthUser['role'],
    // Additional fields will be populated from database as needed
  } : null

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  const contextValue: AuthContextValue = {
    user,
    session,
    status,
    signIn,
    signOut,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    hasRole,
    isAdmin: hasRole(['admin', 'super_admin']),
    isJudge: hasRole(['judge', 'reviewer', 'admin', 'super_admin']),
    isStudent: hasRole(['student']),
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Main provider that wraps NextAuth SessionProvider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Refetch session every 5 minutes
      refetchInterval={5 * 60}
      // Refetch on window focus
      refetchOnWindowFocus={true}
    >
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </SessionProvider>
  )
}

// Hook to use authentication context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Utility hooks for common authentication checks
export function useRequireAuth(redirectTo = '/login') {
  const auth = useAuth()
  
  React.useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      signIn(undefined, { callbackUrl: window.location.href })
    }
  }, [auth.isLoading, auth.isAuthenticated])

  return auth
}

export function useRequireRole(requiredRoles: string | string[], redirectTo = '/unauthorized') {
  const auth = useAuth()
  
  React.useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated && !auth.hasRole(requiredRoles)) {
      window.location.href = redirectTo
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.user])

  return auth
}

// Server-side auth utilities
export { getServerSession } from 'next-auth/next'
export { authOptions } from './config'