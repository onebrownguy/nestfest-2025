import { cookies } from 'next/headers'

export interface User {
  id: string
  email: string
  name: string
  role: 'student' | 'judge' | 'admin'
  university?: string
  verified: boolean
  createdAt: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

// Mock user database for development
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@nestfest.com',
    name: 'NEST FEST Admin',
    role: 'admin',
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'judge@nestfest.com',
    name: 'Sample Judge',
    role: 'judge',
    university: 'Stanford University',
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    email: 'student@university.edu',
    name: 'Sample Student',
    role: 'student',
    university: 'MIT',
    verified: true,
    createdAt: new Date().toISOString()
  }
]

export class AuthService {
  private static readonly SESSION_COOKIE = 'nest-fest-session'
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

  static async authenticate(email: string, password: string): Promise<{ user?: User; error?: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock authentication logic
    const user = mockUsers.find(u => u.email === email)

    if (!user) {
      return { error: 'Invalid email or password' }
    }

    // In production, you'd verify the password hash here
    if (password !== 'password123') {
      return { error: 'Invalid email or password' }
    }

    // Create session
    const sessionToken = this.generateSessionToken()
    this.setSessionCookie(sessionToken, user)

    return { user }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const cookieStore = await cookies()
      const sessionCookie = cookieStore.get(this.SESSION_COOKIE)

      if (!sessionCookie) {
        return null
      }

      // In production, you'd validate the session token against your database
      const sessionData = this.parseSessionToken(sessionCookie.value)

      if (!sessionData || this.isSessionExpired(sessionData.createdAt)) {
        this.clearSession()
        return null
      }

      const user = mockUsers.find(u => u.id === sessionData.userId)
      return user || null
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  static async logout(): Promise<void> {
    this.clearSession()
  }

  static async register(userData: {
    email: string
    password: string
    name: string
    university: string
    role: 'student' | 'judge'
  }): Promise<{ user?: User; error?: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === userData.email)
    if (existingUser) {
      return { error: 'User with this email already exists' }
    }

    // Create new user
    const newUser: User = {
      id: (mockUsers.length + 1).toString(),
      email: userData.email,
      name: userData.name,
      role: userData.role,
      university: userData.university,
      verified: false, // Would require email verification in production
      createdAt: new Date().toISOString()
    }

    mockUsers.push(newUser)

    // Create session
    const sessionToken = this.generateSessionToken()
    this.setSessionCookie(sessionToken, newUser)

    return { user: newUser }
  }

  private static generateSessionToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private static setSessionCookie(token: string, user: User): void {
    const sessionData = {
      token,
      userId: user.id,
      createdAt: Date.now()
    }

    const cookieValue = btoa(JSON.stringify(sessionData))

    // In Next.js 15, we need to handle cookies properly
    // This would be set via the response in an API route
    console.log('Setting session cookie:', cookieValue)
  }

  private static parseSessionToken(cookieValue: string): { token: string; userId: string; createdAt: number } | null {
    try {
      return JSON.parse(atob(cookieValue))
    } catch {
      return null
    }
  }

  private static isSessionExpired(createdAt: number): boolean {
    return Date.now() - createdAt > this.SESSION_DURATION
  }

  private static clearSession(): void {
    // In production, this would clear the httpOnly cookie
    console.log('Clearing session')
  }
}

// Client-side auth utilities
export function useClientAuth() {
  // This would be implemented with React hooks for client-side state management
  // For now, we'll use a simple approach

  return {
    login: async (email: string, password: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      return response.json()
    },

    logout: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      })
      return response.json()
    },

    register: async (userData: any) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      return response.json()
    }
  }
}