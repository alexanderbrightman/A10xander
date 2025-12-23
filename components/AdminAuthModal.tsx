'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'

interface AdminAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AdminAuthModal({ isOpen, onClose, onSuccess }: AdminAuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isMagicLink, setIsMagicLink] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  if (!isOpen) return null

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      const supabase = createBrowserClient()

      if (isMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
          },
        })

        if (error) {
          setError(error.message || 'Failed to send magic link. Please check your email and try again.')
          console.error('Magic link error:', error)
        } else {
          setMessage('Check your email for the magic link!')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          // Provide more helpful error messages
          let errorMessage = error.message || 'Login failed'

          if (error.message?.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.'
          } else if (error.message?.includes('Email not confirmed')) {
            errorMessage = 'Please confirm your email address before logging in.'
          } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection and Supabase configuration.'
          }

          setError(errorMessage)
          console.error('Login error:', error)
        } else if (data?.user) {
          // Log the user ID for debugging
          console.log('Logged in user ID:', data.user.id)
          console.log('Expected admin ID:', 'df74d913-f481-48d9-b23d-d9469fb346e2')
          console.log('UUIDs match:', data.user.id === 'df74d913-f481-48d9-b23d-d9469fb346e2')

          // Verify user is admin before redirecting
          if (data.user.id === 'df74d913-f481-48d9-b23d-d9469fb346e2') {
            if (data.session) {
              await supabase.auth.setSession(data.session)
            } else {
              const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
              if (sessionError) {
                console.error('Session retrieval error:', sessionError)
              } else {
                console.log('Session data:', sessionData)
              }
            }

            onClose()
            onSuccess()
          } else {
            setError(`Unauthorized. Your user ID (${data.user.id}) does not match the admin ID. Please contact support or check your Supabase user UUID.`)
            console.error('User ID mismatch:', {
              actual: data.user.id,
              expected: 'df74d913-f481-48d9-b23d-d9469fb346e2'
            })
            // Don't sign out - let them see the error message
          }
        } else {
          setError('Login failed. Please try again.')
        }
      }
    } catch (err: any) {
      // Catch any errors during Supabase client initialization or network errors
      console.error('Login exception:', err)

      if (err.message?.includes('Missing Supabase')) {
        setError('Supabase configuration error. Please check your environment variables.')
      } else if (err.message?.includes('Failed to fetch') || err.message?.includes('network')) {
        setError('Network error. Unable to connect to Supabase. Please check your internet connection and Supabase URL.')
      } else {
        setError(err.message || 'An unexpected error occurred. Please check the console for details.')
      }
    }

    setIsLoading(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-md dark:bg-black/90 transition-all duration-300"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-sm p-8 bg-white dark:bg-gray-900 rounded-none md:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-8 text-center tracking-tight">
          Access
        </h2>

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                  setMessage('')
                }}
                className="w-full px-0 py-2 bg-transparent border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
                placeholder="Email address"
                required
                autoFocus
              />
            </div>

            {!isMagicLink && (
              <div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  className="w-full px-0 py-2 bg-transparent border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
                  placeholder="Password"
                  required
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center cursor-pointer group">
              <input
                id="magic-link"
                type="checkbox"
                checked={isMagicLink}
                onChange={(e) => {
                  setIsMagicLink(e.target.checked)
                  setError('')
                  setMessage('')
                }}
                className="hidden"
              />
              <div className={`w-3 h-3 border transition-colors ${isMagicLink ? 'bg-black border-black dark:bg-white dark:border-white' : 'border-gray-300 dark:border-gray-600'}`}></div>
              <span className="ml-2 text-xs text-gray-500 group-hover:text-gray-800 dark:group-hover:text-gray-300 transition-colors">
                Magic Link
              </span>
            </label>
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center font-medium bg-red-50 dark:bg-red-900/10 py-2">{error}</p>
          )}
          {message && (
            <p className="text-green-600 text-xs text-center font-medium bg-green-50 dark:bg-green-900/10 py-2">{message}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || (!isMagicLink && !password)}
            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
          >
            {isLoading
              ? 'Processing...'
              : isMagicLink
                ? 'Send Link'
                : 'Enter'}
          </button>
        </form>

        {/* Hidden link to secret page */}
        <div className="absolute bottom-4 right-4">
          <Link
            href="/estaenamorado"
            className="block text-gray-200 dark:text-gray-800 hover:text-pink-500 dark:hover:text-pink-500 transition-colors duration-300"
            aria-label="Secret Access"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3 h-3"
            >
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3.25 7.75 3.25c2.1 0 3.96 1.061 4.908 2.76 1.009-1.84 2.97-3.02 5.083-3.02 2.991 0 5.409 2.05 5.409 4.88 0 3.682-2.348 6.442-4.508 8.441a24.896 24.896 0 01-4.99 3.52c-.172.096-.346.186-.519.266l-.022.01-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

