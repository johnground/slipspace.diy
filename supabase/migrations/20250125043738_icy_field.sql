/*
  # Fix assistants table structure

  1. Changes
    - Drop existing assistants table
    - Recreate with correct column names (snake_case)
    - Add proper indexes and constraints
    - Set up RLS policies
*/

-- Drop existing table and related objects
DROP TABLE IF EXISTS assistants CASCADE;

-- Create assistants table
CREATE TABLE assistants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  system_prompt text NOT NULL,
  initial_message text NOT NULL,
  model text NOT NULL,
  tone text NOT NULL CHECK (tone IN ('professional', 'friendly', 'technical')),
  expertise text[] NOT NULL DEFAULT '{}',
  custom_instructions text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_favorite boolean DEFAULT false,
  last_used timestamptz
);

-- Enable RLS
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read public assistants"
  ON assistants
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can read own assistants"
  ON assistants
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create assistants"
  ON assistants
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own assistants"
  ON assistants
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own assistants"
  ON assistants
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Add indexes for better query performance
CREATE INDEX idx_assistants_created_by ON assistants(created_by);
CREATE INDEX idx_assistants_is_public ON assistants(is_public);
CREATE INDEX idx_assistants_created_at ON assistants(created_at DESC);
CREATE INDEX idx_assistants_creator_public ON assistants(created_by, is_public);

-- Function to handle assistant updates
CREATE OR REPLACE FUNCTION handle_assistant_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating updated_at
CREATE TRIGGER update_assistants_updated_at
  BEFORE UPDATE ON assistants
  FOR EACH ROW
  EXECUTE FUNCTION handle_assistant_update();
