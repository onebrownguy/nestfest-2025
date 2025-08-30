// Simple script to create minimal NextAuth tables
import { drizzle } from 'drizzle-orm/vercel-postgres'
import { sql } from '@vercel/postgres'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

console.log('🚀 Creating minimal NextAuth tables...')
console.log('Database URL:', process.env.POSTGRES_URL?.substring(0, 50) + '...')

const db = drizzle(sql)

async function createTables() {
  try {
    // Create user_role enum
    console.log('Creating user_role enum...')
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM('student', 'judge', 'reviewer', 'admin', 'super_admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    // Create user_status enum  
    console.log('Creating user_status enum...')
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM('active', 'inactive', 'suspended', 'pending');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    // Create users table
    console.log('Creating users table...')
    await db.execute(sql`
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
      )
    `)

    // Create accounts table (required for OAuth)
    console.log('Creating accounts table...')
    await db.execute(sql`
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
      )
    `)

    // Create sessions table
    console.log('Creating sessions table...')
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        session_token varchar(255) PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires timestamp NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      )
    `)

    // Create verification tokens table  
    console.log('Creating verification_tokens table...')
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier varchar(255) NOT NULL,
        token varchar(255) NOT NULL,
        expires timestamp NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        UNIQUE(identifier, token)
      )
    `)

    // Create indexes
    console.log('Creating indexes...')
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS accounts_provider_account_id_idx 
      ON accounts (provider, provider_account_id)
    `)
    
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx 
      ON users (email)
    `)

    // Insert seed users
    console.log('Inserting seed users...')
    await db.execute(sql`
      INSERT INTO users (email, name, first_name, last_name, role, status, email_verified)
      VALUES 
        ('rinconabel@gmail.com', 'Abel Rincon', 'Abel', 'Rincon', 'admin', 'active', now()),
        ('abel.rincon@g.austincc.edu', 'Abel Rincon (Judge)', 'Abel', 'Rincon', 'judge', 'active', now())
      ON CONFLICT (email) DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = now()
    `)

    console.log('✅ Database tables created successfully!')
    
    // Verify creation
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`)
    console.log(`📊 Total users: ${userCount.rows[0].count}`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to create tables:', error)
    process.exit(1)
  }
}

createTables()