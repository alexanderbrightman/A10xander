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
    const handleClick = (e: MouseEvent) => {
      // Only detect clicks on background, not on interactive elements
      const target = e.target as HTMLElement

      // Ignore clicks on interactive elements
      if (
        target.closest('canvas') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('div[class*="modal"]') ||
        target.closest('div[class*="Modal"]')
      ) {
        return
      }

      // Process clicks on the document body/background
      // We rely on the interactive element check above to filter out UI clicks
      if (target !== document.body && target.parentElement !== document.body && !target.classList.contains('absolute')) {
        // Optionally restrict further if needed, but the exclusion list above is robust
      }

      const now = Date.now()
      const timeSinceLastTap = now - lastTapTime.current

      // Determine if this is a dot or dash based on time since last tap
      // Pattern: . - . . means: quick, pause, quick, quick
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
    document.addEventListener('click', handleClick, true) // Use capture phase

    // Also handle touch events
    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest('canvas') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('div[class*="modal"]') ||
        target.closest('div[class*="Modal"]')
      ) {
        return
      }
      // Reusing logic

      handleClick(e as any) // Reuse the same logic
    }

    document.addEventListener('touchend', handleTouchEnd, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('touchend', handleTouchEnd, true)
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [router])

  return null // This component doesn't render anything
}

