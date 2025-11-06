'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { createBrowserClient } from '@/lib/supabase'

interface FileWithPreview extends File {
  preview?: string
}

export default function AdminUploader() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [isSecret, setIsSecret] = useState(false)
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [textContent, setTextContent] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

      if (!user || user.id !== 'df74d913-f481-48d9-b23d-d9469fb346e2') {
        throw new Error('Unauthorized')
      }

      // Validate coordinates
      const latNum = parseFloat(lat)
      const lngNum = parseFloat(lng)
      if (isNaN(latNum) || isNaN(lngNum)) {
        throw new Error('Invalid coordinates')
      }

      // Create post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          title: title || null,
          description: description || null,
          lat: latNum,
          lng: lngNum,
          is_secret: isSecret,
          admin_id: user.id,
        })
        .select()
        .single()

      if (postError) throw postError
      if (!post) throw new Error('Failed to create post')

      // Upload files and create media records
      const mediaPromises: Promise<void>[] = []

      // Handle file uploads
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${post.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = isSecret ? `secret/${fileName}` : `public/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('media').getPublicUrl(filePath)

        // Determine media type
        let mediaType: 'image' | 'video' | 'text' = 'image'
        if (file.type.startsWith('video/')) {
          mediaType = 'video'
        }

        // Create media record
        const { error: mediaError } = await supabase.from('media').insert({
          post_id: post.id,
          type: mediaType,
          url: publicUrl,
        })

        if (mediaError) throw mediaError
      }

      // Handle text content
      if (textContent.trim()) {
        const { error: textError } = await supabase.from('media').insert({
          post_id: post.id,
          type: 'text',
          url: textContent.trim(),
        })

        if (textError) throw textError
      }

      // Clean up preview URLs
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })

      // Reset form
      setTitle('')
      setDescription('')
      setLat('')
      setLng('')
      setIsSecret(false)
      setFiles([])
      setTextContent('')
      setSuccess('Post created successfully!')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to create post')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-cosmic-green mb-6">Create New Post</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-900/20 border border-cosmic-green rounded-lg text-cosmic-green">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-cosmic-darker border border-cosmic-green/20 rounded-lg text-white focus:outline-none focus:border-cosmic-green focus:ring-1 focus:ring-cosmic-green"
            placeholder="Post title (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 bg-cosmic-darker border border-cosmic-green/20 rounded-lg text-white focus:outline-none focus:border-cosmic-green focus:ring-1 focus:ring-cosmic-green"
            placeholder="Post description (optional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full px-4 py-2 bg-cosmic-darker border border-cosmic-green/20 rounded-lg text-white focus:outline-none focus:border-cosmic-green focus:ring-1 focus:ring-cosmic-green"
              placeholder="e.g., 40.7128"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full px-4 py-2 bg-cosmic-darker border border-cosmic-green/20 rounded-lg text-white focus:outline-none focus:border-cosmic-green focus:ring-1 focus:ring-cosmic-green"
              placeholder="e.g., -74.0060"
              required
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="is-secret"
            type="checkbox"
            checked={isSecret}
            onChange={(e) => setIsSecret(e.target.checked)}
            className="w-4 h-4 text-cosmic-green bg-cosmic-darker border-cosmic-green/20 rounded focus:ring-cosmic-green"
          />
          <label htmlFor="is-secret" className="ml-2 text-gray-300">
            Mark as secret post
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Upload Media (Images/Videos)
          </label>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="w-full px-4 py-2 bg-cosmic-darker border border-cosmic-green/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cosmic-green file:text-cosmic-darker hover:file:bg-cosmic-green/80"
          />
          {files.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {files.map((file, index) => (
                <div key={index} className="relative">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-24 object-cover rounded-lg border border-cosmic-green/20"
                    />
                  ) : (
                    <div className="w-full h-24 bg-cosmic-darker rounded-lg border border-cosmic-green/20 flex items-center justify-center text-xs text-gray-400">
                      {file.name}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Text Content
          </label>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 bg-cosmic-darker border border-cosmic-green/20 rounded-lg text-white focus:outline-none focus:border-cosmic-green focus:ring-1 focus:ring-cosmic-green"
            placeholder="Add text content (optional)"
          />
        </div>

        <button
          type="submit"
          disabled={isUploading || (!lat || !lng) || (files.length === 0 && !textContent.trim())}
          className="w-full py-3 px-4 bg-cosmic-green text-cosmic-darker font-semibold rounded-lg hover:bg-cosmic-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Create Post'}
        </button>
      </form>
    </div>
  )
}

