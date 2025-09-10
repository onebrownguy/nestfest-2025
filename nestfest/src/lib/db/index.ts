/**
 * Database connection and query client
 * Using Vercel Postgres with Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/vercel-postgres'
import { sql } from '@vercel/postgres'
import * as schema from './schema'

// Initialize database connection
export const db = drizzle(sql, { schema })

// Helper functions for common database operations
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`)
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Database health check for monitoring
export async function getDatabaseHealth() {
  try {
    const start = Date.now()
    await db.execute(sql`SELECT 1`)
    const duration = Date.now() - start
    
    // Get basic statistics
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`)
    const competitionCount = await db.execute(sql`SELECT COUNT(*) as count FROM competitions`)
    
    return {
      status: 'healthy',
      responseTime: duration,
      userCount: Number(userCount.rows[0]?.count || 0),
      competitionCount: Number(competitionCount.rows[0]?.count || 0),
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

// Export the schema for use in other parts of the application
export * from './schema'

// Type helpers
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]