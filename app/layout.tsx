import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'A10xander',
  description: 'A personal collection of moments.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

