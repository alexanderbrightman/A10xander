'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import AdminUploader from '@/components/AdminUploader'
import type { Database } from '@/lib/supabase'

type Post = Database['public']['Tables']['posts']['Row']
type Media = Database['public']['Tables']['media']['Row']

export default function AdminDashboard() {
  const router = useRouter()
  const [posts, setPosts] = useState<(Post & { media_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || user.id !== 'df74d913-f481-48d9-b23d-d9469fb346e2') {
        router.push('/')
        return
      }

      setIsAuthorized(true)
      await loadPosts()
    }

    checkAuth()
  }, [router])

  async function loadPosts() {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading posts:', error)
    } else {
      // Get media count for each post
      const postsWithCount = await Promise.all(
        (data || []).map(async (post: Post) => {
          const { count } = await supabase
            .from('media')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
          return { ...post, media_count: count || 0 }
        })
      )
      setPosts(postsWithCount)
    }
    setLoading(false)
  }

  async function handleDelete(postId: string) {
    if (!confirm('Are you sure you want to delete this post and all its media?')) {
      return
    }

    const supabase = createBrowserClient()
    
    // Delete media first (cascade should handle this, but being explicit)
    await supabase.from('media').delete().eq('post_id', postId)
    
    // Delete post
    const { error } = await supabase.from('posts').delete().eq('id', postId)

    if (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    } else {
      await loadPosts()
    }
  }

  async function handleLogout() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen cosmic-bg">
        <div className="text-cosmic-green animate-pulse">Verifying access...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen cosmic-bg">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-cosmic-green">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <AdminUploader />
          </div>

          {/* Posts List */}
          <div className="lg:col-span-1">
            <div className="bg-cosmic-blue rounded-lg border border-cosmic-green/20 p-6">
              <h2 className="text-2xl font-bold text-cosmic-green mb-4">
                All Posts ({posts.length})
              </h2>

              {loading ? (
                <div className="text-cosmic-green animate-pulse">Loading posts...</div>
              ) : posts.length === 0 ? (
                <p className="text-gray-400">No posts yet.</p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-cosmic-darker rounded-lg border border-cosmic-green/10 p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">
                            {post.title || 'Untitled'}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(post.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-cosmic-green mt-1">
                            {post.lat.toFixed(4)}, {post.lng.toFixed(4)}
                          </p>
                          {post.is_secret && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-yellow-900/30 text-yellow-400 rounded">
                              Secret
                            </span>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {post.media_count} media
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                      {post.description && (
                        <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                          {post.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

