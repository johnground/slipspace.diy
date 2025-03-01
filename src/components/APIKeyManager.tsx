import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateAPIKey } from '../lib/openai';

interface APIKey {
  service: string;
  api_key: string;
  updated_at: string;
}

export function APIKeyManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    loadAPIKey();
  }, []);

  async function loadAPIKey() {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Authentication required');
        return;
      }

      const { data: key, error } = await supabase.rpc('get_api_key', {
        service_name: 'openai'
      });

      if (error) {
        if (error.message.includes('Admin privileges required')) {
          setError('You need administrator privileges to manage API keys');
          return;
        }
        throw error;
      }

      if (key) {
        setApiKey(key);
        // Get last updated time
        const { data: keyInfo } = await supabase
          .from('api_keys')
          .select('updated_at')
          .eq('service', 'openai')
          .single();

        if (keyInfo) {
          setLastUpdated(new Date(keyInfo.updated_at).toLocaleString());
        }
      }
    } catch (err) {
      console.error('Error loading API key:', err);
      setError('Failed to load API key');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase.rpc('set_api_key', {
        service_name: 'openai',
        key_value: apiKey
      });

      if (error) {
        if (error.message.includes('Admin privileges required')) {
          setError('You need administrator privileges to manage API keys');
          return;
        }
        throw error;
      }

      setSuccess('API key saved successfully');
      loadAPIKey(); // Refresh the last updated time
    } catch (err) {
      console.error('Error saving API key:', err);
      setError('Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleValidate() {
    try {
      setIsValidating(true);
      setError(null);
      setSuccess(null);

      const isValid = await validateAPIKey();

      if (isValid) {
        setSuccess('API key is valid');
      } else {
        setError('API key is invalid');
      }
    } catch (err) {
      console.error('Error validating API key:', err);
      setError('Failed to validate API key');
    } finally {
      setIsValidating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyber-blue"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Key className="h-6 w-6 text-cyber-blue" />
        <h2 className="text-xl font-bold text-cyber-blue">API Key Management</h2>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            OpenAI API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2 bg-navy-800/50 border border-cyber-blue/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-blue/50"
              placeholder="sk-..."
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-navy-700/50 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {lastUpdated && (
            <p className="mt-1 text-xs text-gray-500">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue/30 rounded-lg text-cyber-blue hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Key'}</span>
          </button>

          <button
            onClick={handleValidate}
            disabled={isValidating || !apiKey}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-cyber-neon/10 hover:bg-cyber-neon/20 border border-cyber-neon/30 rounded-lg text-cyber-neon hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>{isValidating ? 'Validating...' : 'Validate Key'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
