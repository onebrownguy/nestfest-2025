/**
 * Database Initialization Script
 * Creates tables and seeds initial data for NestFest
 */

import { sql } from '@vercel/postgres'

async function initializeDatabase() {
  console.log('🚀 Initializing NestFest database...')

  try {
    // Create enums first
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

    console.log('✅ Database tables created successfully')

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

    console.log('✅ Admin user created:', adminResult.rows[0])
    console.log('✅ Judge user created:', judgeResult.rows[0])

    // Verify final state
    const userCount = await sql`SELECT COUNT(*) as count FROM users;`
    console.log(`📊 Total users in database: ${userCount.rows[0].count}`)

    console.log('🎉 Database initialization completed successfully!')

  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

// Export for use in API routes or direct execution
export default initializeDatabase

// Allow direct execution
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Failed to initialize database:', error)
      process.exit(1)
    })
}