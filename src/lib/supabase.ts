import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Add error handling and logging for connection issues
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase environment variables. Using placeholder values for development. Check your .env file.');
}

// Create the Supabase client with additional options for better error handling
export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storageKey: 'slipspace-auth-storage',
      storage: localStorage
    }
  }
);

// Add a simple test function to verify connection
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection using API key authentication...');
    
    // First try to get the auth user to test if auth is working
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('Auth test result:', authError.message);
      // Auth error is expected when no user is logged in, so we continue
    } else {
      console.log('Auth connection successful');
    }
    
    // Test a simple API endpoint that doesn't require a specific table
    // Using the healthcheck endpoint instead of profiles
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (!response.ok && response.status !== 404) {
      // 404 is actually expected for this endpoint and means the connection works
      console.log('API test failed:', response.status, response.statusText);
      throw new Error(`API test failed: ${response.status} ${response.statusText}`);
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
}

// Function to check if API key is valid
export async function checkApiKey() {
  try {
    console.log('Checking API key validity...');
    
    // Try to get service status which requires a valid API key
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    const isValid = response.ok || response.status === 404; // 404 is also a successful connection
    console.log('API key check result:', isValid ? 'Valid' : 'Invalid');
    return isValid;
  } catch (error) {
    console.error('API key check failed:', error);
    return false;
  }
}

// Function to create a user profile if it doesn't exist
export async function createUserProfileIfNotExists(userId: string, userData?: { full_name?: string }) {
  try {
    console.log('Checking if profile exists for user:', userId);
    
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
      console.error('Error checking profile:', checkError);
      return { error: checkError };
    }
    
    // If profile exists, return it
    if (existingProfile) {
      console.log('Profile already exists for user:', userId);
      return { data: existingProfile, error: null };
    }
    
    // Create new profile
    console.log('Creating new profile for user:', userId);
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([
        { 
          id: userId,
          full_name: userData?.full_name || null,
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          email_notifications: true,
          push_notifications: true,
          newsletter_subscription: false,
          marketing_emails: false,
          profile_visibility: 'private',
          data_sharing: false,
          font_size: 'medium',
          color_scheme: 'dark',
          social_links: {},
          professional_info: {},
          interests: []
        }
      ])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating profile:', insertError);
      return { error: insertError };
    }
    
    console.log('Profile created successfully for user:', userId);
    return { data: newProfile, error: null };
  } catch (error) {
    console.error('Error creating profile:', error);
    return { error };
  }
}
