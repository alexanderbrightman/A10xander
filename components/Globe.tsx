'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Stars, Html, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { createBrowserClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Post = Database['public']['Tables']['posts']['Row']

interface GlobeProps {
  isSecret?: boolean
  onPostClick?: (post: Post) => void
}

interface MarkerProps {
  post: Post
  onSelect?: (post: Post) => void
}

interface EarthTextures {
  map: THREE.Texture
  bumpMap: THREE.Texture
  roughnessMap?: THREE.Texture
  emissiveMap?: THREE.Texture
}

const EARTH_TEXTURE_PATHS = {
  map: '/textures/earth/earth-base.png',
  bumpMap: '/textures/earth/earth-bump.png',
  roughnessMap: '/textures/earth/earth-specular.png',
  emissiveMap: '/textures/earth/earth-lights.png',
} as const

function configureTexture(texture: THREE.Texture, options?: { wrap?: THREE.Wrapping; anisotropy?: number }) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = options?.wrap ?? THREE.ClampToEdgeWrapping
  texture.wrapT = options?.wrap ?? THREE.ClampToEdgeWrapping
  texture.anisotropy = options?.anisotropy ?? Math.min(16, texture.anisotropy || 8)
  texture.needsUpdate = true
}

function createBrightenedEarthTexture(sourceTexture: THREE.Texture): THREE.Texture | undefined {
  if (typeof document === 'undefined') return undefined

  const source = sourceTexture.image as HTMLImageElement | HTMLCanvasElement | ImageBitmap | undefined
  if (!source) return undefined

  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return undefined

  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    const isOcean = b > r + 10 && b > g + 10
    const lift = isOcean ? 0.06 : 0.22
    const bias = isOcean ? 6 : 24
    const contrast = isOcean ? 1.04 : 1.12

    const adjust = (channel: number) => {
      const centered = channel - 128
      const contrasted = centered * contrast
      const brightened = (contrasted + 128) * (1 + lift) + bias
      return THREE.MathUtils.clamp(brightened, 0, 255)
    }

    data[i] = adjust(r)
    data[i + 1] = adjust(g)
    data[i + 2] = adjust(b)
  }

  context.putImageData(imageData, 0, 0)

  const brightTexture = new THREE.CanvasTexture(canvas)
  configureTexture(brightTexture)
  brightTexture.generateMipmaps = true

  return brightTexture
}

function useBrightenedEarthTexture(texture?: THREE.Texture) {
  const brightened = useMemo(() => {
    if (!texture) return undefined
    const enhanced = createBrightenedEarthTexture(texture)
    return enhanced ?? texture
  }, [texture])

  useEffect(() => {
    return () => {
      if (brightened && texture && brightened.uuid !== texture.uuid) {
        brightened.dispose()
      }
    }
  }, [brightened, texture])

  return brightened ?? texture
}

function useEarthTextures(): EarthTextures {
  const [map, bumpMap] = useTexture([EARTH_TEXTURE_PATHS.map, EARTH_TEXTURE_PATHS.bumpMap])
  const [optionalTextures, setOptionalTextures] = useState<Pick<EarthTextures, 'roughnessMap' | 'emissiveMap'>>({})

  useMemo(() => {
    configureTexture(map)
    configureTexture(bumpMap, { wrap: THREE.RepeatWrapping })
  }, [map, bumpMap])

  useEffect(() => {
    let isMounted = true
    const loader = new THREE.TextureLoader()

    const loadOptional = async (key: keyof typeof optionalTextures, path: string) => {
      try {
        const texture = await loader.loadAsync(path)
        configureTexture(texture)
        if (!isMounted) return
        setOptionalTextures((prev) => ({ ...prev, [key]: texture }))
      } catch (error) {
        console.warn(`[Globe] Optional texture load failed for ${path}`, error)
      }
    }

    loadOptional('roughnessMap', EARTH_TEXTURE_PATHS.roughnessMap)
    loadOptional('emissiveMap', EARTH_TEXTURE_PATHS.emissiveMap)

    return () => {
      isMounted = false
    }
  }, [])

  return {
    map,
    bumpMap,
    ...optionalTextures,
  }
}

