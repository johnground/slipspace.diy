import React, { useState, useEffect } from 'react';
import { User, LogOut, Settings, Shield, UserCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProfileSettings } from './ProfileSettings';
import { UserProfile } from './UserProfile';
import { ModalPortal } from './ModalPortal';

interface UserMenuProps {
  userId?: string;
  isAdmin?: boolean;
  onOpenProfile?: () => void;
  onOpenAdmin?: () => void;
}

export function UserMenu({ userId, isAdmin, onOpenProfile, onOpenAdmin }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(isAdmin || false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      
      if (data.user && !isAdmin) {
        checkAdminStatus(data.user.id);
      }
    };
    
    fetchUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user && !isAdmin) {
          checkAdminStatus(session.user.id);
        } else if (!session?.user) {
          setIsUserAdmin(false);
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [isAdmin]);
  
  useEffect(() => {
    if (isAdmin !== undefined) {
      setIsUserAdmin(isAdmin);
    }
  }, [isAdmin]);
  
  async function checkAdminStatus(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error checking admin status:', error);
        setIsUserAdmin(false);
        return;
      }
      
      // Check if any of the user's roles is 'admin'
      setIsUserAdmin(data?.some(role => role.role === 'admin') || false);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsUserAdmin(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
  };

  const openSettings = () => {
    if (onOpenProfile) {
      onOpenProfile();
    } else {
      setIsSettingsOpen(true);
    }
    setIsOpen(false);
  };

  const openUserProfile = () => {
    if (onOpenAdmin) {
      onOpenAdmin();
    } else {
      setIsProfileOpen(true);
    }
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-navy-800/50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-cyber-blue/20 flex items-center justify-center text-cyber-blue">
            <User className="w-5 h-5" />
          </div>
          <span className="text-sm text-gray-300 hidden md:inline-block">
            {user.email?.split('@')[0] || 'User'}
          </span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-lg bg-navy-800/90 backdrop-blur-lg border border-cyber-blue/20 shadow-xl z-50">
            <div className="p-3 border-b border-cyber-blue/10">
              <p className="text-sm font-medium text-white">{user.email}</p>
              {isUserAdmin && (
                <div className="flex items-center mt-1">
                  <Shield className="w-3 h-3 text-cyber-neon mr-1" />
                  <span className="text-xs text-cyber-neon">Admin</span>
                </div>
              )}
            </div>
            <div className="p-2">
              <button
                onClick={openSettings}
                className="flex items-center space-x-2 w-full p-2 text-left rounded-lg hover:bg-navy-700/50 transition-colors text-gray-300 hover:text-white"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              
              {isUserAdmin && (
                <button
                  onClick={openUserProfile}
                  className="flex items-center space-x-2 w-full p-2 text-left rounded-lg hover:bg-navy-700/50 transition-colors text-gray-300 hover:text-white"
                >
                  <UserCircle className="w-4 h-4" />
                  <span>User Management</span>
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 w-full p-2 text-left rounded-lg hover:bg-navy-700/50 transition-colors text-gray-300 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {isSettingsOpen && (
        <ModalPortal onClose={() => setIsSettingsOpen(false)}>
          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-navy-800/50 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <ProfileSettings />
          </div>
        </ModalPortal>
      )}

      {isProfileOpen && <UserProfile onClose={() => setIsProfileOpen(false)} />}
    </>
  );
}
