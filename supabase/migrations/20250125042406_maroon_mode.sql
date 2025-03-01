/*
  # Create assistants table

  1. New Tables
    - `assistants`
      - `id` (uuid, primary key)
      - `title` (text)
      - `system_prompt` (text)
      - `initial_message` (text)
      - `model` (text)
      - `tone` (text)
      - `expertise` (text[])
      - `custom_instructions` (text)
      - `metadata` (jsonb)
      - `created_by` (uuid, references auth.users)
      - `is_public` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `is_favorite` (boolean)
      - `last_used` (timestamptz)

  2. Security
    - Enable RLS on `assistants` table
    - Add policies for:
      - Users can read public assistants
      - Users can read their own assistants
      - Users can create assistants
      - Users can update their own assistants
      - Users can delete their own assistants
*/

-- Create assistants table
CREATE TABLE IF NOT EXISTS assistants (
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
