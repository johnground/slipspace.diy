/*
  # Add admin roles and video storage functionality

  1. New Tables
    - `user_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role` (text, either 'admin' or 'user')
      - `created_at` (timestamp)
    
    - `video_uploads`
      - `id` (uuid, primary key)
      - `file_path` (text, unique)
      - `uploaded_by` (uuid, references auth.users)
      - `original_name` (text)
      - `file_size` (bigint)
      - `content_type` (text)
      - `created_at` (timestamp)

  2. Storage
    - Create videos bucket for storing video files
    - Set up storage policies for admin access

  3. Security
    - Enable RLS on all tables
    - Add policies for admin access
    - Add policies for video access
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create video_uploads table
CREATE TABLE IF NOT EXISTS video_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text UNIQUE NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) NOT NULL,
  original_name text NOT NULL,
  file_size bigint NOT NULL,
  content_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_uploads ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policies for video_uploads
CREATE POLICY "Admins can manage video uploads"
  ON video_uploads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can view video uploads"
  ON video_uploads
  FOR SELECT
  TO authenticated
  USING (true);

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name)
VALUES ('videos', 'videos')
ON CONFLICT DO NOTHING;

-- Storage policies for videos bucket
CREATE POLICY "Admins can upload videos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'videos'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view videos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'videos');

CREATE POLICY "Admins can update and delete videos"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'videos'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = $1
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
