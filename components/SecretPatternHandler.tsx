'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Morse code pattern: . - . . (dot-dash-dot-dot)
const TARGET_PATTERN = ['dot', 'dash', 'dot', 'dot']
const DOT_THRESHOLD = 300 // milliseconds
const RESET_TIMEOUT = 2000 // Reset pattern after 2 seconds of inactivity

export default function SecretPatternHandler() {
  const router = useRouter()
  const [pattern, setPattern] = useState<string[]>([])
  const lastTapTime = useRef<number>(0)
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleTap = (e: MouseEvent | TouchEvent) => {
      // Only detect taps on background, not on interactive elements
      const target = e.target as HTMLElement
      if (
        target.closest('canvas') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]')
      ) {
        return
      }

      const now = Date.now()
      const timeSinceLastTap = now - lastTapTime.current

      // Determine if this is a dot or dash
      let tapType: 'dot' | 'dash'
      if (timeSinceLastTap === 0 || timeSinceLastTap < DOT_THRESHOLD) {
        tapType = 'dot'
      } else {
        tapType = 'dash'
      }

      // Clear reset timeout
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }

      // Add to pattern
      setPattern((prev) => {
        const newPattern = [...prev, tapType]

        // Check if pattern matches
        if (newPattern.length === TARGET_PATTERN.length) {
          const matches = newPattern.every(
            (tap, index) => tap === TARGET_PATTERN[index]
          )

          if (matches) {
            // Pattern matched! Redirect to secret page
            router.push('/estaenamorado')
            return []
          } else {
            // Pattern doesn't match, reset
            return []
          }
        }

        // If pattern is too long, reset
        if (newPattern.length > TARGET_PATTERN.length) {
          return [tapType]
        }

        return newPattern
      })

      lastTapTime.current = now

      // Set reset timeout
      resetTimeoutRef.current = setTimeout(() => {
        setPattern([])
        lastTapTime.current = 0
      }, RESET_TIMEOUT)
    }

    // Add event listeners
    window.addEventListener('click', handleTap)
    window.addEventListener('touchstart', handleTap)

    return () => {
      window.removeEventListener('click', handleTap)
      window.removeEventListener('touchstart', handleTap)
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [router])

  return null // This component doesn't render anything
}

