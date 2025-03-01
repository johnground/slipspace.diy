import React from 'react';
import { type WizardStepProps } from '../../templates/types';

const EXPERTISE_OPTIONS = [
  'Technical Support',
  'System Administration',
  'Security',
  'Development',
  'User Management',
  'Infrastructure',
  'Compliance',
  'Documentation',
  'Training',
  'Analytics'
] as const;

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-like communication' },
  { value: 'friendly', label: 'Friendly', description: 'Casual and approachable interaction' },
  { value: 'technical', label: 'Technical', description: 'Detailed and technically precise' }
] as const;

export function NameAndPurposeStep({ data, onUpdate }: WizardStepProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-4">
        <label className="block">
          <span className="text-lg font-medium text-cyber-blue">Assistant Name</span>
          <input
            type="text"
            value={data.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="e.g., Security Expert Assistant"
            className="mt-1 w-full bg-navy-800/50 text-white placeholder-gray-400 px-4 py-2 rounded-lg border border-cyber-blue/20 focus:outline-none focus:border-cyber-blue"
          />
        </label>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-lg font-medium text-cyber-blue">Purpose</span>
          <textarea
            value={data.purpose || ''}
            onChange={(e) => onUpdate({ purpose: e.target.value })}
            placeholder="Describe what this assistant will help with..."
            className="mt-1 w-full h-32 bg-navy-800/50 text-white placeholder-gray-400 px-4 py-2 rounded-lg border border-cyber-blue/20 focus:outline-none focus:border-cyber-blue"
          />
        </label>
      </div>
    </div>
  );
}

export function ExpertiseStep({ data, onUpdate }: WizardStepProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {EXPERTISE_OPTIONS.map((expertise) => (
          <button
            key={expertise}
            onClick={() => {
              const current = data.expertise || [];
              const newExpertise = current.includes(expertise)
                ? current.filter(e => e !== expertise)
                : [...current, expertise];
              onUpdate({ expertise: newExpertise });
            }}
            className={`p-4 rounded-lg border ${
              data.expertise?.includes(expertise)
                ? 'bg-cyber-blue/20 border-cyber-blue text-white'
                : 'border-cyber-blue/20 text-gray-400 hover:text-white'
            }`}
          >
            {expertise}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PersonalityStep({ data, onUpdate }: WizardStepProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {TONE_OPTIONS.map((tone) => (
        <button
          key={tone.value}
          onClick={() => onUpdate({ tone: tone.value })}
          className={`w-full p-4 rounded-lg border ${
            data.tone === tone.value
              ? 'bg-cyber-blue/20 border-cyber-blue'
              : 'border-cyber-blue/20 hover:border-cyber-blue/50'
          }`}
        >
          <div className="flex flex-col items-start">
            <span className="text-lg font-medium text-cyber-blue">{tone.label}</span>
            <span className="text-sm text-gray-400">{tone.description}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export function InstructionsStep({ data, onUpdate }: WizardStepProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-4">
        <label className="block">
          <span className="text-lg font-medium text-cyber-blue">Custom Instructions</span>
          <textarea
            value={data.customInstructions || ''}
            onChange={(e) => onUpdate({ customInstructions: e.target.value })}
            placeholder="Add any specific instructions or guidelines for your assistant..."
            className="mt-1 w-full h-32 bg-navy-800/50 text-white placeholder-gray-400 px-4 py-2 rounded-lg border border-cyber-blue/20 focus:outline-none focus:border-cyber-blue"
          />
        </label>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-lg font-medium text-cyber-blue">Initial Message</span>
          <textarea
            value={data.initialMessage || ''}
            onChange={(e) => onUpdate({ initialMessage: e.target.value })}
            placeholder="Enter the first message your assistant will send..."
            className="mt-1 w-full h-32 bg-navy-800/50 text-white placeholder-gray-400 px-4 py-2 rounded-lg border border-cyber-blue/20 focus:outline-none focus:border-cyber-blue"
          />
        </label>
      </div>
    </div>
  );
}

export function PreviewStep({ data }: WizardStepProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-navy-800/50 rounded-lg border border-cyber-blue/20 p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-cyber-blue">{data.title}</h3>
          <p className="text-gray-400 mt-2">{data.purpose}</p>
        </div>

        <div>
          <h4 className="text-lg font-medium text-cyber-blue mb-2">Expertise</h4>
          <div className="flex flex-wrap gap-2">
            {data.expertise?.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-navy-700/50 rounded-full text-sm text-gray-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium text-cyber-blue mb-2">Communication Style</h4>
          <p className="text-gray-400">{data.tone}</p>
        </div>

        <div>
          <h4 className="text-lg font-medium text-cyber-blue mb-2">Custom Instructions</h4>
          <p className="text-gray-400">{data.customInstructions || 'No custom instructions provided.'}</p>
        </div>

        <div>
          <h4 className="text-lg font-medium text-cyber-blue mb-2">Initial Message</h4>
          <div className="bg-navy-700/50 rounded-lg p-4 text-white">
            {data.initialMessage}
          </div>
        </div>
      </div>
    </div>
  );
}
