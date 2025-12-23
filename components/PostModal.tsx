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

  useEffect(() => {
    async function fetchMedia() {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('post_id', post.id)
        .order('order', { ascending: true })

      if (error) {
        console.error('Error fetching media:', error)
      } else {
        setMedia(data || [])
      }
      setLoading(false)
    }

    fetchMedia()
  }, [post.id])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Separate text content from visual media
  const visualMedia = media.filter(m => m.type === 'image' || m.type === 'video')
  const textMedia = media.filter(m => m.type === 'text')

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 p-2 text-white/60 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Header - Title and Description */}
      <div className="shrink-0 px-6 pt-6 pb-4">
        <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white">{post.title || 'Untitled'}</h2>
        {post.description && (
          <p className="mt-2 text-white/50 font-light text-sm md:text-base max-w-2xl">{post.description}</p>
        )}
      </div>

      {/* Media Gallery - Horizontal Scroll */}
      <div className="flex-1 flex items-center overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center w-full">
            <div className="w-1 h-1 bg-white rounded-full animate-ping"></div>
          </div>
        ) : visualMedia.length === 0 && textMedia.length === 0 ? (
          <div className="flex items-center justify-center w-full">
            <p className="text-white/30 font-light italic">Empty</p>
          </div>
        ) : (
          <div className="w-full h-full overflow-x-auto overflow-y-hidden scrollbar-hide">
            <div className="flex items-center h-full gap-4 px-6 min-w-min">
              {visualMedia.map((item) => (
                <div
                  key={item.id}
                  className="shrink-0 h-[80vh] flex items-center justify-center"
                >
                  {item.type === 'image' && (
                    <Image
                      src={item.url}
                      alt={post.title || 'Post image'}
                      width={1920}
                      height={1080}
                      className="h-full w-auto max-w-[90vw] object-contain"
                      unoptimized
                    />
                  )}
                  {item.type === 'video' && (
                    <video
                      src={item.url}
                      controls
                      className="h-full w-auto max-w-[90vw] object-contain"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Text Content - Below Images */}
      {textMedia.length > 0 && (
        <div className="shrink-0 px-6 pb-6 pt-4 border-t border-white/10">
          {textMedia.map((item) => (
            <p key={item.id} className="text-white/80 whitespace-pre-wrap font-serif leading-loose text-lg max-w-2xl">
              {item.url}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
