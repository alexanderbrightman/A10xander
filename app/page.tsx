'use client'

import { useState, useEffect } from 'react'
import PostModal from '@/components/PostModal'
import SecretPatternHandler from '@/components/SecretPatternHandler'
import AdminAuthModal from '@/components/AdminAuthModal'
import PostCard, { PostWithMedia } from '@/components/PostCard'
import type { Database } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Post = Database['public']['Tables']['posts']['Row']

export default function Home() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [posts, setPosts] = useState<PostWithMedia[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchPosts() {
      const { createBrowserClient } = await import('@/lib/supabase')
      const supabase = createBrowserClient()

      console.log('Fetching posts...')
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          media (*)
        `)
        .eq('is_secret', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching posts:', error)
      } else {
        console.log('Posts fetched:', data?.length)
        setPosts((data as PostWithMedia[]) || [])
      }
      setLoading(false)
    }

    fetchPosts()
  }, [])

  const handlePostClick = (post: Post) => {
    setSelectedPost(post)
  }

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false)
    router.push('/admin')
  }

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-black overflow-y-auto">
      <SecretPatternHandler />

      {/* Header - Fixed Top */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-start mix-blend-difference text-white">
        <h1 className="text-xs md:text-sm font-medium tracking-widest uppercase select-none">
          Alexander Brightman
        </h1>

        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="text-xs font-medium hover:opacity-70 transition-opacity uppercase tracking-widest"
        >
          Admin
        </button>
      </header>

      {/* Main Content - Grid of Posts */}
      <div className="container mx-auto px-4 pt-32 pb-12">

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

      <AdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}

