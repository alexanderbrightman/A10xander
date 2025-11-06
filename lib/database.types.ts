// Database types
export type Database = {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          title: string | null
          description: string | null
          lat: number
          lng: number
          is_secret: boolean
          created_at: string
          admin_id: string | null
        }
        Insert: {
          id?: string
          title?: string | null
          description?: string | null
          lat: number
          lng: number
          is_secret?: boolean
          created_at?: string
          admin_id?: string | null
        }
        Update: {
          id?: string
          title?: string | null
          description?: string | null
          lat?: number
          lng?: number
          is_secret?: boolean
          created_at?: string
          admin_id?: string | null
        }
      }
      media: {
        Row: {
          id: string
          post_id: string
          type: 'image' | 'video' | 'text'
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          type: 'image' | 'video' | 'text'
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          type?: 'image' | 'video' | 'text'
          url?: string
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: number
          secret_password: string | null
        }
        Insert: {
          id?: number
          secret_password?: string | null
        }
        Update: {
          id?: number
          secret_password?: string | null
        }
      }
    }
  }
}

