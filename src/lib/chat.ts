import { z } from 'zod';
import { supabase } from './supabase';
import { getProvider } from './providers/factory';
import type { Message } from './providers/types';

// Maximum number of messages per session
const MAX_MESSAGES = 50;

// Message validation schema
const messageSchema = z.object({
  content: z.string()
    .min(1, "Message cannot be empty")
    .max(500, "Message is too long")
});

export type ChatMessage = {
  id: string;
  content: string;
  is_bot: boolean;
  created_at: string;
  isStreaming?: boolean;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

export async function deleteMessage(messageId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete message'
    };
  }
}

export async function sendMessage(
  content: string, 
  userId: string, 
  sessionId: string,
  onStream?: (chunk: string, usage?: { promptTokens: number }) => void,
  model: string = 'gpt-4-turbo-preview'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate message format
    const result = messageSchema.safeParse({ content });
    if (!result.success) {
      return {
        success: false,
        error: result.error.errors[0].message
      };
    }

    // Check message count for session
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact' })
      .eq('session_id', sessionId);

    if (count && count >= MAX_MESSAGES) {
      return {
        success: false,
        error: 'Maximum message limit reached for this session. Please start a new session.'
      };
    }

    // Insert user message
    const { error: userMsgError } = await supabase
      .from('chat_messages')
      .insert({
        content,
        user_id: userId,
        session_id: sessionId,
        is_bot: false
      });

    if (userMsgError) throw userMsgError;

    // Get AI response with streaming based on model type
    const provider = getProvider(model);
    const aiResponse = await provider.getResponse(content, userId, sessionId, model, onStream);

    if (!aiResponse.success) {
      throw new Error(aiResponse.error || 'Failed to get AI response');
    }

    // Insert bot response
    const { error: botMsgError } = await supabase
      .from('chat_messages')
      .insert({
        content: aiResponse.message,
        user_id: userId,
        session_id: sessionId,
        is_bot: true,
        usage: aiResponse.usage
      });

    if (botMsgError) throw botMsgError;

    return { success: true };
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message'
    };
  }
}

export async function getSessionMessages(sessionId: string, userId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function deleteChatHistory(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting chat history:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete chat history' 
    };
  }
}

export async function deleteSession(sessionId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete chat session' 
    };
  }
}
