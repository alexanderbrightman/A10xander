'use client'

import { useState, useEffect } from 'react'
import PostModal from '@/components/PostModal'
import PasswordPrompt from '@/components/PasswordPrompt'
import PostCard, { PostWithMedia } from '@/components/PostCard'
import type { Database } from '@/lib/supabase'

type Post = Database['public']['Tables']['posts']['Row']

export default function SecretPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [posts, setPosts] = useState<PostWithMedia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) return

    async function fetchPosts() {
      const { createBrowserClient } = await import('@/lib/supabase')
      const supabase = createBrowserClient()

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          media (*)
        `)
        .eq('is_secret', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching secret posts:', error)
      } else {
        setPosts((data as PostWithMedia[]) || [])
      }
      setLoading(false)
    }

    fetchPosts()
  }, [isAuthenticated])

  const handlePostClick = (post: Post) => {
    setSelectedPost(post)
  }

  if (!isAuthenticated) {
    return <PasswordPrompt onSuccess={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-black overflow-y-auto">

      <div className="fixed top-6 left-6 z-50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 text-black dark:text-white"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 py-24 md:py-32">

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-1 h-1 bg-gray-900 dark:bg-white rounded-full animate-ping"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onClick={handlePostClick}
              />
            ))}
          </div>
        )}

        {posts.length === 0 && !loading && (
          <div className="text-center text-gray-400 font-light mt-12 text-sm tracking-widest uppercase">
            Void
          </div>
        )}
      </div>

      {selectedPost && (
        <PostModal post={selectedPost as Post} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  )
}

