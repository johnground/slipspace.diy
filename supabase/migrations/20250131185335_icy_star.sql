-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  phone text,
  date_of_birth date,
  location text,
  bio text,
  avatar_url text,
  language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  newsletter_subscription boolean DEFAULT false,
  marketing_emails boolean DEFAULT false,
  profile_visibility text DEFAULT 'private' CHECK (profile_visibility IN ('public', 'private', 'contacts')),
  data_sharing boolean DEFAULT false,
  font_size text DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  color_scheme text DEFAULT 'default' CHECK (color_scheme IN ('default', 'high-contrast', 'subtle')),
  social_links jsonb DEFAULT '{"twitter": null, "linkedin": null, "github": null}'::jsonb,
  professional_info jsonb DEFAULT '{"title": null, "company": null, "industry": null}'::jsonb,
  interests text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create base policy for users to view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create admin policy to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (check_is_admin());
