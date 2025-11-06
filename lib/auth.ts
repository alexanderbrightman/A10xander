import { createServerSupabaseClient } from './supabase'

const ADMIN_UUID = 'df74d913-f481-48d9-b23d-d9469fb346e2'

export async function isAdmin(): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.id === ADMIN_UUID
}

export async function getAdminId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.id === ADMIN_UUID) {
    return user.id
  }

  return null
}

export function getAdminUUID(): string {
  return ADMIN_UUID
}

