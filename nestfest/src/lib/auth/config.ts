/**
 * NextAuth.js Configuration for NestFest
 * Production-ready authentication with multiple providers
 */

import { NextAuthOptions } from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { verifyPassword } from './password-utils'

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db) as any,
  
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),

    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    // Email/Password authentication
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'your@email.com'
        },
        password: { 
          label: 'Password', 
          type: 'password' 
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        try {
          // Find user in database
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1)

          if (!user.length) {
            throw new Error('No account found with this email')
          }

          const dbUser = user[0]
          
          // Verify password hash
          // For existing demo accounts without password hash, accept "password"
          if (dbUser.passwordHash) {
            const isValid = await verifyPassword(credentials.password, dbUser.passwordHash)
            if (!isValid) {
              throw new Error('Invalid password')
            }
          } else if (credentials.password !== 'password') {
            // Temporary fallback for demo accounts without hashed passwords
            throw new Error('Invalid password')
          }
          
          if (dbUser.status !== 'active') {
            throw new Error('Account is not active')
          }

          // Update last login
          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, dbUser.id))

          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            image: dbUser.image,
            role: dbUser.role,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          throw new Error('Authentication failed')
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/login',
    signUp: '/register',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.role = user.role
        token.userId = user.id
      }

      // OAuth account linking
      if (account?.provider) {
        token.provider = account.provider
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.provider = token.provider as string
      }

      return session
    },

    async signIn({ user, account, profile }) {
      // Allow OAuth signins
      if (account?.provider !== 'credentials') {
        return true
      }

      // For credentials, we've already validated in the authorize function
      return true
    },

    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url
      }
      
      return baseUrl
    }
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User ${user.email} signed in via ${account?.provider || 'credentials'}`)
      
      // Log successful login for monitoring
      if (process.env.NODE_ENV === 'production') {
        // You could send this to your analytics service
      }
    },

    async signOut({ session }) {
      console.log(`User ${session?.user?.email} signed out`)
    },

    async createUser({ user }) {
      console.log(`New user created: ${user.email}`)
      
      // Send welcome email, set default preferences, etc.
      // await sendWelcomeEmail(user.email)
    }
  },

  debug: process.env.NODE_ENV === 'development',
}

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
    }
    provider?: string
  }

  interface User {
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    role: string
    provider?: string
  }
}