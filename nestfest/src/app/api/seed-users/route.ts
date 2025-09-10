/**
 * API Endpoint to Seed Initial Users
 * POST /api/seed-users
 */

import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting user seeding via API...')

    const results = []

    // Admin User: rinconabel@gmail.com
    const adminEmail = 'rinconabel@gmail.com'
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1)

    if (existingAdmin.length === 0) {
      const adminUser = await db.insert(users).values({
        email: adminEmail,
        name: 'Abel Rincon',
        firstName: 'Abel',
        lastName: 'Rincon',
        role: 'admin',
        status: 'active',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning()

      results.push({
        action: 'created',
        user: {
          email: adminUser[0].email,
          role: adminUser[0].role,
          status: adminUser[0].status
        }
      })
    } else {
      results.push({
        action: 'exists',
        user: {
          email: existingAdmin[0].email,
          role: existingAdmin[0].role,
          status: existingAdmin[0].status
        }
      })
    }

    // Judge User: abel.rincon@g.austincc.edu
    const judgeEmail = 'abel.rincon@g.austincc.edu'
    const existingJudge = await db
      .select()
      .from(users)
      .where(eq(users.email, judgeEmail))
      .limit(1)

    if (existingJudge.length === 0) {
      const judgeUser = await db.insert(users).values({
        email: judgeEmail,
        name: 'Abel Rincon (Judge)',
        firstName: 'Abel',
        lastName: 'Rincon',
        role: 'judge',
        status: 'active',
        university: 'Austin Community College',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning()

      results.push({
        action: 'created',
        user: {
          email: judgeUser[0].email,
          role: judgeUser[0].role,
          status: judgeUser[0].status
        }
      })
    } else {
      results.push({
        action: 'exists',
        user: {
          email: existingJudge[0].email,
          role: existingJudge[0].role,
          status: existingJudge[0].status
        }
      })
    }

    // Get all users for verification
    const allUsers = await db.select({
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt
    }).from(users)

    return NextResponse.json({
      success: true,
      message: 'User seeding completed successfully',
      results,
      totalUsers: allUsers.length,
      users: allUsers
    })

  } catch (error) {
    console.error('❌ Error seeding users:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

// Optional GET endpoint to view current users
export async function GET() {
  try {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
      university: users.university,
      createdAt: users.createdAt
    }).from(users)

    return NextResponse.json({
      success: true,
      totalUsers: allUsers.length,
      users: allUsers
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users'
    }, { status: 500 })
  }
}