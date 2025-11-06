# A10xander Globe Website

A personal website featuring an interactive WebGL globe displaying geolocated posts (photos, videos, text) with public and secret access modes.

## Tech Stack

- **Next.js 14+** (App Router)
- **Supabase** (Auth, Storage, Database, RLS)
- **Vercel** (Deployment)
- **TailwindCSS** (Styling)
- **TypeScript**
- **react-globe.gl** (WebGL Globe)

## Features

- 🌍 **Interactive Globe**: Fullscreen WebGL globe with geolocated posts
- 🔒 **Public & Secret Posts**: Separate globes for public and secret content
- 🔐 **Admin Dashboard**: Secure admin-only interface for managing posts
- 🎯 **Morse Code Unlock**: Hidden gesture pattern (`. - . .`) to access secret globe
- 📸 **Media Support**: Upload and display images, videos, and text content
- 🎨 **Dark Cosmic Theme**: Beautiful starfield background with green glowing markers

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (server-side only)
- `NEXT_PUBLIC_SECRET_PASSWORD`: Password for accessing secret globe
- `ADMIN_UUID`: Your admin user UUID (already set to `df74d913-f481-48d9-b23d-d9469fb346e2`)

### 3. Set Up Supabase

1. Create a new Supabase project
2. Run the migration file in `supabase/migrations/001_initial_schema.sql` to create:
   - `posts` table
   - `media` table
   - `settings` table
   - RLS policies with hardcoded admin UUID
3. Create a storage bucket named `media`:
   - Go to Storage in Supabase dashboard
   - Create bucket: `media`
   - Set to public (or configure RLS for secret posts)
   - Create folders: `public/` and `secret/` (optional, but recommended)
4. Disable public signups in Authentication settings:
   - Go to Authentication > Settings
   - Disable "Enable email signups"

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /admin          # Admin dashboard (protected)
  /estaenamorado  # Secret globe page
  page.tsx        # Public landing page
  layout.tsx      # Root layout
  globals.css     # Global styles

/components
  Globe.tsx              # WebGL globe component
  PostModal.tsx          # Media gallery modal
  SecretPatternHandler.tsx  # Morse code detection
  PasswordPrompt.tsx     # Secret page password entry
  AdminAuthModal.tsx     # Admin login modal
  AdminUploader.tsx      # Post creation form

/lib
  supabase.ts    # Supabase client utilities
  auth.ts        # Auth helper functions

/middleware.ts   # Route protection middleware
```

## Security

- **Admin-only Access**: Hardcoded UUID in RLS policies and middleware
- **No Public Signups**: Supabase signups disabled
- **RLS Policies**: Database-level access control
- **Middleware Protection**: Route-level authorization for `/admin`
- **Secret Password**: Environment variable (not stored in DB)

## Usage

### Public Globe (`/`)

- View public posts on the interactive globe
- Click markers to see media for that location
- Tap background in Morse pattern `. - . .` to unlock secret page
- Click "Admin" link in bottom corner to login

### Secret Globe (`/estaenamorado`)

- Requires password (from `NEXT_PUBLIC_SECRET_PASSWORD`)
- Shows only posts marked as `is_secret = true`
- Same UI as public globe

### Admin Dashboard (`/admin`)

- Protected route (requires admin UUID)
- Upload images/videos/text
- Set geolocation (lat/lng)
- Mark posts as secret
- Manage existing posts

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The app will automatically build and deploy.

## Notes

- Admin UUID is hardcoded: `df74d913-f481-48d9-b23d-d9469fb346e2`
- Secret password is stored in environment variable, not database
- Media files are stored in Supabase Storage bucket `media`
- RLS policies ensure only admin can create/edit/delete posts

