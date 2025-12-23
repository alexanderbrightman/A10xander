'use client'

import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Post = Database['public']['Tables']['posts']['Row']
type Media = Database['public']['Tables']['media']['Row']

interface FileWithPreview extends File {
  preview?: string
}

interface AdminUploaderProps {
  editingPost?: Post | null
  onEditComplete?: () => void
}

export default function AdminUploader({ editingPost, onEditComplete }: AdminUploaderProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState('0')
  const [lng, setLng] = useState('0')
  const [isSecret, setIsSecret] = useState(false)
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [existingMedia, setExistingMedia] = useState<Media[]>([])
  const [mediaToDelete, setMediaToDelete] = useState<string[]>([])
  const [textContent, setTextContent] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [success, setSuccess] = useState('')

  // Load data when editing a post
  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || '')
      setDescription(editingPost.description || '')
      setLat(editingPost.lat?.toString() || '0')
      setLng(editingPost.lng?.toString() || '0')
      setIsSecret(editingPost.is_secret || false)

      // Fetch existing media for this post
      const postId = editingPost.id
      async function loadMedia() {
        const supabase = createBrowserClient()
        const { data } = await supabase
          .from('media')
          .select('*')
          .eq('post_id', postId)

        if (data) {
          const mediaData = data as Media[]
          setExistingMedia(mediaData)
          // If there's text media, load it
          const textMedia = mediaData.find(m => m.type === 'text')
          if (textMedia) {
            setTextContent(textMedia.url)
          }
        }
      }
      loadMedia()
    } else {
      // Reset form when not editing
      resetForm()
    }
  }, [editingPost])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setLat('0')
    setLng('0')
    setIsSecret(false)
    setFiles([])
    setExistingMedia([])
    setMediaToDelete([])
    setTextContent('')
    setError('')
    setSuccess('')
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const newFiles = selectedFiles.map((file) => {
      const fileWithPreview: FileWithPreview = file
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file)
      }
      return fileWithPreview
    })
    setFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const removeExistingMedia = (mediaId: string) => {
    setMediaToDelete(prev => [...prev, mediaId])
    setExistingMedia(prev => prev.filter(m => m.id !== mediaId))
  }

  const moveFile = (fromIndex: number, toIndex: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      const [moved] = newFiles.splice(fromIndex, 1)
      newFiles.splice(toIndex, 0, moved)
      return newFiles
    })
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      moveFile(draggedIndex, index)
      setDraggedIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsUploading(true)

    try {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Unauthorized')
      }

      const latNum = parseFloat(lat)
      const lngNum = parseFloat(lng)
      if (isNaN(latNum) || isNaN(lngNum)) {
        throw new Error('Invalid coordinates')
      }

      let postId: string

      if (editingPost) {
        // UPDATE existing post
        const { error: updateError } = await (supabase
          .from('posts') as any)
          .update({
            title: title || null,
            description: description || null,
            lat: latNum,
            lng: lngNum,
            is_secret: isSecret,
          })
          .eq('id', editingPost.id)

        if (updateError) throw updateError
        postId = editingPost.id

        // Delete marked media
        for (const mediaId of mediaToDelete) {
          await supabase.from('media').delete().eq('id', mediaId)
        }

        // Update or create text content
        const existingTextMedia = existingMedia.find(m => m.type === 'text')
        if (textContent.trim()) {
          if (existingTextMedia && !mediaToDelete.includes(existingTextMedia.id)) {
            await (supabase
              .from('media') as any)
              .update({ url: textContent.trim() })
              .eq('id', existingTextMedia.id)
          } else {
            await (supabase.from('media') as any).insert({
              post_id: postId,
              type: 'text',
              url: textContent.trim(),
            })
          }
        }
      } else {
        // CREATE new post
        const postInsert: Database['public']['Tables']['posts']['Insert'] = {
          title: title || null,
          description: description || null,
          lat: latNum,
          lng: lngNum,
          is_secret: isSecret,
          admin_id: user.id,
        }

        const { data: post, error: postError } = await (supabase
          .from('posts') as any)
          .insert(postInsert)
          .select()
          .single()

        if (postError) throw postError
        if (!post) throw new Error('Failed to create post')
        postId = post.id

        // Add text content for new post
        if (textContent.trim()) {
          const { error: textError } = await (supabase.from('media') as any).insert({
            post_id: postId,
            type: 'text',
            url: textContent.trim(),
          } as Database['public']['Tables']['media']['Insert'])

          if (textError) throw textError
        }
      }

      // Upload new files (for both create and edit)
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${postId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = isSecret ? `secret/${fileName}` : `public/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('media').getPublicUrl(filePath)

        let mediaType: 'image' | 'video' | 'text' = 'image'
        if (file.type.startsWith('video/')) {
          mediaType = 'video'
        }

        // Calculate order: existing media count + new file index
        const orderIndex = existingMedia.filter(m => !mediaToDelete.includes(m.id)).length + i

        const { error: mediaError } = await (supabase.from('media') as any).insert({
          post_id: postId,
          type: mediaType,
          url: publicUrl,
          order: orderIndex,
        } as Database['public']['Tables']['media']['Insert'])

        if (mediaError) throw mediaError
      }

      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })

      if (editingPost) {
        setSuccess('Post updated successfully!')
        setTimeout(() => {
          setSuccess('')
          onEditComplete?.()
        }, 1500)
      } else {
        resetForm()
        setSuccess('Post created successfully!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save post')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    resetForm()
    onEditComplete?.()
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white dark:bg-black min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-light text-gray-900 dark:text-white tracking-wide uppercase">
          {editingPost ? 'Edit Transmission' : 'New Transmission'}
        </h2>
        {editingPost && (
          <button
            type="button"
            onClick={handleCancel}
            className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border-l-2 border-red-500">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm border-l-2 border-green-500">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-0 py-2 bg-transparent border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
              placeholder="Enter title..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-0 py-2 bg-transparent border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
              placeholder="Enter description..."
            />
          </div>

          <div className="hidden">
            <input type="hidden" value={lat} />
            <input type="hidden" value={lng} />
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <input
              id="is-secret"
              type="checkbox"
              checked={isSecret}
              onChange={(e) => setIsSecret(e.target.checked)}
              className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
            />
            <label htmlFor="is-secret" className="text-sm text-gray-600 dark:text-gray-400">
              Mark as secret (Hidden from grid)
            </label>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            Media
          </label>

          {/* Existing Media (when editing) */}
          {existingMedia.filter(m => m.type !== 'text').length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Existing media:</p>
              <div className="grid grid-cols-3 gap-4">
                {existingMedia.filter(m => m.type !== 'text').map((media) => (
                  <div key={media.id} className="relative group aspect-square">
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt="Media"
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <video
                        src={media.url}
                        className="w-full h-full object-cover rounded-md"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingMedia(media.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or MP4</p>
              </div>
              <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
            </label>
          </div>

          {files.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">New uploads (drag to reorder):</p>
              <div className="grid grid-cols-3 gap-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`relative group aspect-square cursor-grab active:cursor-grabbing transition-transform ${draggedIndex === index ? 'opacity-50 scale-95' : ''
                      }`}
                  >
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-full object-cover rounded-md pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center text-xs text-gray-400 border border-gray-200 dark:border-gray-700">
                        {file.name}
                      </div>
                    )}
                    <div className="absolute top-1 left-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-[10px] font-medium">
                      {index + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            Additional Text
          </label>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={4}
            className="w-full px-0 py-2 bg-transparent border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
            placeholder="Write something..."
          />
        </div>

        <button
          type="submit"
          disabled={isUploading || (!editingPost && files.length === 0 && !textContent.trim())}
          className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-medium text-sm rounded-none uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Saving...' : editingPost ? 'Update' : 'Identify'}
        </button>
      </form>
    </div>
  )
}
