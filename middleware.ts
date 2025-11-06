import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './lib/database.types'

const ADMIN_UUID = 'df74d913-f481-48d9-b23d-d9469fb346e2'

export async function middleware(request: NextRequest) {
  // Only protect /admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    try {
      let response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      })

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables')
        return NextResponse.redirect(new URL('/', request.url))
      }

      const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      })

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        console.error('Auth error:', error)
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Check if user is the admin
      if (!user || user.id !== ADMIN_UUID) {
        // Redirect to home if not authorized
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (error) {
      console.error('Middleware error:', error)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

