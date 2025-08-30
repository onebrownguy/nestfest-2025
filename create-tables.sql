-- Create essential types
CREATE TYPE user_role AS ENUM('student', 'judge', 'reviewer', 'admin', 'super_admin');
CREATE TYPE user_status AS ENUM('active', 'inactive', 'suspended', 'pending');

-- Create users table (required for NextAuth)
CREATE TABLE users (
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

-- Create accounts table (required for NextAuth OAuth)
CREATE TABLE accounts (
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

-- Create sessions table (required for NextAuth)
CREATE TABLE sessions (
  session_token varchar(255) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires timestamp NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Create verification tokens table (required for NextAuth)
CREATE TABLE verification_tokens (
  identifier varchar(255) NOT NULL,
  token varchar(255) NOT NULL,
  expires timestamp NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  UNIQUE(identifier, token)
);

-- Create indexes for performance
CREATE UNIQUE INDEX accounts_provider_account_id_idx ON accounts (provider, provider_account_id);
CREATE UNIQUE INDEX users_email_idx ON users (email);
CREATE UNIQUE INDEX verification_tokens_identifier_token_idx ON verification_tokens (identifier, token);

-- Insert seed users
INSERT INTO users (email, name, first_name, last_name, role, status, email_verified)
VALUES 
  ('rinconabel@gmail.com', 'Abel Rincon', 'Abel', 'Rincon', 'admin', 'active', now()),
  ('abel.rincon@g.austincc.edu', 'Abel Rincon (Judge)', 'Abel', 'Rincon', 'judge', 'active', now())
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = now();