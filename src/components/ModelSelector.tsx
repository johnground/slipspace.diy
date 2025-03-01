import React from 'react';
import { Brain, ChevronDown } from 'lucide-react';
import { PROVIDERS, type Model } from '../lib/models';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find the selected model across all providers
  const selectedModelInfo = Object.values(PROVIDERS)
    .flatMap(provider => provider.models)
    .find(model => model.alias === selectedModel) || PROVIDERS.anthropic.models[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between space-x-2 px-3 py-1.5 bg-navy-800/50 backdrop-blur-sm border border-cyber-blue/20 rounded-lg text-white hover:border-cyber-blue/50 transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-center space-x-2">
          <div className="text-left">
            <p className="text-sm font-medium">{selectedModelInfo.name}</p>
            <p className="text-xs text-gray-400">{PROVIDERS[selectedModelInfo.provider].name}</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-[300px] mt-2 right-0 bg-navy-900/95 backdrop-blur-sm border border-cyber-blue/20 rounded-lg shadow-xl">
          <div className="py-1 max-h-[400px] overflow-auto">
            {Object.entries(PROVIDERS).map(([providerId, provider]) => (
              <div key={providerId} className="border-b border-cyber-blue/10 last:border-b-0">
                <div className="px-4 py-2 bg-navy-800/30">
                  <h3 className="text-sm font-medium text-cyber-blue">{provider.name}</h3>
                  <p className="text-xs text-gray-400">{provider.description}</p>
                </div>
                <div className="py-1">
                  {provider.models.map((model) => (
                    <button
                      key={model.alias}
                      onClick={() => {
                        onModelChange(model.alias);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-2 flex items-start space-x-3 hover:bg-navy-800/50 transition-colors ${
                        selectedModel === model.alias ? 'bg-navy-800/80 border-l-2 border-cyber-blue' : ''
                      }`}
                    >
                      <Brain className={`h-5 w-5 mt-0.5 ${
                        selectedModel === model.alias ? 'text-cyber-blue' : 'text-gray-400'
                      }`} />
                      <div className="text-left">
                        <div className="flex items-center space-x-2">
                          <p className={`font-medium ${
                            selectedModel === model.alias ? 'text-cyber-blue' : 'text-white'
                          }`}>
                            {model.name}
                          </p>
                          {model.isLatest && (
                            <span className="px-1.5 py-0.5 text-xs bg-cyber-neon/10 border border-cyber-neon/30 rounded-full text-cyber-neon">
                              Latest
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {model.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
