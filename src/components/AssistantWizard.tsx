import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Save, Wand2, X } from 'lucide-react';
import type { AssistantTemplate, WizardState, SavedAssistant } from '../templates/types';
import {
  NameAndPurposeStep,
  ExpertiseStep,
  PersonalityStep,
  InstructionsStep,
  PreviewStep
} from './Wizard/WizardSteps';

interface AssistantWizardProps {
  userId: string;
  isAdmin: boolean;
  onComplete: (assistant: SavedAssistant) => void;
  onClose: () => void;
}

const WIZARD_STEPS = [
  {
    id: 1,
    title: "Name & Purpose",
    description: "Give your assistant a name and define its purpose"
  },
  {
    id: 2,
    title: "Expertise",
    description: "Select the areas of expertise"
  },
  {
    id: 3,
    title: "Personality",
    description: "Define the communication style and tone"
  },
  {
    id: 4,
    title: "Instructions",
    description: "Set custom instructions and initial message"
  },
  {
    id: 5,
    title: "Preview",
    description: "Test and finalize your assistant"
  }
];

export function AssistantWizard({ userId, isAdmin, onComplete, onClose }: AssistantWizardProps) {
  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    template: {
      title: '',
      purpose: '',
      tone: 'professional',
      expertise: [],
      initialMessage: '',
      systemPrompt: '',
      model: 'gpt-4'
    },
    isPreviewEnabled: false
  });

  const updateTemplate = (updates: Partial<AssistantTemplate>) => {
    setState(prev => ({
      ...prev,
      template: { ...prev.template, ...updates }
    }));
  };

  const canProceed = () => {
    const { template } = state;
    switch (state.currentStep) {
      case 1:
        return template.title?.length > 0 && template.purpose?.length > 0;
      case 2:
        return (template.expertise?.length || 0) > 0;
      case 3:
        return template.tone !== undefined;
      case 4:
        return template.initialMessage?.length > 0;
      default:
        return true;
    }
  };

  const handleComplete = () => {
    const newAssistant: SavedAssistant = {
      id: crypto.randomUUID(),
      ...state.template as AssistantTemplate,
      created_by: userId,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFavorite: false,
      lastUsed: null
    };
    onComplete(newAssistant);
  };

  return (
    <div className="fixed inset-0 bg-navy-900 text-white z-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-cyber-blue/20">
          <div className="flex items-center space-x-4">
            <Wand2 className="h-6 w-6 text-cyber-blue" />
            <div>
              <h1 className="text-2xl font-bold text-cyber-blue">Create AI Assistant</h1>
              <p className="text-gray-400">Step {state.currentStep} of 5: {WIZARD_STEPS[state.currentStep - 1].title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-navy-800/50 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-cyber-blue/20">
          <div className="flex space-x-2">
            {WIZARD_STEPS.map((step) => (
              <div key={step.id} className="flex-1">
                <div
                  className={`h-1 rounded ${
                    step.id <= state.currentStep ? 'bg-cyber-blue' : 'bg-navy-800'
                  }`}
                />
                <div className="mt-2">
                  <p className="text-sm font-medium text-cyber-blue">{step.title}</p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pb-32">
          {state.currentStep === 1 && (
            <NameAndPurposeStep
              data={state.template}
              onUpdate={updateTemplate}
              onNext={() => setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))}
              onBack={() => setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }))}
              isValid={canProceed()}
            />
          )}
          {state.currentStep === 2 && (
            <ExpertiseStep
              data={state.template}
              onUpdate={updateTemplate}
              onNext={() => setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))}
              onBack={() => setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }))}
              isValid={canProceed()}
            />
          )}
          {state.currentStep === 3 && (
            <PersonalityStep
              data={state.template}
              onUpdate={updateTemplate}
              onNext={() => setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))}
              onBack={() => setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }))}
              isValid={canProceed()}
            />
          )}
          {state.currentStep === 4 && (
            <InstructionsStep
              data={state.template}
              onUpdate={updateTemplate}
              onNext={() => setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))}
              onBack={() => setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }))}
              isValid={canProceed()}
            />
          )}
          {state.currentStep === 5 && (
            <PreviewStep
              data={state.template}
              onUpdate={updateTemplate}
              onNext={handleComplete}
              onBack={() => setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }))}
              isValid={canProceed()}
            />
          )}
        </div>

        {/* Footer */}
        <div className="fixed bottom-16 left-0 right-0 flex justify-between items-center p-6 border-t border-cyber-blue/20 bg-navy-900">
          <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
            <button
              onClick={() => setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }))}
              disabled={state.currentStep === 1}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-cyber-blue hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            {state.currentStep === 5 ? (
              <button
                onClick={handleComplete}
                disabled={!canProceed()}
                className="flex items-center space-x-2 px-6 py-2 bg-cyber-blue rounded-lg text-white hover:bg-cyber-blue/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>Create Assistant</span>
              </button>
            ) : (
              <button
                onClick={() => setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))}
                disabled={!canProceed()}
                className="flex items-center space-x-2 px-6 py-2 bg-cyber-blue rounded-lg text-white hover:bg-cyber-blue/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
