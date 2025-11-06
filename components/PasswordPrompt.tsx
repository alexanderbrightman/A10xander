'use client'

import { useState, FormEvent } from 'react'

interface PasswordPromptProps {
  onSuccess: () => void
}

export default function PasswordPrompt({ onSuccess }: PasswordPromptProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const secretPassword = process.env.NEXT_PUBLIC_SECRET_PASSWORD

    if (!secretPassword) {
      setError('Secret password not configured')
      setIsLoading(false)
      return
    }

    if (password === secretPassword) {
      onSuccess()
    } else {
      setError('Incorrect password')
      setPassword('')
    }
    setIsLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center cosmic-bg">
      <div className="w-full max-w-md p-8 bg-cosmic-blue rounded-lg border border-cosmic-green/20 shadow-2xl">
        <h2 className="text-2xl font-bold text-cosmic-green mb-6 text-center">
          Secret Access
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Enter Password
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
              autoFocus
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-2 px-4 bg-cosmic-green text-cosmic-darker font-semibold rounded-lg hover:bg-cosmic-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Access Secret Globe'}
          </button>
        </form>
      </div>
    </div>
  )
}