function latLngToVector3(lat: number, lng: number, radius = 1.02): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)

  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

function Marker({ post, onSelect }: MarkerProps) {
  const [hovered, setHovered] = useState(false)
  const position = useMemo(() => latLngToVector3(post.lat, post.lng), [post.lat, post.lng])
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    if (!groupRef.current) return
    groupRef.current.lookAt(0, 0, 0)
    groupRef.current.rotateX(Math.PI / 2)
  }, [position])

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 2.5) * 0.12
      const target = hovered ? 1.55 : pulse
      const current = meshRef.current.scale.x
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(current, target, 0.12))
    }

    if (haloRef.current) {
      const baseScale = hovered ? 1.9 : 1.4
      const wave = Math.sin(clock.elapsedTime * 3.2) * 0.08
      haloRef.current.scale.setScalar(baseScale + wave)

      const material = haloRef.current.material as THREE.MeshBasicMaterial
      material.opacity = hovered ? 0.38 : 0.18 + Math.max(0, wave)
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh
        ref={haloRef}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
        onClick={(event) => {
          event.stopPropagation()
          onSelect?.(post)
        }}
      >
        <ringGeometry args={[0.018, 0.028, 24]} />
        <meshBasicMaterial color="#27ff9d" transparent opacity={0.22} />
      </mesh>

      <Sphere
        args={[0.015, 16, 16]}
        ref={meshRef}
        onClick={(event) => {
          event.stopPropagation()
          onSelect?.(post)
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <meshStandardMaterial
          color="#27ff9d"
          emissive="#27ff9d"
          emissiveIntensity={hovered ? 1.6 : 0.8}
          roughness={0.45}
          metalness={0.1}
        />
      </Sphere>
    </group>
  )
}

function Earth() {
  const { map, bumpMap, roughnessMap, emissiveMap } = useEarthTextures()
  const brightenedMap = useBrightenedEarthTexture(map)

  return (
    <Sphere args={[1, 256, 256]}>
      <meshStandardMaterial
        map={brightenedMap}
        bumpMap={bumpMap}
        bumpScale={0.015}
        roughness={0.55}
        roughnessMap={roughnessMap}
        metalness={0.06}
        metalnessMap={roughnessMap}
        emissiveMap={emissiveMap}
        emissiveIntensity={emissiveMap ? 0.08 : 0}
        emissive={emissiveMap ? new THREE.Color('#1b2945') : undefined}
      />
    </Sphere>
  )
}

function GlobeScene({ posts, onPostClick }: { posts: Post[]; onPostClick?: (post: Post) => void }) {
  return (
    <>
      <color attach="background" args={[0, 0, 0]} />
      <ambientLight intensity={1.05} />
      <hemisphereLight args={['#6fa6ff', '#0a1a33', 0.45]} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <directionalLight position={[-3, -2, -4]} intensity={0.35} />
      <Stars radius={120} depth={50} count={6000} factor={4} fade speed={0.8} />
      <Suspense fallback={<Html center className="text-cosmic-green">Loading Earth...</Html>}>
        <Earth />
      </Suspense>

      {posts.map((post) => (
        <Marker key={post.id} post={post} onSelect={onPostClick} />
      ))}

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        zoomSpeed={0.7}
        rotateSpeed={0.75}
        enableDamping={true}
        dampingFactor={0.08}
        minDistance={1.5}
        maxDistance={5}
      />
    </>
  )
}

export default function GlobeComponent({ isSecret = false, onPostClick }: GlobeProps) {
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

        query = query.eq('is_secret', isSecret)

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

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-cosmic-green animate-pulse">Loading globe...</div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
      <Canvas
        camera={{ position: [0, 0, 2.6], fov: 50 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <GlobeScene posts={posts} onPostClick={onPostClick} />
      </Canvas>
    </div>
  )
}
