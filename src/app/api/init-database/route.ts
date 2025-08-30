/**
 * Database Initialization API Endpoint
 * POST /api/init-database
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Initializing NestFest database via API...')
    console.log('Environment check:', {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      urlPrefix: process.env.POSTGRES_URL?.substring(0, 50) + '...'
    })

    // Create enums first
    console.log('Creating user_role enum...')
    await sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM('student', 'judge', 'reviewer', 'admin', 'super_admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await sql`
      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM('active', 'inactive', 'suspended', 'pending');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(255) UNIQUE NOT NULL,
        email_verified timestamp,
        name varchar(255),
        first_name varchar(100),
        last_name varchar(100),
        image text,
        role user_role DEFAULT 'student' NOT NULL,
        status user_status DEFAULT 'active' NOT NULL,
        university varchar(255),
        graduation_year integer,
        program varchar(255),
        phone_number varchar(20),
        timezone varchar(50) DEFAULT 'UTC',
        last_login_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `

    // Create accounts table for NextAuth
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type varchar(255) NOT NULL,
        provider varchar(255) NOT NULL,
        provider_account_id varchar(255) NOT NULL,
        refresh_token text,
        access_token text,
        expires_at integer,
        token_type varchar(255),
        scope varchar(255),
        id_token text,
        session_state varchar(255),
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL,
        UNIQUE(provider, provider_account_id)
      );
    `

    // Create sessions table for NextAuth
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        session_token varchar(255) PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires timestamp NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `

    // Create verification tokens table for NextAuth
    await sql`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier varchar(255) NOT NULL,
        token varchar(255) NOT NULL,
        expires timestamp NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        UNIQUE(identifier, token)
      );
    `

    // Seed initial admin users
    const adminResult = await sql`
      INSERT INTO users (email, name, first_name, last_name, role, status, email_verified)
      VALUES ('rinconabel@gmail.com', 'Abel Rincon', 'Abel', 'Rincon', 'admin', 'active', now())
      ON CONFLICT (email) DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = now()
      RETURNING email, role;
    `

    const judgeResult = await sql`
      INSERT INTO users (email, name, first_name, last_name, role, status, university, email_verified)
      VALUES ('abel.rincon@g.austincc.edu', 'Abel Rincon (Judge)', 'Abel', 'Rincon', 'judge', 'active', 'Austin Community College', now())
      ON CONFLICT (email) DO UPDATE SET
        role = EXCLUDED.role,
        university = EXCLUDED.university,
        updated_at = now()
      RETURNING email, role;
    `

    // Verify final state
    const userCount = await sql`SELECT COUNT(*) as count FROM users;`
    const allUsers = await sql`SELECT email, name, role, status FROM users ORDER BY created_at;`

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      results: {
        adminUser: adminResult.rows[0],
        judgeUser: judgeResult.rows[0],
        totalUsers: userCount.rows[0].count,
        allUsers: allUsers.rows
      }
    })

  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

// Optional GET endpoint to check database status
export async function GET() {
  try {
    const userCount = await sql`SELECT COUNT(*) as count FROM users;`
    const allUsers = await sql`SELECT email, name, role, status, created_at FROM users ORDER BY created_at;`

    return NextResponse.json({
      success: true,
      database: 'connected',
      totalUsers: userCount.rows[0].count,
      users: allUsers.rows
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      database: 'not_initialized',
      error: error instanceof Error ? error.message : 'Database not ready'
    }, { status: 500 })
  }
}