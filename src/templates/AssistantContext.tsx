import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { AssistantContext, AssistantTemplate, AssistantState, AssistantActions } from './types';
import { sendMessage as sendChatMessage } from '../lib/chat';

interface AssistantProviderProps {
  children: React.ReactNode;
  userId: string;
  isAdmin: boolean;
  template: AssistantTemplate;
}

type AssistantAction =
  | { type: 'SEND_MESSAGE'; payload: { message: string; isBot: boolean } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'TOGGLE_MINIMIZE' }
  | { type: 'SET_OPEN'; payload: boolean };

const initialState: AssistantState = {
  isOpen: false,
  isMinimized: false,
  messages: [],
  isLoading: false
};

function assistantReducer(state: AssistantState, action: AssistantAction): AssistantState {
  switch (action.type) {
    case 'SEND_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: Date.now().toString(),
            content: action.payload.message,
            is_bot: action.payload.isBot,
            timestamp: new Date().toISOString()
          }
        ]
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'CLEAR_HISTORY':
      return { ...state, messages: [] };
    case 'TOGGLE_MINIMIZE':
      return { ...state, isMinimized: !state.isMinimized };
    case 'SET_OPEN':
      return { ...state, isOpen: action.payload };
    default:
      return state;
  }
}

const AssistantContextInstance = createContext<AssistantContext | null>(null);

export function AssistantProvider({ children, userId, isAdmin, template }: AssistantProviderProps) {
  const [state, dispatch] = useReducer(assistantReducer, {
    ...initialState,
    messages: template.initialMessage ? [{
      id: '0',
      content: template.initialMessage,
      is_bot: true,
      timestamp: new Date().toISOString()
    }] : []
  });

  const sendMessage = useCallback(async (message: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({
        type: 'SEND_MESSAGE',
        payload: { message, isBot: false }
      });

      const response = await sendChatMessage(message, userId, {
        model: template.model,
        systemPrompt: `${template.systemPrompt}${template.customInstructions ? '\n\n' + template.customInstructions : ''}`
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      dispatch({
        type: 'SEND_MESSAGE',
        payload: { message: response.message, isBot: true }
      });
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [userId, template.model, template.systemPrompt, template.customInstructions]);

  const clearHistory = useCallback(async () => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  const minimize = useCallback(() => {
    dispatch({ type: 'TOGGLE_MINIMIZE' });
  }, []);

  const maximize = useCallback(() => {
    dispatch({ type: 'TOGGLE_MINIMIZE' });
  }, []);

  const open = useCallback(() => {
    dispatch({ type: 'SET_OPEN', payload: true });
  }, []);

  const close = useCallback(() => {
    dispatch({ type: 'SET_OPEN', payload: false });
  }, []);

  const configure = useCallback(() => {
    if (template.configure) {
      template.configure();
    }
  }, [template.configure]);

  const value = useMemo(() => ({
    userId,
    isAdmin,
    template,
    state,
    actions: {
      sendMessage,
      clearHistory,
      configure,
      minimize,
      maximize,
      open,
      close
    }
  }), [userId, isAdmin, template, state, sendMessage, clearHistory, configure, minimize, maximize, open, close]);

  return (
    <AssistantContextInstance.Provider value={value}>
      {children}
    </AssistantContextInstance.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContextInstance);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
}
