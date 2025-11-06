import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Database types
export type Database = {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          title: string | null
          description: string | null
          lat: number
          lng: number
          is_secret: boolean
          created_at: string
          admin_id: string | null
        }
        Insert: {
          id?: string
          title?: string | null
          description?: string | null
          lat: number
          lng: number
          is_secret?: boolean
          created_at?: string
          admin_id?: string | null
        }
        Update: {
          id?: string
          title?: string | null
          description?: string | null
          lat?: number
          lng?: number
          is_secret?: boolean
          created_at?: string
          admin_id?: string | null
        }
      }
      media: {
        Row: {
          id: string
          post_id: string
          type: 'image' | 'video' | 'text'
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          type: 'image' | 'video' | 'text'
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          type?: 'image' | 'video' | 'text'
          url?: string
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: number
          secret_password: string | null
        }
        Insert: {
          id?: number
          secret_password?: string | null
        }
        Update: {
          id?: number
          secret_password?: string | null
        }
      }
    }
  }
}

// Client-side Supabase client
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Server-side Supabase client
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Service role client for admin operations (server-side only)
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

