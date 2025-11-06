-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  description TEXT,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_id UUID REFERENCES auth.users(id)
);

-- Create media table
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'text')),
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE settings (
  id INT PRIMARY KEY DEFAULT 1,
  secret_password TEXT,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default settings row
INSERT INTO settings (id, secret_password) VALUES (1, NULL);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
-- Admin can do everything
CREATE POLICY "admin_all_posts" ON posts
  FOR ALL
  USING (auth.uid() = 'df74d913-f481-48d9-b23d-d9469fb346e2'::uuid);

-- Public can only read non-secret posts
CREATE POLICY "public_read_public_posts" ON posts
  FOR SELECT
  USING (is_secret = false);

-- RLS Policies for media
-- Admin can do everything
CREATE POLICY "admin_all_media" ON media
  FOR ALL
  USING (auth.uid() = 'df74d913-f481-48d9-b23d-d9469fb346e2'::uuid);

-- Public can read media for public posts
CREATE POLICY "public_read_public_media" ON media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = media.post_id
      AND posts.is_secret = false
    )
  );

-- RLS Policies for settings
-- Only admin can read/update settings
CREATE POLICY "admin_settings" ON settings
  FOR ALL
  USING (auth.uid() = 'df74d913-f481-48d9-b23d-d9469fb346e2'::uuid);

-- Create indexes for performance
CREATE INDEX idx_posts_location ON posts(lat, lng);
CREATE INDEX idx_posts_secret ON posts(is_secret);
CREATE INDEX idx_media_post_id ON media(post_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

