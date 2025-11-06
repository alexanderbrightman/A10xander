// Re-export types and client functions for convenience
// This file is safe to import in both client and server components
export type { Database } from './database.types'
export { createBrowserClient } from './supabase-client'

