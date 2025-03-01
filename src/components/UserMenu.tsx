import React, { useState, useEffect } from 'react';
import { User, LogOut, Settings, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthModal } from './AuthModal';
import { UserProfile } from './UserProfile';
import { ProfileSettings } from './ProfileSettings';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        setUser(session?.user ?? null);
        
        // Close menus when auth state changes
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setIsOpen(false);
          setIsAuthModalOpen(false);
          setIsProfileOpen(false);
          setIsSettingsOpen(false);
        }
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      closeMenu();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const openAuthModal = () => {
    setIsAuthModalOpen(true);
    closeMenu();
  };

  const openProfileModal = () => {
    setIsProfileOpen(true);
    closeMenu();
  };

  const openSettingsModal = () => {
    setIsSettingsOpen(true);
    closeMenu();
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={toggleMenu}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-navy-800 hover:bg-navy-700 border border-cyber-blue/30 text-cyber-blue transition-colors"
          aria-label="User menu"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-cyber-blue/30 border-t-cyber-blue rounded-full animate-spin"></div>
          ) : (
            <User className="w-5 h-5" />
          )}
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={closeMenu}
            ></div>
            
            <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 bg-navy-900/90 backdrop-blur-sm border border-cyber-blue/20 z-50">
              {user ? (
                <>
                  <div className="px-4 py-2 border-b border-cyber-blue/10">
                    <p className="text-sm font-medium text-white truncate">{user.email}</p>
                  </div>
                  
                  <button
                    onClick={openSettingsModal}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-navy-800/50 hover:text-white"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </button>
                  
                  <button
                    onClick={openProfileModal}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-navy-800/50 hover:text-white"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    User Management
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-navy-800/50 hover:text-white"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-navy-800/50 hover:text-white"
                >
                  <User className="w-4 h-4 mr-2" />
                  Sign in
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {isAuthModalOpen && (
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      )}
      
      {isProfileOpen && (
        <UserProfile 
          onClose={() => setIsProfileOpen(false)} 
        />
      )}
      
      {isSettingsOpen && user && (
        <ProfileSettings 
          userId={user.id}
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
    </>
  );
}
