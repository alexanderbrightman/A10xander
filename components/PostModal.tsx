'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import Image from 'next/image'

type Media = Database['public']['Tables']['media']['Row']
type Post = Database['public']['Tables']['posts']['Row']

interface PostModalProps {
  post: Post
  onClose: () => void
}

export default function PostModal({ post, onClose }: PostModalProps) {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  useEffect(() => {
    async function fetchMedia() {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: sortOrder === 'oldest' })

      if (error) {
        console.error('Error fetching media:', error)
      } else {
        setMedia(data || [])
      }
      setLoading(false)
    }

    fetchMedia()
  }, [post.id, sortOrder])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-cosmic-blue rounded-lg shadow-2xl overflow-hidden border border-cosmic-green/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cosmic-green/20">
          <div>
            <h2 className="text-2xl font-bold text-cosmic-green">{post.title || 'Untitled Post'}</h2>
            {post.description && (
              <p className="mt-2 text-gray-300">{post.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-cosmic-green transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Sort Toggle */}
        <div className="px-6 py-4 border-b border-cosmic-green/10">
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="text-sm text-cosmic-green hover:text-cosmic-green/80 transition-colors"
          >
            Sort: {sortOrder === 'newest' ? 'Newest ↔ Oldest' : 'Oldest ↔ Newest'}
          </button>
        </div>

        {/* Media Gallery */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-cosmic-green animate-pulse">Loading media...</div>
            </div>
          ) : media.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-400">No media found for this location.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="bg-cosmic-darker rounded-lg overflow-hidden border border-cosmic-green/10"
                >
                  {item.type === 'image' && (
                    <div className="relative w-full aspect-video">
                      <Image
                        src={item.url}
                        alt={post.title || 'Post image'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  {item.type === 'video' && (
                    <video
                      src={item.url}
                      controls
                      className="w-full aspect-video object-cover"
                    />
                  )}
                  {item.type === 'text' && (
                    <div className="p-4">
                      <p className="text-gray-300 whitespace-pre-wrap">{item.url}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

