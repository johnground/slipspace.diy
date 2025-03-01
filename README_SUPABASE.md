# Supabase Setup Instructions

This document provides instructions for setting up your Supabase database for the SlipSpace.DIY project.

## Setup Steps

1. **Log in to your Supabase dashboard** at https://app.supabase.com/

2. **Navigate to your project**

3. **Open the SQL Editor**:
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query" to create a new SQL query

4. **Copy and paste the contents of `supabase_migration.sql`** into the SQL Editor

5. **Run the SQL script**:
   - Click "Run" to execute the SQL commands
   - This will create all necessary tables with appropriate permissions

## Post-Setup Steps

1. **Make yourself an admin**:
   - After registering in the app, get your user ID from the Supabase dashboard:
     - Go to "Authentication" > "Users"
     - Find your user and copy the UUID
   - Run the following SQL in the SQL Editor:
     ```sql
     INSERT INTO public.user_roles (user_id, role)
     VALUES ('your-user-id-here', 'admin');
     ```
   - Replace `your-user-id-here` with your actual UUID

2. **Verify the setup**:
   - Go to "Table Editor" in the Supabase dashboard
   - You should see all the tables created by the migration script
   - Check that Row Level Security (RLS) is enabled for all tables

## Tables Created

1. **profiles** - User profile information
2. **user_roles** - User role assignments (admin, etc.)
3. **assistants** - AI assistant configurations
4. **conversations** - Chat conversations
5. **messages** - Individual messages in conversations
6. **api_keys** - Stored API keys for different providers
7. **solutions** - Pre-built assistant templates
8. **user_solutions** - Tracks which solutions users have used
9. **usage_stats** - Tracks API usage and costs

## Security Features

- **Row Level Security (RLS)** is enabled on all tables
- Users can only access their own data
- Admin users have additional permissions
- The `get_admin_status()` function allows checking admin status in the app

## Troubleshooting

If you encounter any issues:

1. Check the Supabase logs for error messages
2. Verify that RLS policies are correctly applied
3. Ensure your user has the correct permissions
4. Check that foreign key relationships are properly set up
