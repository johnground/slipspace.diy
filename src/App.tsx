import React, { useState, useEffect } from 'react';
import { Menu, X, Brain, Shield, Lock, Server, FileKey, LogIn, LogOut, ChevronDown, Globe, Users, Cpu, Zap, MessageSquare, Bot, UserCircle } from 'lucide-react';
import { ChatWidget } from './components/ChatWidget';
import { CyberAssistant } from './components/CyberAssistant';
import { AuthModal } from './components/AuthModal';
import { AdminProfileList } from './components/AdminProfileList';
import { UserAssistant } from './components/UserAssistant';
import { AdminAssistant } from './components/AdminAssistant';
import { AssistantSelection } from './components/AssistantSelection';
import { Solutions } from './components/Solutions';
import { UserMenu } from './components/UserMenu';
import { ProfileSettings } from './components/ProfileSettings';
import { UserProfile } from './components/UserProfile';
import type { SavedAssistant } from './templates/types';
import { supabase } from './lib/supabase';
import { SlipSpaceLogo } from './components/SlipSpaceLogo';

function AnimatedText({ text }: { text: string }) {
  return (
    <span className="animated-text">
      {text.split('').map((char, index) => (
        <span
          key={index}
          style={{
            animationDelay: `${index * 0.1}s`
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    const hash = window.location.hash.slice(1);
    return hash || 'home';
  });
  const [selectedAssistant, setSelectedAssistant] = useState<SavedAssistant | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
      checkAdminStatus(session.user.id);
    }
  }

  async function checkAdminStatus(uid: string) {
    try {
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
    }
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id;
      setUserId(uid ?? null);
      if (uid) {
        checkAdminStatus(uid);
      } else {
        setIsAdmin(false);
      }
    });

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveSection(hash);
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const newSection = entry.target.id;
            setActiveSection(newSection);
            const currentHash = window.location.hash.slice(1);
            if (currentHash !== newSection) {
              history.replaceState(null, '', `#${newSection}`);
            }
          }
        });
      },
      { 
        threshold: 0.5,
        rootMargin: '-20% 0px -20% 0px'
      }
    );

    document.querySelectorAll('section[id]').forEach((section) => {
      observer.observe(section);
    });

    if (window.location.hash) {
      handleHashChange();
    }

    return () => {
      subscription.unsubscribe();
      observer.disconnect();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setIsMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSelectAssistant = (assistant: SavedAssistant) => {
    setSelectedAssistant(assistant);
    setActiveSection('chat');
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      {/* Background Video with Enhanced Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-neon/30 via-cyber-blue/20 to-cyber-orange/10 mix-blend-overlay animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-t from-cyber-neon/10 via-cyber-blue/5 to-cyber-orange/5 mix-blend-color-dodge" />
        
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute min-w-full min-h-full object-cover opacity-40 mix-blend-hard-light"
        >
          <source
            src="https://video.wixstatic.com/video/231fcd_3ceb9317a64c4f2490eb25aa3528af3a/720p/mp4/file.mp4"
            type="video/mp4"
          />
        </video>
        
        {/* Enhanced Cyberpunk Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-cyber-neon/5 to-cyber-blue/10 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/10 via-navy-900/50 to-navy-900/90" />
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 animate-grid" />
      </div>

      <div className="relative z-10">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-900/80 backdrop-blur-lg border-b border-cyber-blue/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-cyber-blue rounded-full blur opacity-30 group-hover:opacity-50 transition duration-300" />
                  <SlipSpaceLogo 
                    size={48}
                    className="relative text-cyber-blue group-hover:text-white transition-colors duration-300"
                  />
                </div>
                <span className="text-xl font-bold text-cyber-blue">
                  SlipSpace AI
                </span>
              </div>
              
              <div className="hidden md:flex items-center space-x-4">
                {[
                  { name: 'about', icon: Brain },
                  { name: 'services', icon: Shield },
                  { name: 'solutions', icon: Lock },
                  { name: 'contact', icon: MessageSquare }
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.name)}
                    className={`
                      px-4 py-2 rounded-lg flex items-center space-x-2
                      transition-all duration-300
                      ${activeSection === item.name 
                        ? 'bg-navy-800/80 text-cyber-blue border border-cyber-blue/30 shadow-[0_0_15px_rgba(0,102,204,0.15)]' 
                        : 'text-gray-300 hover:bg-navy-800/50 hover:text-cyber-blue'
                      }
                    `}
                  >
                    <item.icon className={`h-4 w-4 ${
                      activeSection === item.name 
                        ? 'text-cyber-blue'
                        : 'text-gray-400 group-hover:text-cyber-blue'
                    }`} />
                    <span className="capitalize font-medium">{item.name}</span>
                  </button>
                ))}

                {userId ? (
                  <UserMenu 
                    userId={userId}
                    isAdmin={isAdmin}
                    onOpenProfile={() => setIsProfileModalOpen(true)}
                    onOpenAdmin={() => setIsAdminModalOpen(true)}
                  />
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="group relative px-4 py-2 rounded-lg flex items-center space-x-2 bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue/30 text-cyber-blue hover:text-white transition-all duration-300"
                    aria-label="Login"
                  >
                    <div className="absolute -inset-0.5 bg-cyber-blue rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-300" />
                    <LogIn className="relative h-4 w-4" />
                    <span className="relative font-medium">Login</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden relative group p-2 hover:bg-navy-800 rounded-lg"
              >
                <div className="absolute -inset-0.5 bg-cyber-blue rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-300" />
                {isMenuOpen ? (
                  <X className="relative h-6 w-6 text-cyber-blue group-hover:text-white transition-colors duration-300" />
                ) : (
                  <Menu className="relative h-6 w-6 text-cyber-blue group-hover:text-white transition-colors duration-300" />
                )}
              </button>
            </div>

            {/* Enhanced Mobile Menu */}
            {isMenuOpen && (
              <div className="md:hidden py-4 space-y-1 bg-navy-800/90 backdrop-blur-lg rounded-b-2xl border-t border-cyber-blue/10">
                {[
                  { name: 'about', icon: Brain },
                  { name: 'services', icon: Shield },
                  { name: 'solutions', icon: Lock },
                  { name: 'contact', icon: MessageSquare }
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.name)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 mx-2 rounded-lg
                      transition-all duration-200
                      ${activeSection === item.name
                        ? 'bg-navy-700/80 text-cyber-blue border border-cyber-blue/30'
                        : 'text-gray-300 hover:bg-navy-700/50 hover:text-cyber-blue'
                      }
                    `}
                  >
                    <item.icon className={`h-5 w-5 ${
                      activeSection === item.name
                        ? 'text-cyber-blue'
                        : 'text-gray-400'
                    }`} />
                    <span className="capitalize font-medium">{item.name}</span>
                  </button>
                ))}

                {userId ? (
                  <>
                    {/* Mobile Profile Button */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 mx-2 rounded-lg bg-navy-700/50 hover:bg-navy-700/80 text-white transition-all duration-200"
                    >
                      <UserCircle className="h-5 w-5 text-cyber-blue" />
                      <span className="font-medium">Profile Settings</span>
                    </button>
                    
                    {/* Mobile Admin Button */}
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsAdminModalOpen(true);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 mx-2 rounded-lg bg-cyber-neon/10 hover:bg-cyber-neon/20 border border-cyber-neon/30 text-cyber-neon hover:text-white transition-all duration-200"
                      >
                        <Shield className="h-5 w-5" />
                        <span className="font-medium">Admin Panel</span>
                      </button>
                    )}

                    {/* Mobile Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3 mx-2 rounded-lg bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue/30 text-cyber-blue hover:text-white transition-all duration-200"
                      aria-label="Logout"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 mx-2 rounded-lg bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue/30 text-cyber-blue hover:text-white transition-all duration-200"
                  >
                    <LogIn className="h-5 w-5" />
                    <span className="font-medium">Login</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section id="home" className="relative min-h-screen flex items-center justify-center px-6 pt-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              <AnimatedText text="Next-Gen" />
              <br />
              <AnimatedText text="AI-Solutions" />
              <br />
              <AnimatedText text="to" />
              <br />
              <AnimatedText text="fit" />
              <br />
                <AnimatedText text="your use case" />
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Custom AI solutions designed to match your specific needs and enhance your workflow.
            </p>
            {!userId && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="relative group inline-flex items-center space-x-2 px-8 py-4 rounded-lg bg-navy-900/50 backdrop-blur-sm border border-cyber-blue/20 text-cyber-blue hover:text-white transition-all duration-300 text-lg font-medium"
              >
                <LogIn className="h-5 w-5" />
                <span className="animated-text">
                  {Array.from("Secure Your Systems").map((char, index) => (
                    <span
                      key={index}
                      style={{
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              </button>
            )}
          </div>
        </section>

        {/* Solutions Section */}
        <section id="solutions" className="relative">
          <Solutions
            userId={userId || ''}
            isAdmin={isAdmin}
            onSelectTemplate={(template) => {
              setSelectedAssistant({
                ...template,
                isFavorite: false,
                lastUsed: null
              });
              setActiveSection('chat');
            }}
          />
        </section>

        {/* Chat Widgets */}
        {userId ? (
          <>
            <ChatWidget userId={userId} />
            {activeSection === 'solutions' ? (
              <AssistantSelection
                userId={userId}
                isAdmin={isAdmin}
                onSelectAssistant={handleSelectAssistant}
              />
            ) : selectedAssistant && (
              <UserAssistant
                userId={userId}
                assistant={selectedAssistant}
                onClose={() => setSelectedAssistant(null)}
              />
            )}
          </>
        ) : (
          <CyberAssistant />
        )}

        {/* Auth Modal */}
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />

        {/* Profile Settings Modal */}
        {isProfileModalOpen && userId && (
          <ProfileSettings 
            userId={userId}
            onClose={() => setIsProfileModalOpen(false)}
          />
        )}

        {/* Admin Modal */}
        {isAdminModalOpen && (
          <UserProfile onClose={() => setIsAdminModalOpen(false)} />
        )}
      </div>
    </div>
  );
}

export default App;
