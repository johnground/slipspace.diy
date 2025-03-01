-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  language TEXT DEFAULT 'en' NOT NULL,
  timezone TEXT DEFAULT 'UTC' NOT NULL,
  email_notifications BOOLEAN DEFAULT TRUE NOT NULL,
  push_notifications BOOLEAN DEFAULT TRUE NOT NULL,
  newsletter_subscription BOOLEAN DEFAULT FALSE NOT NULL,
  marketing_emails BOOLEAN DEFAULT FALSE NOT NULL,
  profile_visibility TEXT DEFAULT 'private' NOT NULL,
  data_sharing BOOLEAN DEFAULT FALSE NOT NULL,
  font_size TEXT DEFAULT 'medium' NOT NULL,
  color_scheme TEXT DEFAULT 'dark' NOT NULL,
  social_links JSONB DEFAULT '{}'::JSONB NOT NULL,
  professional_info JSONB DEFAULT '{}'::JSONB NOT NULL,
  interests TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create RLS policies for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own profile
CREATE POLICY "Users can read their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
