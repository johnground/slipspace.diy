import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { APIProvider, AssistantConfig } from '../templates/types';

interface AssistantConfigPanelProps {
  config: AssistantConfig;
  onClose: () => void;
  onSave: (config: AssistantConfig) => void;
}

export function AssistantConfigPanel({ config, onClose, onSave }: AssistantConfigPanelProps) {
  const [currentConfig, setCurrentConfig] = useState<AssistantConfig>(config);
  const [currentStep, setCurrentStep] = useState(0);
  const [newProvider, setNewProvider] = useState<APIProvider>({
    id: '',
    name: '',
    apiKey: '',
    models: [],
    baseUrl: ''
  });

  // Load API keys from secure storage
  useEffect(() => {
    const loadApiKeys = async () => {
      try {
        const keys = await chrome.storage.sync.get('apiKeys');
        if (keys.apiKeys) {
          setCurrentConfig(prev => ({
            ...prev,
            providers: prev.providers.map(provider => ({
              ...provider,
              apiKey: keys.apiKeys[provider.id] || provider.apiKey
            }))
          }));
        }
      } catch (error) {
        console.error('Failed to load API keys:', error);
      }
    };
    loadApiKeys();
  }, []);

  const steps = [
    {
      title: 'Welcome to AI Assistant',
      content: (
        <div className="space-y-4">
          <p className="text-lg">Let's set up your AI assistant preferences. You can:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Configure multiple AI providers</li>
            <li>Set your preferred models</li>
            <li>Enable/disable features</li>
            <li>Manage your API keys securely</li>
          </ul>
        </div>
      )
    },
    {
      title: 'Choose Your Features',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-cyber-blue">Features</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={currentConfig.enableModelSelection}
                onChange={e => setCurrentConfig(prev => ({
                  ...prev,
                  enableModelSelection: e.target.checked
                }))}
                className="form-checkbox text-cyber-blue"
              />
              <span>Enable Model Selection</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={currentConfig.enableChatHistory}
                onChange={e => setCurrentConfig(prev => ({
                  ...prev,
                  enableChatHistory: e.target.checked
                }))}
                className="form-checkbox text-cyber-blue"
              />
              <span>Enable Chat History</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={currentConfig.enableFileUploads}
                onChange={e => setCurrentConfig(prev => ({
                  ...prev,
                  enableFileUploads: e.target.checked
                }))}
                className="form-checkbox text-cyber-blue"
              />
              <span>Enable File Uploads</span>
            </label>
          </div>
        </div>
      )
    },
    {
      title: 'Configure AI Providers',
      content: (
        <div className="space-y-4">
          <div className="space-y-4">
            {currentConfig.providers.map(provider => (
              <div key={provider.id} className="bg-navy-900/50 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-cyber-blue">{provider.name}</h4>
                  <button
                    onClick={() => handleRemoveProvider(provider.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    type="password"
                    placeholder="API Key"
                    value={provider.apiKey || ''}
                    onChange={e => setCurrentConfig(prev => ({
                      ...prev,
                      providers: prev.providers.map(p => 
                        p.id === provider.id ? { ...p, apiKey: e.target.value } : p
                      )
                    }))}
                    className="w-full bg-navy-800/50 border border-cyber-blue/20 rounded px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Base URL (optional)"
                    value={provider.baseUrl || ''}
                    onChange={e => setCurrentConfig(prev => ({
                      ...prev,
                      providers: prev.providers.map(p => 
                        p.id === provider.id ? { ...p, baseUrl: e.target.value } : p
                      )
                    }))}
                    className="w-full bg-navy-800/50 border border-cyber-blue/20 rounded px-3 py-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Set Defaults',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-cyber-blue">Default Settings</h3>
          <div className="space-y-2">
            <select
              value={currentConfig.defaultProvider}
              onChange={e => setCurrentConfig(prev => ({
                ...prev,
                defaultProvider: e.target.value,
                defaultModel: '' // Reset model when provider changes
              }))}
              className="w-full bg-navy-800/50 border border-cyber-blue/20 rounded px-3 py-2"
            >
              <option value="">Select Default Provider</option>
              {currentConfig.providers.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            <select
              value={currentConfig.defaultModel}
              onChange={e => setCurrentConfig(prev => ({
                ...prev,
                defaultModel: e.target.value
              }))}
              className="w-full bg-navy-800/50 border border-cyber-blue/20 rounded px-3 py-2"
              disabled={!currentConfig.defaultProvider}
            >
              <option value="">Select Default Model</option>
              {currentConfig.providers
                .find(p => p.id === currentConfig.defaultProvider)
                ?.models.map(model => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )
    }
  ];

  const handleSave = async () => {
    try {
      // Save API keys to secure storage
      const apiKeys = currentConfig.providers.reduce((acc, provider) => ({
        ...acc,
        [provider.id]: provider.apiKey
      }), {});
      
      await chrome.storage.sync.set({ apiKeys });
      onSave(currentConfig);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  };

  const handleAddProvider = () => {
    if (newProvider.id && newProvider.name) {
      setCurrentConfig(prev => ({
        ...prev,
        providers: [...prev.providers, { ...newProvider }]
      }));
      setNewProvider({
        id: '',
        name: '',
        apiKey: '',
        models: [],
        baseUrl: ''
      });
    }
  };

  const handleRemoveProvider = (providerId: string) => {
    setCurrentConfig(prev => ({
      ...prev,
      providers: prev.providers.filter(p => p.id !== providerId),
      defaultProvider: prev.defaultProvider === providerId ? '' : prev.defaultProvider,
      defaultModel: prev.defaultProvider === providerId ? '' : prev.defaultModel
    }));
  };

  return (
    <div className="fixed inset-0 z-[1001] bg-navy-900/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-navy-800 border border-cyber-blue/20 rounded-lg shadow-xl w-[600px] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-cyber-blue/20">
          <h2 className="text-xl font-medium text-cyber-blue">{steps[currentStep].title}</h2>
          <button
            onClick={onClose}
            className="text-cyber-blue hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {steps[currentStep].content}
        </div>

        <div className="flex justify-between p-4 border-t border-cyber-blue/20">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 text-cyber-blue hover:text-white transition-colors disabled:opacity-50"
          >
            Previous
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-cyber-blue hover:text-white transition-colors"
            >
              {currentStep === steps.length - 1 ? 'Skip' : 'Cancel'}
            </button>
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-4 py-2 bg-cyber-blue/20 hover:bg-cyber-blue/30 text-cyber-blue rounded transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-cyber-blue/20 hover:bg-cyber-blue/30 text-cyber-blue rounded transition-colors"
              >
                Finish Setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
