import React, { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdminProfileList } from './AdminProfileList';
import { ModalPortal } from './ModalPortal';

interface UserProfileProps {
  onClose: () => void;
}

export function UserProfile({ onClose }: UserProfileProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  async function checkAdminStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      // If no role found or error, user is not admin
      if (error || !data || data.length === 0) {
        setIsAdmin(false);
        return;
      }

      // Check if any of the user's roles is 'admin'
      setIsAdmin(data.some(role => role.role === 'admin'));
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <ModalPortal>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyber-blue"></div>
        </div>
      </ModalPortal>
    );
  }

  if (!isAdmin) {
    return (
      <ModalPortal onClose={onClose}>
        <div className="p-8 max-w-md mx-auto text-center">
          <Shield className="h-12 w-12 text-cyber-blue mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">You don't have permission to access this area.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue/30 rounded-lg text-cyber-blue hover:text-white transition-all duration-200"
          >
            Close
          </button>
        </div>
      </ModalPortal>
    );
  }

  return (
    <ModalPortal onClose={onClose}>
      <div>
        {/* Header */}
        <div className="p-6 border-b border-cyber-blue/10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-cyber-blue">User Management</h1>
            <button
              onClick={onClose}
              className="p-2 hover:bg-navy-800/50 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          <AdminProfileList />
        </div>
      </div>
    </ModalPortal>
  );
}
