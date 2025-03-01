import React, { useState, useEffect } from 'react';
import { Plus, Star, Clock, Search } from 'lucide-react';
import type { SavedAssistant } from '../templates/types';
import { supabase } from '../lib/supabase';
import { AssistantWizard } from './AssistantWizard';

interface AssistantSelectionProps {
  userId: string;
  isAdmin: boolean;
  onSelectAssistant: (assistant: SavedAssistant) => void;
}

export function AssistantSelection({ userId, isAdmin, onSelectAssistant }: AssistantSelectionProps) {
  const [savedAssistants, setSavedAssistants] = useState<SavedAssistant[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'recent'>('all');

  useEffect(() => {
    const loadAssistants = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
          .from('assistants')
          .select()
          .or(`created_by.eq.${userId},is_public.eq.true`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading assistants:', error);
          return;
        }

        // Transform the data to match SavedAssistant type
        const transformedData: SavedAssistant[] = (data || []).map(assistant => ({
          id: assistant.id,
          title: assistant.title,
          systemPrompt: assistant.system_prompt || '',
          initialMessage: assistant.initial_message || '',
          model: assistant.model,
          tone: assistant.tone,
          expertise: assistant.expertise || [],
          customInstructions: assistant.custom_instructions,
          metadata: assistant.metadata || {},
          created_by: assistant.created_by,
          isPublic: assistant.is_public,
          created_at: assistant.created_at,
          updated_at: assistant.updated_at,
          isFavorite: assistant.is_favorite,
          lastUsed: assistant.last_used
        }));

        setSavedAssistants(transformedData);
      } catch (err) {
        console.error('Error loading assistants:', err);
      }
    };

    loadAssistants();
  }, [userId]);

  const filteredAssistants = savedAssistants.filter(assistant => {
    const matchesSearch = assistant.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assistant.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));

    switch (filter) {
      case 'favorites':
        return matchesSearch && assistant.isFavorite;
      case 'recent':
        return matchesSearch && assistant.lastUsed !== null;
      default:
        return matchesSearch;
    }
  });

  const handleCreateAssistant = () => {
    setIsWizardOpen(true);
  };

  const handleWizardComplete = (newAssistant: SavedAssistant) => {
    setSavedAssistants(prev => [...prev, newAssistant]);
    setIsWizardOpen(false);
    onSelectAssistant(newAssistant);
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white p-6">
      {isWizardOpen ? (
        <AssistantWizard
          userId={userId}
          isAdmin={isAdmin}
          onComplete={handleWizardComplete}
          onClose={() => setIsWizardOpen(false)}
        />
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-cyber-blue">AI Assistants</h1>
            <button
              onClick={handleCreateAssistant}
              className="flex items-center space-x-2 px-4 py-2 bg-cyber-blue/20 rounded-lg border border-cyber-blue text-cyber-blue hover:text-white"
            >
              <Plus className="h-5 w-5" />
              <span>Create Assistant</span>
            </button>
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assistants..."
                className="w-full pl-10 pr-4 py-2 bg-navy-800/50 rounded-lg border border-cyber-blue/20 focus:outline-none focus:border-cyber-blue"
              />
            </div>
          </div>

          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all' ? 'bg-cyber-blue/20 text-cyber-blue' : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                filter === 'favorites' ? 'bg-cyber-blue/20 text-cyber-blue' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Star className="h-4 w-4" />
              <span>Favorites</span>
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                filter === 'recent' ? 'bg-cyber-blue/20 text-cyber-blue' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Recent</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssistants.map((assistant) => (
              <button
                key={assistant.id}
                onClick={() => onSelectAssistant(assistant)}
                className="flex flex-col p-4 bg-navy-800/50 rounded-lg border border-cyber-blue/20 hover:border-cyber-blue text-left transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-cyber-blue">{assistant.title}</h3>
                  {assistant.isFavorite && (
                    <Star className="h-4 w-4 text-cyber-blue" fill="currentColor" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {assistant.expertise.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 text-xs bg-navy-700/50 rounded-full text-gray-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                  {assistant.customInstructions || assistant.systemPrompt}
                </p>
                {assistant.lastUsed && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500 mt-auto">
                    <Clock className="h-3 w-3" />
                    <span>Last used: {new Date(assistant.lastUsed).toLocaleDateString()}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
