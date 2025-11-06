import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'A10xander - Globe',
  description: 'A personal globe-based website',
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

