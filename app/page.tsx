'use client'

import { useState } from 'react'
import GlobeComponent from '@/components/Globe'
import PostModal from '@/components/PostModal'
import SecretPatternHandler from '@/components/SecretPatternHandler'
import AdminAuthModal from '@/components/AdminAuthModal'
import type { Database } from '@/lib/supabase'
import { createBrowserClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Post = Database['public']['Tables']['posts']['Row']

export default function Home() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const router = useRouter()

  const handlePostClick = (post: Post) => {
    setSelectedPost(post)
  }

  const handleAuthSuccess = () => {
    router.push('/admin')
  }

  return (
    <div className="relative w-screen h-screen cosmic-bg overflow-hidden">
      <SecretPatternHandler />
      
      <GlobeComponent onPostClick={handlePostClick} />

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}

      {/* Admin login link */}
      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="px-4 py-2 text-xs text-gray-400 hover:text-cosmic-green transition-colors opacity-50 hover:opacity-100"
        >
          Admin
        </button>
      </div>

      <AdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}

