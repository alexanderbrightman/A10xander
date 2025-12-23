'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import AdminUploader from '@/components/AdminUploader'
import type { Database } from '@/lib/supabase'

type Post = Database['public']['Tables']['posts']['Row']

export default function AdminDashboard() {
  const router = useRouter()
  const [posts, setPosts] = useState<(Post & { media_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  useEffect(() => {
    async function checkAuth() {
      console.log('Admin page - Starting auth check')
      console.log('Admin page - Current URL:', window.location.href)

      const supabase = createBrowserClient()

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      console.log('Admin page - Session check:', { session: sessionData?.session?.user?.id, error: sessionError })

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      console.log('Admin page - Auth check:', { user: user?.id, error })

      if (error) {
        console.error('Admin page - Auth error:', error)
        router.push('/')
        return
      }

      if (!user) {
        console.log('Admin page - No user found')
        router.push('/')
        return
      }

      console.log('Admin page - User ID:', user.id)

      if (user.id !== 'df74d913-f481-48d9-b23d-d9469fb346e2') {
        console.error('Admin page - Unauthorized user:', user.id)
        alert(`Unauthorized. Your user ID (${user.id}) does not match the admin ID.`)
        router.push('/')
        return
      }

      console.log('Admin page - Authorization successful')
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
    await supabase.from('media').delete().eq('post_id', postId)
    const { error } = await supabase.from('posts').delete().eq('id', postId)

    if (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    } else {
      await loadPosts()
    }
  }

  function handleEdit(post: Post) {
    setEditingPost(post)
  }

  function handleEditComplete() {
    setEditingPost(null)
    loadPosts()
  }

  async function handleLogout() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="w-1 h-1 bg-black dark:bg-white rounded-full animate-ping"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12 border-b border-gray-200 dark:border-gray-800 pb-4">
          <h1 className="text-xl font-light tracking-wide uppercase">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-xs uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Upload / Edit Section */}
          <div className="lg:col-span-2">
            <AdminUploader
              editingPost={editingPost}
              onEditComplete={handleEditComplete}
            />
          </div>

          {/* Posts List */}
          <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 pt-8 lg:pl-8 lg:pt-0">
            <h2 className="text-sm uppercase tracking-widest text-gray-500 mb-8">
              All Posts ({posts.length})
            </h2>

            {loading ? (
              <div className="text-xs text-gray-400 animate-pulse">Loading...</div>
            ) : posts.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No posts yet.</p>
            ) : (
              <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 scrollbar-hide">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="group cursor-pointer"
                    onClick={() => handleEdit(post)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium group-hover:underline">
                          {post.title || 'Untitled'}
                        </h3>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                        {post.is_secret && (
                          <span className="inline-block mt-1 text-[10px] text-gray-500 border border-gray-200 dark:border-gray-800 px-1 rounded-sm">
                            Secret
                          </span>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">
                          {post.media_count} media
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(post)
                          }}
                          className="text-[10px] text-blue-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(post.id)
                          }}
                          className="text-[10px] text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
