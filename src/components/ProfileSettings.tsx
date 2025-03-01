import React, { useState, useEffect } from 'react';
import { X, Save, User, Globe, Bell, Moon, Sun, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfileSettingsProps {
  userId: string;
  onClose: () => void;
}

export function ProfileSettings({ userId, onClose }: ProfileSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [profile, setProfile] = useState({
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
    interests: [] as string[],
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;

        if (data) {
          setProfile({
            ...profile,
            ...data,
            social_links: data.social_links || profile.social_links,
            professional_info: data.professional_info || profile.professional_info,
            interests: data.interests || []
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setProfile(prev => ({ ...prev, [name]: checked }));
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [name]: value
      }
    }));
  };

  const handleProfessionalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      professional_info: {
        ...prev.professional_info,
        [name]: value
      }
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setProfile(prev => {
      const interests = [...prev.interests];
      const index = interests.indexOf(interest);
      
      if (index === -1) {
        interests.push(interest);
      } else {
        interests.splice(index, 1);
      }
      
      return { ...prev, interests };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...profile,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/80 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyber-blue"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 text-center">
        <div className="fixed inset-0 bg-navy-900/80 backdrop-blur-sm" onClick={onClose} />
        
        <div className="inline-block w-full max-w-4xl my-8 text-left align-middle transition-all transform">
          <div className="relative bg-navy-900/90 backdrop-blur-lg rounded-2xl border border-cyber-blue/20 shadow-xl">
            {/* Header */}
            <div className="p-6 border-b border-cyber-blue/10">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-cyber-blue">Profile Settings</h1>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-navy-800/50 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-6">
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-lg font-medium text-cyber-blue">
                    <User className="h-5 w-5" />
                    <h2>Personal Information</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={profile.full_name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-navy-800/50 border border-cyber-blue/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-blue/50"
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Language
                      </label>
                      <select
                        name="language"
                        value={profile.language}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-navy-800/50 border border-cyber-blue/20 rounded-lg text-white focus:outline-none focus:border-cyber-blue/50"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-lg font-medium text-cyber-blue">
                    <Globe className="h-5 w-5" />
                    <h2>Professional Information</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={profile.professional_info.title}
                        onChange={handleProfessionalChange}
                        className="w-full px-4 py-2 bg-navy-800/50 border border-cyber-blue/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-blue/50"
                        placeholder="Your job title"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={profile.professional_info.company}
                        onChange={handleProfessionalChange}
                        className="w-full px-4 py-2 bg-navy-800/50 border border-cyber-blue/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-blue/50"
                        placeholder="Your company"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Industry
                      </label>
                      <select
                        name="industry"
                        value={profile.professional_info.industry}
                        onChange={handleProfessionalChange}
                        className="w-full px-4 py-2 bg-navy-800/50 border border-cyber-blue/20 rounded-lg text-white focus:outline-none focus:border-cyber-blue/50"
                      >
                        <option value="">Select Industry</option>
                        <option value="technology">Technology</option>
                        <option value="finance">Finance</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="education">Education</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="retail">Retail</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-lg font-medium text-cyber-blue">
                    <Globe className="h-5 w-5" />
                    <h2>Social Links</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Twitter
                      </label>
                      <input
                        type="text"
                        name="twitter"
                        value={profile.social_links.twitter}
                        onChange={handleSocialChange}
                        className="w-full px-4 py-2 bg-navy-800/50 border border-cyber-blue/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-blue/50"
                        placeholder="@username"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        LinkedIn
                      </label>
                      <input
                        type="text"
                        name="linkedin"
                        value={profile.social_links.linkedin}
                        onChange={handleSocialChange}
                        className="w-full px-4 py-2 bg-navy-800/50 border border-cyber-blue/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-blue/50"
                        placeholder="LinkedIn profile URL"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        GitHub
                      </label>
                      <input
                        type="text"
                        name="github"
                        value={profile.social_links.github}
                        onChange={handleSocialChange}
                        className="w-full px-4 py-2 bg-navy-800/50 border border-cyber-blue/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-blue/50"
                        placeholder="GitHub username"
                      />
                    </div>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-lg font-medium text-cyber-blue">
                    <Bell className="h-5 w-5" />
                    <h2>Notification Preferences</h2>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="email_notifications"
                        name="email_notifications"
                        checked={profile.email_notifications}
                        onChange={(e) => setProfile(prev => ({ ...prev, email_notifications: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-cyber-blue focus:ring-cyber-blue"
                      />
                      <label htmlFor="email_notifications" className="ml-2 block text-sm text-gray-300">
                        Email Notifications
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="push_notifications"
                        name="push_notifications"
                        checked={profile.push_notifications}
                        onChange={(e) => setProfile(prev => ({ ...prev, push_notifications: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-cyber-blue focus:ring-cyber-blue"
                      />
                      <label htmlFor="push_notifications" className="ml-2 block text-sm text-gray-300">
                        Push Notifications
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="newsletter_subscription"
                        name="newsletter_subscription"
                        checked={profile.newsletter_subscription}
                        onChange={(e) => setProfile(prev => ({ ...prev, newsletter_subscription: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-cyber-blue focus:ring-cyber-blue"
                      />
                      <label htmlFor="newsletter_subscription" className="ml-2 block text-sm text-gray-300">
                        Newsletter Subscription
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="marketing_emails"
                        name="marketing_emails"
                        checked={profile.marketing_emails}
                        onChange={(e) => setProfile(prev => ({ ...prev, marketing_emails: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-cyber-blue focus:ring-cyber-blue"
                      />
                      <label htmlFor="marketing_emails" className="ml-2 block text-sm text-gray-300">
                        Marketing Emails
                      </label>
                    </div>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-lg font-medium text-cyber-blue">
                    <Shield className="h-5 w-5" />
                    <h2>Privacy Settings</h2>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Profile Visibility
                      </label>
                      <select
                        name="profile_visibility"
                        value={profile.profile_visibility}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-navy-800/50 border border-cyber-blue/20 rounded-lg text-white focus:outline-none focus:border-cyber-blue/50"
                      >
                        <option value="private">Private</option>
                        <option value="public">Public</option>
                        <option value="contacts">Contacts Only</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="data_sharing"
                        name="data_sharing"
                        checked={profile.data_sharing}
                        onChange={(e) => setProfile(prev => ({ ...prev, data_sharing: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-cyber-blue focus:ring-cyber-blue"
                      />
                      <label htmlFor="data_sharing" className="ml-2 block text-sm text-gray-300">
                        Allow data sharing for service improvement
                      </label>
                    </div>
                  </div>
                </div>

                {/* Interests */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-lg font-medium text-cyber-blue">
                    <Star className="h-5 w-5" />
                    <h2>Interests</h2>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {['AI', 'Machine Learning', 'Cybersecurity', 'Web Development', 'Mobile Apps', 
                      'Cloud Computing', 'Data Science', 'Blockchain', 'IoT', 'AR/VR', 
                      'Robotics', 'DevOps'].map(interest => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleInterestToggle(interest)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                          ${profile.interests.includes(interest)
                            ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30'
                            : 'bg-navy-800/50 text-gray-300 border border-gray-700 hover:border-cyber-blue/20'
                          }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-cyber-blue/10">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue/30 rounded-lg text-cyber-blue hover:text-white transition-all duration-200"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-cyber-blue"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Star icon component
function Star(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
