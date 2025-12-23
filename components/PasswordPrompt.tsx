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

    const secretPassword = process.env.NEXT_PUBLIC_PRIVATE_PAGE_PASSCODE

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black">
      <div className="w-full max-w-sm p-8 bg-white dark:bg-gray-900 rounded-none md:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-8 text-center tracking-tight">
          Restricted Access
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="Enter Passcode"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-red-500 text-xs text-center font-medium bg-red-50 dark:bg-red-900/10 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-medium text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
          >
            {isLoading ? 'Verifying...' : 'Access Collection'}
          </button>
        </form>
      </div>
    </div>
  )
}

