import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';
import { AIChatTemplate } from '../templates/AIChatTemplate';
import { AssistantConfigPanel } from './AssistantConfigPanel';
import type { SavedAssistant } from '../templates/types';

interface UserAssistantProps {
  userId: string;
  assistant: SavedAssistant;
  onClose: () => void;
}

export function UserAssistant({ userId, assistant, onClose }: UserAssistantProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [currentAssistant, setCurrentAssistant] = useState(assistant);

  const handleSendMessage = async (message: string) => {
    try {
      const systemPrompt = `${currentAssistant.systemPrompt}${
        currentAssistant.customInstructions
          ? '\n\n' + currentAssistant.customInstructions
          : ''
      }`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          systemPrompt,
          model: currentAssistant.model,
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error in UserAssistant:', error);
      throw error;
    }
  };

  const handleConfigSave = (config: SavedAssistant) => {
    setCurrentAssistant(config);
    setIsConfigOpen(false);
  };

  return (
    <>
      <AIChatTemplate
        title={currentAssistant.title}
        systemPrompt={currentAssistant.systemPrompt}
        initialMessage={currentAssistant.initialMessage}
        model={currentAssistant.model}
        userId={userId}
        onSendMessage={handleSendMessage}
        onClose={onClose}
        onConfigureAssistant={() => setIsConfigOpen(true)}
      />

      {isConfigOpen && (
        <AssistantConfigPanel
          config={currentAssistant}
          onClose={() => setIsConfigOpen(false)}
          onSave={handleConfigSave}
        />
      )}
    </>
  );
}
