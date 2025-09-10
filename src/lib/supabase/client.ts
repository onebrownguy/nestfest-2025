import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Client for use in client components
export const supabase = createClientComponentClient()

// Server client for API routes and server-side operations
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Database schema types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'student' | 'reviewer' | 'judge' | 'admin' | 'super_admin'
          status: 'active' | 'inactive' | 'suspended'
          university: string | null
          graduation_year: number | null
          program: string | null
          phone_number: string | null
          timezone: string | null
          avatar_url: string | null
          email_verified_at: string | null
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'student' | 'reviewer' | 'judge' | 'admin' | 'super_admin'
          status?: 'active' | 'inactive' | 'suspended'
          university?: string | null
          graduation_year?: number | null
          program?: string | null
          phone_number?: string | null
          timezone?: string | null
          avatar_url?: string | null
          email_verified_at?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'student' | 'reviewer' | 'judge' | 'admin' | 'super_admin'
          status?: 'active' | 'inactive' | 'suspended'
          university?: string | null
          graduation_year?: number | null
          program?: string | null
          phone_number?: string | null
          timezone?: string | null
          avatar_url?: string | null
          email_verified_at?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      competitions: {
        Row: {
          id: string
          name: string
          slug: string
          description: string
          rules_document_url: string | null
          start_date: string
          submission_deadline: string
          judging_start_date: string
          judging_end_date: string
          event_date: string
          status: 'draft' | 'open' | 'reviewing' | 'judging' | 'live' | 'completed' | 'archived'
          max_submissions_per_user: number
          allow_team_submissions: boolean
          team_size_min: number | null
          team_size_max: number | null
          voting_enabled: boolean
          public_voting_enabled: boolean
          config: any // JSONB
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description: string
          rules_document_url?: string | null
          start_date: string
          submission_deadline: string
          judging_start_date: string
          judging_end_date: string
          event_date: string
          status?: 'draft' | 'open' | 'reviewing' | 'judging' | 'live' | 'completed' | 'archived'
          max_submissions_per_user?: number
          allow_team_submissions?: boolean
          team_size_min?: number | null
          team_size_max?: number | null
          voting_enabled?: boolean
          public_voting_enabled?: boolean
          config?: any
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string
          rules_document_url?: string | null
          start_date?: string
          submission_deadline?: string
          judging_start_date?: string
          judging_end_date?: string
          event_date?: string
          status?: 'draft' | 'open' | 'reviewing' | 'judging' | 'live' | 'completed' | 'archived'
          max_submissions_per_user?: number
          allow_team_submissions?: boolean
          team_size_min?: number | null
          team_size_max?: number | null
          voting_enabled?: boolean
          public_voting_enabled?: boolean
          config?: any
          created_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          competition_id: string
          round_id: string | null
          user_id: string | null
          team_id: string | null
          title: string
          description: string
          category_id: string
          status: 'draft' | 'submitted' | 'in_review' | 'accepted' | 'rejected' | 'advanced' | 'eliminated' | 'winner'
          submission_number: string
          submitted_at: string | null
          last_modified_at: string
          withdrawn_at: string | null
          withdrawal_reason: string | null
          metadata: any // JSONB
          version: number
          ip_address: string | null
          browser_fingerprint: string | null
          created_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          round_id?: string | null
          user_id?: string | null
          team_id?: string | null
          title: string
          description: string
          category_id: string
          status?: 'draft' | 'submitted' | 'in_review' | 'accepted' | 'rejected' | 'advanced' | 'eliminated' | 'winner'
          submission_number: string
          submitted_at?: string | null
          last_modified_at?: string
          withdrawn_at?: string | null
          withdrawal_reason?: string | null
          metadata?: any
          version?: number
          ip_address?: string | null
          browser_fingerprint?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          competition_id?: string
          round_id?: string | null
          user_id?: string | null
          team_id?: string | null
          title?: string
          description?: string
          category_id?: string
          status?: 'draft' | 'submitted' | 'in_review' | 'accepted' | 'rejected' | 'advanced' | 'eliminated' | 'winner'
          submission_number?: string
          submitted_at?: string | null
          last_modified_at?: string
          withdrawn_at?: string | null
          withdrawal_reason?: string | null
          metadata?: any
          version?: number
          ip_address?: string | null
          browser_fingerprint?: string | null
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          competition_id: string
          submission_id: string
          voter_user_id: string | null
          voter_session_id: string | null
          vote_type: string
          vote_data: any // JSONB
          weight: number
          ip_address: string
          user_agent: string
          voted_at: string
          is_valid: boolean
        }
        Insert: {
          id?: string
          competition_id: string
          submission_id: string
          voter_user_id?: string | null
          voter_session_id?: string | null
          vote_type: string
          vote_data: any
          weight?: number
          ip_address: string
          user_agent: string
          voted_at?: string
          is_valid?: boolean
        }
        Update: {
          id?: string
          competition_id?: string
          submission_id?: string
          voter_user_id?: string | null
          voter_session_id?: string | null
          vote_type?: string
          vote_data?: any
          weight?: number
          ip_address?: string
          user_agent?: string
          voted_at?: string
          is_valid?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']