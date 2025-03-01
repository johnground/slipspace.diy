/*
  # Add index to assistants table

  1. Changes
    - Add index on created_by column for better query performance
    - Add index on is_public column for faster public assistant lookups
    - Add index on created_at for faster sorting
  
  2. Benefits
    - Improved query performance for filtering by creator
    - Faster public assistant lookups
    - Better performance for sorting by creation date
*/

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assistants_created_by ON assistants(created_by);
CREATE INDEX IF NOT EXISTS idx_assistants_is_public ON assistants(is_public);
CREATE INDEX IF NOT EXISTS idx_assistants_created_at ON assistants(created_at DESC);

-- Add combined index for common query patterns
CREATE INDEX IF NOT EXISTS idx_assistants_creator_public ON assistants(created_by, is_public);
