import React, { useState, useEffect } from 'react';
import { X, LogIn, Mail, Lock, UserPlus, KeyRound, ArrowLeft, AlertCircle, Wifi, WifiOff, Key } from 'lucide-react';
import { supabase, testSupabaseConnection, checkApiKey } from '../lib/supabase';
import { z } from 'zod';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Validation schemas
const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

type AuthMode = 'login' | 'register' | 'reset';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [connectionTesting, setConnectionTesting] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Test connection when modal opens
      checkConnection();
    }
  }, [isOpen]);

  // Countdown timer for rate limit
  useEffect(() => {
    if (rateLimitCountdown && rateLimitCountdown > 0) {
      const timer = setTimeout(() => {
        setRateLimitCountdown(prev => prev ? prev - 1 : null);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (rateLimitCountdown === 0) {
      setRateLimitCountdown(null);
    }
  }, [rateLimitCountdown]);

  async function checkConnection() {
    setConnectionTesting(true);
    setError(null);
    
    try {
      // First check if the API key is valid
      console.log("Checking API key...");
      const isApiKeyValid = await checkApiKey();
      setApiKeyValid(isApiKeyValid);
      
      if (isApiKeyValid) {
        console.log("API key is valid, testing full connection...");
        const isConnected = await testSupabaseConnection();
        setConnectionStatus(isConnected);
      } else {
        console.log("API key is invalid or connection issues");
        setConnectionStatus(false);
      }
    } catch (err) {
      console.error("Connection check error:", err);
      setConnectionStatus(false);
    } finally {
      setConnectionTesting(false);
    }
  }

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  };

  const validateInput = () => {
    try {
      emailSchema.parse(email);
      if (mode !== 'reset') {
        passwordSchema.parse(password);
      }
      if (mode === 'register' && password !== confirmPassword) {
        throw new Error("Passwords don't match");
      }
      return true;
    } catch (err) {
      setError(err instanceof z.ZodError ? err.errors[0].message : err instanceof Error ? err.message : 'Invalid input');
      return false;
    }
  };

  async function createInitialProfile(userId: string) {
    try {
      const defaultProfile = {
        id: userId,
        full_name: '',
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        email_notifications: true,
        push_notifications: true,
        newsletter_subscription: false,
        marketing_emails: false,
        profile_visibility: 'private',
        data_sharing: false,
        font_size: 'medium',
        color_scheme: 'default',
        social_links: {
          twitter: '',
          linkedin: '',
          github: '',
        },
        professional_info: {
          title: '',
          company: '',
          industry: '',
        },
        interests: [],
      };

      const { error } = await supabase
        .from('profiles')
        .insert([defaultProfile]);

      if (error) throw error;
    } catch (err) {
      console.error('Error creating profile:', err);
      throw err;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Check connection before proceeding
    if (connectionStatus === false) {
      setError("Cannot connect to Supabase. Please check your API key and internet connection.");
      return;
    }
    
    if (!validateInput()) return;
    
    setLoading(true);

    try {
      switch (mode) {
        case 'login': {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (error) throw error;
          onClose();
          break;
        }
        case 'register': {
          console.log('Starting registration process...');
          
          try {
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: window.location.origin
              }
            });
            
            console.log('Registration response:', { data, error });
            
            if (error) {
              // Check for rate limit error
              if (error.message && error.message.includes('security purposes') && error.message.includes('seconds')) {
                const waitTime = parseInt(error.message.match(/\d+/)?.[0] || '30');
                setRateLimitCountdown(waitTime);
                throw new Error(`Rate limited. Please try again in ${waitTime} seconds.`);
              }
              throw error;
            }
            
            // Create initial profile if registration was successful
            if (data.user) {
              console.log('Creating initial profile for user:', data.user.id);
              try {
                await createInitialProfile(data.user.id);
              } catch (profileError) {
                console.error('Profile creation failed, but user was registered:', profileError);
                // Continue with success message even if profile creation fails
              }
            }
            
            setSuccess('Registration successful! Please check your email to confirm your account.');
            setMode('login');
            resetForm();
          } catch (err) {
            throw err;
          }
          break;
        }
        case 'reset': {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
          });
          if (error) throw error;
          setSuccess('Password reset instructions have been sent to your email.');
          break;
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-navy-900/90 border border-cyber-neon/20 rounded-2xl shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              {mode !== 'login' && (
                <button
                  onClick={() => switchMode('login')}
                  className="p-1.5 hover:bg-navy-800/50 rounded-lg transition-colors text-cyber-blue"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <h2 className="text-2xl font-bold text-cyber-neon">
                {mode === 'login' ? 'Login' : mode === 'register' ? 'Register' : 'Reset Password'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {connectionTesting ? (
            <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center">
              <div className="animate-spin mr-2 h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span>Testing connection to Supabase...</span>
            </div>
          ) : connectionStatus === false ? (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center">
              <WifiOff className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>
                {apiKeyValid === false 
                  ? "Invalid API key or connection issues with Supabase." 
                  : "Cannot connect to Supabase. This may be due to network restrictions in the WebContainer environment."}
              </span>
              <button 
                onClick={checkConnection}
                className="ml-2 text-xs bg-amber-500/20 hover:bg-amber-500/30 px-2 py-1 rounded"
              >
                Retry
              </button>
            </div>
          ) : connectionStatus === true && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center">
              <Wifi className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>Connected to Supabase successfully!</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {rateLimitCountdown !== null && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>Rate limited. Please wait {rateLimitCountdown} seconds before trying again.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-navy-800/50 border border-cyber-neon/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-neon/50"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-navy-800/50 border border-cyber-neon/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-neon/50"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-navy-800/50 border border-cyber-neon/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-neon/50"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || connectionStatus === false || rateLimitCountdown !== null}
              className={`w-full flex items-center justify-center space-x-2 py-2 px-4 ${
                connectionStatus === false || rateLimitCountdown !== null
                  ? 'bg-gray-500/10 border-gray-500/30 text-gray-400 cursor-not-allowed' 
                  : 'bg-cyber-neon/10 hover:bg-cyber-neon/20 border border-cyber-neon/30 text-cyber-neon hover:text-white'
              } rounded-lg transition-all duration-200`}
            >
              {mode === 'login' ? (
                <LogIn className="h-5 w-5" />
              ) : mode === 'register' ? (
                <UserPlus className="h-5 w-5" />
              ) : (
                <KeyRound className="h-5 w-5" />
              )}
              <span>
                {loading
                  ? mode === 'login'
                    ? 'Logging in...'
                    : mode === 'register'
                    ? 'Registering...'
                    : 'Sending reset link...'
                  : mode === 'login'
                  ? 'Login'
                  : mode === 'register'
                  ? 'Register'
                  : 'Send Reset Link'}
              </span>
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 flex flex-col space-y-2">
              <button
                onClick={() => switchMode('register')}
                className="text-sm text-cyber-blue hover:text-white transition-colors"
              >
                Don't have an account? Register
              </button>
              <button
                onClick={() => switchMode('reset')}
                className="text-sm text-cyber-blue hover:text-white transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
