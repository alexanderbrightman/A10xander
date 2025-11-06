'use client'

import { useState, FormEvent } from 'react'
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

    const supabase = createBrowserClient()

    if (isMagicLink) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for the magic link!')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        onSuccess()
        onClose()
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md p-8 bg-cosmic-blue rounded-lg border border-cosmic-green/20 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-cosmic-green transition-colors text-2xl"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-cosmic-green mb-6 text-center">
          Admin Login
        </h2>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
                setMessage('')
              }}
              className="w-full px-4 py-2 bg-cosmic-darker border border-cosmic-green/20 rounded-lg text-white focus:outline-none focus:border-cosmic-green focus:ring-1 focus:ring-cosmic-green"
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>

          {!isMagicLink && (
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                className="w-full px-4 py-2 bg-cosmic-darker border border-cosmic-green/20 rounded-lg text-white focus:outline-none focus:border-cosmic-green focus:ring-1 focus:ring-cosmic-green"
                placeholder="Password"
                required
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              id="magic-link"
              type="checkbox"
              checked={isMagicLink}
              onChange={(e) => {
                setIsMagicLink(e.target.checked)
                setError('')
                setMessage('')
              }}
              className="w-4 h-4 text-cosmic-green bg-cosmic-darker border-cosmic-green/20 rounded focus:ring-cosmic-green"
            />
            <label
              htmlFor="magic-link"
              className="ml-2 text-sm text-gray-300"
            >
              Use magic link instead
            </label>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          {message && (
            <p className="text-cosmic-green text-sm text-center">{message}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || (!isMagicLink && !password)}
            className="w-full py-2 px-4 bg-cosmic-green text-cosmic-darker font-semibold rounded-lg hover:bg-cosmic-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? 'Loading...'
              : isMagicLink
              ? 'Send Magic Link'
              : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

