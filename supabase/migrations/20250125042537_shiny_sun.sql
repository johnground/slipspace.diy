/*
  # Fix assistants table policies

  1. Changes
    - Drop existing policies before recreating them
    - Keep table structure and trigger unchanged
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read public assistants" ON assistants;
DROP POLICY IF EXISTS "Users can read own assistants" ON assistants;
DROP POLICY IF EXISTS "Users can create assistants" ON assistants;
DROP POLICY IF EXISTS "Users can update own assistants" ON assistants;
DROP POLICY IF EXISTS "Users can delete own assistants" ON assistants;

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
