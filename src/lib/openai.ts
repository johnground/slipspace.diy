import { supabase } from './supabase';

// Function to validate an API key with OpenAI
export async function validateAPIKey(apiKey?: string): Promise<boolean> {
  try {
    // If no API key is provided, try to get the user's API key
    if (!apiKey) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data: keyData, error: keyError } = await supabase
        .from('api_keys')
        .select('key_value')
        .eq('user_id', user.id)
        .eq('provider', 'openai')
        .eq('is_active', true)
        .single();
      
      if (keyError || !keyData) return false;
      apiKey = keyData.key_value;
    }
    
    if (!apiKey) return false;

    // Make a simple request to OpenAI API to validate the key
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.status === 200;
  } catch (error) {
    console.error('Error validating OpenAI API key:', error);
    return false;
  }
}

// Function to get the user's API key
export async function getUserAPIKey(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('user_id', user.id)
      .eq('provider', 'openai')
      .eq('is_active', true)
      .single();
    
    if (error || !data) return null;
    return data.key_value;
  } catch (error) {
    console.error('Error getting user API key:', error);
    return null;
  }
}

// Function to save the user's API key
export async function saveUserAPIKey(apiKey: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Check if user already has an API key
    const { data: existingKey, error: checkError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', 'openai')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
      console.error('Error checking existing API key:', checkError);
      return false;
    }
    
    if (existingKey) {
      // Update existing key
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({ 
          key_value: apiKey,
          updated_at: new Date().toISOString(),
          is_active: true
        })
        .eq('id', existingKey.id);
      
      if (updateError) {
        console.error('Error updating API key:', updateError);
        return false;
      }
    } else {
      // Insert new key
      const { error: insertError } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          provider: 'openai',
          key_name: 'OpenAI API Key',
          key_value: apiKey,
          is_active: true
        });
      
      if (insertError) {
        console.error('Error inserting API key:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user API key:', error);
    return false;
  }
}
