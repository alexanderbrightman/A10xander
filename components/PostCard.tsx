
import Image from 'next/image'
import { Database } from '@/lib/database.types'

type Post = Database['public']['Tables']['posts']['Row']
type Media = Database['public']['Tables']['media']['Row']

export type PostWithMedia = Post & { media: Media[] }

interface PostCardProps {
    post: PostWithMedia
    onClick: (post: Post) => void
}

export default function PostCard({ post, onClick }: PostCardProps) {
    // Find the first image media, or fallback to text
    const imageMedia = post.media?.find((m) => m.type === 'image')
    const textMedia = post.media?.find((m) => m.type === 'text')

    // Also check for video to show a thumbnail or placeholder? 
    // For now the requirement is "if there is a photo... if it is just a text post"
    // If video, maybe treat as text or show video placeholder? Let's prioritize image.

    return (
        <div
            onClick={() => onClick(post)}
            className="relative group aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer transition-all duration-500"
        >
            {imageMedia ? (
                <div className="relative w-full h-full">
                    <Image
                        src={imageMedia.url}
                        alt={post.title || 'Post image'}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        unoptimized
                    />
                    {/* Minimal overlay for text visibility only on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                        {post.title && (
                            <h3 className="text-white font-medium text-lg tracking-wide">{post.title}</h3>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-300">
                    {textMedia ? (
                        <p className="text-gray-600 dark:text-gray-300 font-serif leading-relaxed text-lg line-clamp-6">
                            {textMedia.url /* Assuming 'url' field holds the text for type='text' based on PostModal code */}
                        </p>
                    ) : (
                        <div className="flex flex-col items-center max-w-xs">
                            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3 tracking-tight">{post.title || 'Untitled'}</h3>
                            {post.description && (
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{post.description}</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
