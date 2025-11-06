# Step-by-Step Setup Guide

## ✅ Step 1: Dependencies Installed
Dependencies have been installed successfully.

## 📝 Step 2: Create Environment Variables File

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your actual values (you'll get these from Supabase in the next step).

## 🗄️ Step 3: Set Up Supabase

### 3.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: `a10xander-globe` (or your choice)
   - **Database Password**: Save this securely (you'll need it)
   - **Region**: Choose closest to you
4. Wait for project to be created (2-3 minutes)

### 3.2 Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values to your `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 3.3 Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

This creates:
- `posts` table (stores post data with geolocation)
- `media` table (stores media files linked to posts)
- `settings` table (for future use)
- **RLS policies** that restrict access to only your admin UUID

### 3.4 Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click "Create bucket"
3. Name it: `media`
4. **Important**: Make it **Public** (or configure RLS later for secret posts)
5. Click "Create bucket"

**Optional but recommended**: Create folders inside the bucket:
- `public/` - for public post media
- `secret/` - for secret post media

### 3.5 Disable Public Signups

1. Go to **Authentication** → **Settings**
2. Scroll to "Auth Providers"
3. Find "Enable email signups" and **turn it OFF**
4. This ensures only you can create accounts

### 3.6 Create Your Admin Account

Since signups are disabled, you need to create your account manually:

1. Go to **Authentication** → **Users**
2. Click "Add user" → "Create new user"
3. Enter your email
4. Set a password (or leave blank for magic link)
5. **Important**: After creating, copy the **User UID** from the users table
6. Verify it matches: `df74d913-f481-48d9-b23d-d9469fb346e2`
   - If it doesn't match, update the UUID in:
     - `lib/auth.ts` (line with ADMIN_UUID)
     - `middleware.ts` (line with ADMIN_UUID)
     - `supabase/migrations/001_initial_schema.sql` (in RLS policies)
     - Re-run the migration

## 🔐 Step 4: Configure Environment Variables

Edit `.env.local` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
ADMIN_UUID=df74d913-f481-48d9-b23d-d9469fb346e2
NEXT_PUBLIC_SECRET_PASSWORD=your_secret_password_here
```

**Important**: 
- Replace `your_secret_password_here` with a strong password
- Never commit `.env.local` to git (it's already in `.gitignore`)

## 🚀 Step 5: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see:
- A dark starfield background
- An interactive globe (empty if no posts yet)
- "Admin" link in bottom-right corner

## 🧪 Step 6: Test the Application

### Test Admin Login

1. Click "Admin" in bottom-right
2. Enter your email and password (or use magic link)
3. You should be redirected to `/admin`

### Create Your First Post

1. In the admin dashboard, fill out the form:
   - **Title**: "Test Post"
   - **Description**: "My first post"
   - **Latitude**: `40.7128` (New York)
   - **Longitude**: `-74.0060`
   - Upload an image or add text
2. Click "Create Post"
3. You should see a success message

### View Post on Globe

1. Go back to `/` (home page)
2. You should see a green glowing dot on the globe
3. Click the dot to see your post in a modal

### Test Secret Globe

1. On the home page, tap the background (not the globe) in this pattern:
   - Quick tap (dot)
   - Long tap/pause (dash)
   - Quick tap (dot)
   - Quick tap (dot)
   - Pattern: `. - . .`
2. You should be redirected to `/estaenamorado`
3. Enter your secret password
4. If you created a secret post, it should appear

## 🐛 Troubleshooting

### "Invalid API key" error
- Check your `.env.local` file has correct Supabase credentials
- Restart the dev server after changing env vars

### "Unauthorized" when accessing `/admin`
- Verify your user UUID matches the hardcoded UUID
- Check you're logged in with the correct account
- Clear browser cookies and try again

### Globe not showing
- Check browser console for errors
- Ensure you have WebGL enabled in your browser
- Try a different browser (Chrome/Firefox recommended)

### Posts not appearing
- Check Supabase dashboard → Table Editor → `posts` table
- Verify RLS policies are active (should see lock icons)
- Check browser console for errors

### File upload fails
- Verify storage bucket `media` exists and is public
- Check file size limits in Supabase Storage settings
- Ensure you're logged in as admin

## 📦 Next: Deploy to Vercel

Once everything works locally:

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add all environment variables from `.env.local`
5. Deploy!

The app will be live at `your-project.vercel.app`

