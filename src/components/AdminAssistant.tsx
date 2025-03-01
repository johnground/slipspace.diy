import React, { useState } from 'react';
import { AIChatTemplate } from '../templates/AIChatTemplate';
import { AssistantWizard, type AssistantConfig } from './AssistantWizard';
import { sendMessage } from '../lib/chat';

interface AdminAssistantProps {
  userId: string;
  className?: string;
}

const DEFAULT_ADMIN_PROMPT = `You are an AI assistant specialized in helping administrators with system management and configuration tasks.

Your key responsibilities:
1. Help with user management and permissions
2. Assist with system configuration and settings
3. Provide guidance on security best practices
4. Monitor and explain system metrics
5. Help troubleshoot administrative issues

Remember to:
- Always verify admin permissions before providing sensitive information
- Use clear, technical language appropriate for system administrators
- Provide step-by-step procedures for complex tasks
- Emphasize security and best practices in all recommendations
- Format responses with markdown for better readability`;

export function AdminAssistant({ userId, className }: AdminAssistantProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [config, setConfig] = useState<AssistantConfig>({
    title: "Admin Assistant",
    purpose: "Help administrators with system management and configuration tasks",
    tone: "professional",
    expertise: ["System Administration", "Security", "User Management"],
    initialMessage: "Hello administrator! I'm here to help you with system management and configuration tasks. What can I assist you with?"
  });

  const handleMessage = async (message: string) => {
    try {
      const customPrompt = `You are an AI assistant with the following configuration:
Title: ${config.title}
Purpose: ${config.purpose}
Expertise: ${config.expertise.join(', ')}
Tone: ${config.tone}

${DEFAULT_ADMIN_PROMPT}`;

      const response = await sendMessage(message, userId, {
        model: 'gpt-4',
        systemPrompt: customPrompt
      });
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      return response;
    } catch (error) {
      console.error('Error in AdminAssistant:', error);
      throw error;
    }
  };

  const handleWizardComplete = (newConfig: AssistantConfig) => {
    setConfig(newConfig);
    setIsWizardOpen(false);
  };

  return (
    <>
      <AIChatTemplate
        title={config.title}
        systemPrompt={DEFAULT_ADMIN_PROMPT}
        initialMessage={config.initialMessage}
        model="gpt-4"
        userId={userId}
        onSendMessage={handleMessage}
        className={`${className} admin-assistant`}
        isAdmin={true}
        onConfigureAssistant={() => setIsWizardOpen(true)}
      />
      
      {isWizardOpen && (
        <AssistantWizard
          onComplete={handleWizardComplete}
          onClose={() => setIsWizardOpen(false)}
        />
      )}
    </>
  );
}
