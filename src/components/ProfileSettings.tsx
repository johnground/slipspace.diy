import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { APIKeyManager } from './APIKeyManager';

interface Profile {
  id: string;
  full_name: string | null;
  language: string;
  timezone: string;
  email_notifications: boolean;
  push_notifications: boolean;
  newsletter_subscription: boolean;
  marketing_emails: boolean;
  profile_visibility: string;
  data_sharing: boolean;
  font_size: string;
  color_scheme: string;
}

export function ProfileSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Authentication required');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyber-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-navy-900/90 backdrop-blur-lg rounded-2xl border border-cyber-blue/20 shadow-xl">
      {/* Tabs */}
      <div className="flex border-b border-cyber-blue/10">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'general'
              ? 'text-cyber-blue border-b-2 border-cyber-blue'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('api-keys')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'api-keys'
              ? 'text-cyber-blue border-b-2 border-cyber-blue'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          API Keys
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'notifications'
              ? 'text-cyber-blue border-b-2 border-cyber-blue'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'privacy'
              ? 'text-cyber-blue border-b-2 border-cyber-blue'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Privacy
        </button>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">General Settings</h2>
            {/* General settings content here */}
            <p className="text-gray-400">General settings coming soon...</p>
          </div>
        )}

        {activeTab === 'api-keys' && <APIKeyManager />}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Notification Settings</h2>
            {/* Notification settings content here */}
            <p className="text-gray-400">Notification settings coming soon...</p>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Privacy Settings</h2>
            {/* Privacy settings content here */}
            <p className="text-gray-400">Privacy settings coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
