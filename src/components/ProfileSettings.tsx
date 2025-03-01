import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { APIKeyManager } from './APIKeyManager';

interface ProfileSettingsProps {
  userId?: string;
  onClose?: () => void;
}

export function ProfileSettings({ userId, onClose }: ProfileSettingsProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true);
        
        // If userId is provided, use it, otherwise get the current user
        let userData;
        if (userId) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (error) throw error;
          userData = data;
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No user logged in');
          
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (error && error.code !== 'PGRST116') throw error;
          userData = data || { id: user.id, email: user.email };
        }
        
        setUser(userData);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    getUser();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyber-blue mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading profile settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">Failed to load profile</p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue/30 rounded-lg text-cyber-blue hover:text-white transition-all duration-200"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-cyber-blue mb-6">Profile Settings</h2>
      
      <div className="space-y-8">
        {/* User Info Section */}
        <div className="bg-navy-800/50 rounded-lg p-6 border border-cyber-blue/10">
          <h3 className="text-xl font-semibold text-white mb-4">User Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <div className="bg-navy-900/80 border border-cyber-blue/20 rounded-lg px-4 py-2 text-white">
                {user.email}
              </div>
            </div>
          </div>
        </div>
        
        {/* API Keys Section */}
        <div className="bg-navy-800/50 rounded-lg p-6 border border-cyber-blue/10">
          <h3 className="text-xl font-semibold text-white mb-4">API Keys</h3>
          <APIKeyManager userId={user.id} />
        </div>
      </div>
    </div>
  );
}
