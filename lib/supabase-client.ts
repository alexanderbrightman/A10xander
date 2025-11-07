import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Singleton pattern to prevent multiple Supabase client instances
let supabaseClient: SupabaseClient<Database> | null = null

// Client-side Supabase client (singleton) - uses SSR package to read cookies set by middleware
export function createBrowserClient(): SupabaseClient<Database> {
  // Return existing client if it exists
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = 'Missing Supabase environment variables. Please check your .env.local file. ' +
      `URL: ${supabaseUrl ? 'Set' : 'Missing'}, Key: ${supabaseAnonKey ? 'Set' : 'Missing'}`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  // Validate URL format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    const errorMsg = `Invalid Supabase URL format: ${supabaseUrl}. Should be https://[project].supabase.co`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  try {
    // Use SSR browser client which reads from cookies (compatible with middleware)
    supabaseClient = createSSRBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
    
    console.log('Supabase client created successfully (SSR-compatible)')
    return supabaseClient
  } catch (err: any) {
    console.error('Failed to create Supabase client:', err)
    throw new Error(`Failed to initialize Supabase client: ${err.message}`)
  }
}

