'use client'

import { useEffect, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import { createBrowserClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Post = Database['public']['Tables']['posts']['Row']

interface GlobeProps {
  isSecret?: boolean
  onPostClick?: (post: Post) => void
}

export default function GlobeComponent({ isSecret = false, onPostClick }: GlobeProps) {
  const globeEl = useRef<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const supabase = createBrowserClient()
        
        let query = supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })

        if (isSecret) {
          // For secret globe, we need to fetch secret posts
          // This will be filtered by RLS if user doesn't have access
          query = query.eq('is_secret', true)
        } else {
          query = query.eq('is_secret', false)
        }

        const { data, error } = await query

        if (error) {
          console.error('Error fetching posts:', error)
          setPosts([])
        } else {
          setPosts(data || [])
        }
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [isSecret])

  useEffect(() => {
    if (globeEl.current) {
      // Set initial camera position
      const controls = globeEl.current.controls()
      if (controls) {
        controls.autoRotate = true
        controls.autoRotateSpeed = 0.5
        controls.enableDamping = true
        controls.dampingFactor = 0.1
      }
    }
  }, [])

  const handleMarkerClick = (marker: any) => {
    const post = posts.find((p) => p.lat === marker.lat && p.lng === marker.lng)
    if (post && onPostClick) {
      onPostClick(post)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-cosmic-green animate-pulse">Loading globe...</div>
      </div>
    )
  }

  const markers = posts.map((post) => ({
    lat: post.lat,
    lng: post.lng,
    size: 0.3,
    color: '#00ff88',
  }))

  return (
    <div className="w-full h-full">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        pointsData={markers}
        pointColor="color"
        pointRadius="size"
        pointLabel={() => ''}
        onPointClick={handleMarkerClick}
        pointResolution={2}
        showAtmosphere={true}
        atmosphereColor="#00ff88"
        atmosphereAltitude={0.15}
        enablePointerInteraction={true}
        animateIn={true}
      />
    </div>
  )
}

