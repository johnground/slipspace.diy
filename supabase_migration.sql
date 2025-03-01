-- Migration file for SlipSpace.DIY Supabase setup
-- Run this in the Supabase SQL Editor to create all required tables

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    newsletter_subscription BOOLEAN DEFAULT FALSE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    profile_visibility TEXT DEFAULT 'private',
    data_sharing BOOLEAN DEFAULT FALSE,
    font_size TEXT DEFAULT 'medium',
    color_scheme TEXT DEFAULT 'dark',
    social_links JSONB DEFAULT '{}'::JSONB,
    professional_info JSONB DEFAULT '{}'::JSONB,
    interests TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table for admin access
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assistants table to store assistant configurations
CREATE TABLE IF NOT EXISTS public.assistants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    system_prompt TEXT,
    temperature FLOAT DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    top_p FLOAT DEFAULT 1.0,
    frequency_penalty FLOAT DEFAULT 0.0,
    presence_penalty FLOAT DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table to store chat history
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assistant_id UUID REFERENCES public.assistants(id) ON DELETE SET NULL,
    title TEXT DEFAULT 'New Conversation',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table to store individual messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_keys table to store user API keys
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    key_name TEXT NOT NULL,
    key_value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create solutions table for pre-built solutions
CREATE TABLE IF NOT EXISTS public.solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    template JSONB NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_solutions table to track which solutions users have used
CREATE TABLE IF NOT EXISTS public.user_solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    solution_id UUID NOT NULL REFERENCES public.solutions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, solution_id)
);

-- Create usage_stats table to track API usage
CREATE TABLE IF NOT EXISTS public.usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    tokens_input INTEGER NOT NULL,
    tokens_output INTEGER NOT NULL,
    cost DECIMAL(10, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin status function
CREATE OR REPLACE FUNCTION public.get_admin_status()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    ) INTO is_admin;
    
    RETURN is_admin;
END;
$$;

-- Set up Row Level Security (RLS) policies

-- Profiles table policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- User roles table policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage user roles"
    ON public.user_roles
    USING (EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (user_id = auth.uid());

-- Assistants table policies
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assistants"
    ON public.assistants FOR SELECT
    USING (user_id = auth.uid() OR is_public = TRUE);

CREATE POLICY "Users can insert their own assistants"
    ON public.assistants FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own assistants"
    ON public.assistants FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own assistants"
    ON public.assistants FOR DELETE
    USING (user_id = auth.uid());

-- Conversations table policies
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
    ON public.conversations FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations"
    ON public.conversations FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversations"
    ON public.conversations FOR DELETE
    USING (user_id = auth.uid());

-- Messages table policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
    ON public.messages FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM public.conversations
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
        conversation_id IN (
            SELECT id FROM public.conversations
            WHERE user_id = auth.uid()
        )
    );

-- API keys table policies
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
    ON public.api_keys FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own API keys"
    ON public.api_keys FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own API keys"
    ON public.api_keys FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own API keys"
    ON public.api_keys FOR DELETE
    USING (user_id = auth.uid());

-- Solutions table policies
ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view solutions"
    ON public.solutions FOR SELECT
    USING (TRUE);

CREATE POLICY "Only admins can manage solutions"
    ON public.solutions
    USING (EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- User solutions table policies
ALTER TABLE public.user_solutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own solution usage"
    ON public.user_solutions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own solution usage"
    ON public.user_solutions FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Usage stats table policies
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage stats"
    ON public.usage_stats FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own usage stats"
    ON public.usage_stats FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_assistants_user_id ON public.assistants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_solutions_user_id ON public.user_solutions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON public.usage_stats(user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Insert a sample admin user (replace with your user ID after registration)
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('your-user-id-here', 'admin');
