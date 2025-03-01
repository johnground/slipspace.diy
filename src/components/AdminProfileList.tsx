import React, { useState, useEffect } from 'react';
import { Trash2, User, Shield, Search, UserPlus, X, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { APIKeyManager } from './APIKeyManager';

interface Profile {
  id: string;
  full_name: string;
  created_at: string;
  email?: string;
  is_admin?: boolean;
}

interface CreateUserModal {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModal) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Create the user using standard signup
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0], // Set a default name from email
          }
        }
      });

      if (signUpError) {
        // Handle specific error cases
        if (signUpError.message.includes('user_already_exists')) {
          setError('A user with this email already exists');
          return;
        }
        throw signUpError;
      }

      if (data.user) {
        // Assign default user role
        const { error: roleError } = await supabase.rpc('assign_user_role', {
          target_user_id: data.user.id,
          role_name: 'user'
        });

        if (roleError) throw roleError;

        // Clear form and close modal
        setEmail('');
        setPassword('');
        onUserCreated();
        onClose();
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy-900/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-navy-900/90 border border-cyber-blue/20 rounded-2xl shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-cyber-neon">Create New User</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-navy-700/50 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-navy-800/50 border border-cyber-blue/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-blue/50"
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-navy-800/50 border border-cyber-blue/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-blue/50"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <p className="mt-1 text-xs text-gray-400">
                Password must be at least 8 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue/30 rounded-lg text-cyber-blue hover:text-white transition-all duration-200"
            >
              <UserPlus className="h-5 w-5" />
              <span>{loading ? 'Creating...' : 'Create User'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminProfileList() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'api-keys'>('users');

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin && !isCheckingAdmin) {
      loadProfiles();
    }
  }, [isAdmin, isCheckingAdmin]);

  async function checkAdminStatus() {
    try {
      setIsCheckingAdmin(true);
      
      // Check if user is authenticated first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_admin_status');

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data || false);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    } finally {
      setIsCheckingAdmin(false);
    }
  }

  async function loadProfiles() {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_user_profiles');

      if (error) {
        // Handle specific error cases
        if (error.message.includes('Admin privileges required')) {
          setIsAdmin(false);
          setError('You need administrator privileges to view user profiles');
          return;
        }
        throw error;
      }

      setProfiles(data || []);
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError('Failed to load profiles. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProfile(userId: string) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      const { error } = await supabase.rpc('delete_user_profile', {
        target_user_id: userId
      });

      if (error) {
        if (error.message.includes('Cannot delete the last admin user')) {
          setError('Cannot delete the last administrator');
          return;
        }
        if (error.message.includes('Admin privileges required')) {
          setIsAdmin(false);
          setError('You need administrator privileges to delete users');
          return;
        }
        throw error;
      }
      
      await loadProfiles();
    } catch (err) {
      console.error('Error deleting profile:', err);
      setError('Failed to delete user. Please try again later.');
    }
  }

  const filteredProfiles = profiles.filter(profile => 
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isCheckingAdmin) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyber-blue"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <Shield className="h-12 w-12 text-cyber-blue mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400">You need administrator privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-cyber-blue">Admin Panel</h2>
          {activeTab === 'users' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue/30 rounded-lg text-cyber-blue hover:text-white transition-all duration-200"
            >
              <UserPlus className="h-5 w-5" />
              <span>Add User</span>
            </button>
          )}
        </div>

        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-navy-800/80 text-cyber-blue border border-cyber-blue/30'
                : 'text-gray-400 hover:text-white hover:bg-navy-800/50'
            }`}
          >
            <User className="h-5 w-5" />
            <span>Users</span>
          </button>
          <button
            onClick={() => setActiveTab('api-keys')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'api-keys'
                ? 'bg-navy-800/80 text-cyber-blue border border-cyber-blue/30'
                : 'text-gray-400 hover:text-white hover:bg-navy-800/50'
            }`}
          >
            <Key className="h-5 w-5" />
            <span>API Keys</span>
          </button>
        </div>
        
        {activeTab === 'users' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search profiles..."
              className="w-full pl-10 pr-4 py-2 bg-navy-800/50 border border-cyber-blue/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-blue/50"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
          {error}
        </div>
      )}

      {activeTab === 'users' ? (
        loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyber-blue"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProfiles.map(profile => (
              <div
                key={profile.id}
                className="p-4 bg-navy-800/50 border border-cyber-blue/20 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center">
                    <User className="h-5 w-5 text-cyber-blue" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-white">
                        {profile.full_name || 'Unnamed User'}
                      </h3>
                      {profile.is_admin && (
                        <span className="px-2 py-0.5 text-xs bg-cyber-neon/10 border border-cyber-neon/30 rounded-full text-cyber-neon">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {profile.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {!profile.is_admin && (
                  <button
                    onClick={() => handleDeleteProfile(profile.id)}
                    className="p-2 hover:bg-navy-700/50 rounded-lg transition-colors text-red-400 hover:text-red-300"
                    title="Delete Profile"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}

            {filteredProfiles.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No profiles found
              </div>
            )}
          </div>
        )
      ) : (
        <APIKeyManager />
      )}

      <CreateUserModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={loadProfiles}
      />
    </div>
  );
}
