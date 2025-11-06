'use client'

import { useState } from 'react'
import GlobeComponent from '@/components/Globe'
import PostModal from '@/components/PostModal'
import PasswordPrompt from '@/components/PasswordPrompt'
import type { Database } from '@/lib/supabase'

type Post = Database['public']['Tables']['posts']['Row']

export default function SecretGlobePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const handlePostClick = (post: Post) => {
    setSelectedPost(post)
  }

  if (!isAuthenticated) {
    return <PasswordPrompt onSuccess={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="relative w-screen h-screen cosmic-bg overflow-hidden">
      <GlobeComponent isSecret={true} onPostClick={handlePostClick} />

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  )
}

