-- =============================================
-- FIXED RLS POLICIES FOR POSTS AND MEDIA TABLES
-- =============================================
-- This version uses scalar subqueries (SELECT auth.uid()) 
-- instead of direct function calls for better performance.

-- First, drop any existing policies to start fresh
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Admin has full access to posts" ON posts;
DROP POLICY IF EXISTS "admin_all_posts" ON posts;
DROP POLICY IF EXISTS "Public media is viewable by everyone" ON media;
DROP POLICY IF EXISTS "Admin has full access to media" ON media;
DROP POLICY IF EXISTS "admin_all_media" ON media;

-- Enable Row Level Security on the tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POSTS TABLE POLICIES
-- =============================================

-- 1. Allow everyone to view posts (Select)
CREATE POLICY "public_select_posts"
ON posts FOR SELECT
USING (true);

-- 2. Allow authenticated admin to INSERT posts
CREATE POLICY "admin_insert_posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = 'df74d913-f481-48d9-b23d-d9469fb346e2'::uuid);

-- 3. Allow authenticated admin to UPDATE posts
CREATE POLICY "admin_update_posts"
ON posts FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = 'df74d913-f481-48d9-b23d-d9469fb346e2'::uuid)
WITH CHECK ((SELECT auth.uid()) = 'df74d913-f481-48d9-b23d-d9469fb346e2'::uuid);

-- 4. Allow authenticated admin to DELETE posts
CREATE POLICY "admin_delete_posts"
ON posts FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = 'df74d913-f481-48d9-b23d-d9469fb346e2'::uuid);

-- =============================================
-- MEDIA TABLE POLICIES
-- =============================================

-- 1. Allow everyone to view media (Select)
CREATE POLICY "public_select_media"
ON media FOR SELECT
USING (true);

-- 2. Allow authenticated admin to INSERT media
CREATE POLICY "admin_insert_media"
ON media FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = 'df74d913-f481-48d9-b23d-d9469fb346e2'::uuid);

-- 3. Allow authenticated admin to UPDATE media
CREATE POLICY "admin_update_media"
ON media FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = 'df74d913-f481-48d9-b23d-d9469fb346e2'::uuid)
WITH CHECK ((SELECT auth.uid()) = 'df74d913-f481-48d9-b23d-d9469fb346e2'::uuid);

-- 4. Allow authenticated admin to DELETE media
CREATE POLICY "admin_delete_media"
ON media FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = 'df74d913-f481-48d9-b23d-d9469fb346e2'::uuid);
