import OpenAI from 'openai';
import { supabase } from './supabase';

// Initialize OpenAI client with a function to get the API key
async function getOpenAIClient() {
  try {
    // Check if user is authenticated first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const { data: apiKey, error } = await supabase.rpc('get_api_key', {
      service_name: 'openai'
    });

    if (error) {
      if (error.message.includes('Admin privileges required')) {
        throw new Error('Admin privileges required to access API key');
      }
      throw error;
    }
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please set up your API key in the admin panel.');
    }

    // Validate API key format
    if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
      throw new Error('Invalid API key format. Please check your API key.');
    }

    return new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Only for development! In production, use a backend service
    });
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
    throw error;
  }
}

// Rate limiting configuration
const RATE_LIMIT = 50; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds
const requestTimes: number[] = [];

// Message history type
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Response type
export interface AIResponse {
  success: boolean;
  message?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Token counting helper
function countTokens(text: string): number {
  // This is a simple approximation. For more accurate results,
  // you might want to use a proper tokenizer like GPT-3's
  const words = text.trim().split(/\s+/);
  return Math.ceil(words.length * 1.3); // Rough estimate: 1 word ≈ 1.3 tokens
}

// Check rate limit
function checkRateLimit(): boolean {
  const now = Date.now();
  // Remove old requests
  while (requestTimes.length > 0 && requestTimes[0] < now - RATE_WINDOW) {
    requestTimes.shift();
  }
  // Check if under limit
  return requestTimes.length < RATE_LIMIT;
}

// Add request to rate limit tracker
function trackRequest() {
  requestTimes.push(Date.now());
}

// Get system prompt based on user role
async function getSystemPrompt(userId: string): Promise<string> {
  try {
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (userRole?.role === 'admin') {
      return `You are an AI assistant with administrative capabilities. You can help with system configuration, user management, and technical support.`;
    }

    return `You are a helpful AI assistant focused on providing information about our services and answering general questions.`;
  } catch (error) {
    console.error('Error getting user role:', error);
    return `You are a helpful AI assistant focused on providing information about our services and answering general questions.`;
  }
}

// Get conversation history
async function getConversationHistory(sessionId: string, limit = 10): Promise<Message[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('content, is_bot')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }

  return data.reverse().map(msg => ({
    role: msg.is_bot ? 'assistant' : 'user',
    content: msg.content
  }));
}

// Main function to get AI response
export async function getAIResponse(
  message: string,
  userId: string,
  sessionId: string,
  model = 'chatgpt-4o-latest',
  onStream?: (chunk: string, usage?: { promptTokens: number }) => void
): Promise<AIResponse> {
  try {
    // Check rate limit
    if (!checkRateLimit()) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please wait a moment before sending another message.'
      };
    }

    // Get OpenAI client
    const openai = await getOpenAIClient();

    // Get system prompt and conversation history
    const [systemPrompt, history] = await Promise.all([
      getSystemPrompt(userId),
      getConversationHistory(sessionId)
    ]);

    // Prepare messages for OpenAI
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    // Calculate prompt tokens
    const promptTokens = messages.reduce((acc, msg) => acc + countTokens(msg.content), 0);

    // Track this request
    trackRequest();

    // Map model alias to actual OpenAI model
    const modelMap: Record<string, string> = {
      'gpt-4o': 'gpt-4-1106-preview',
      'gpt-4o-2024-08-06': 'gpt-4-0613',
      'chatgpt-4o-latest': 'gpt-4-turbo-preview',
      'gpt-4o-mini': 'gpt-4-turbo-preview',
      'o1': 'gpt-4-turbo-preview',
      'o1-mini': 'gpt-4-turbo-preview'
    };

    const openaiModel = modelMap[model] || 'gpt-4-turbo-preview';

    let fullResponse = '';
    let completionTokens = 0;

    if (onStream) {
      // Notify about prompt tokens immediately
      onStream('', { promptTokens });

      // Stream the response
      const stream = await openai.chat.completions.create({
        model: openaiModel,
        messages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          completionTokens += countTokens(content);
          onStream(content);
        }
      }

      return {
        success: true,
        message: fullResponse,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens
        }
      };
    } else {
      // Get response from OpenAI without streaming
      const completion = await openai.chat.completions.create({
        model: openaiModel,
        messages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      const response = completion.choices[0]?.message?.content;

      if (!response) {
        throw new Error('No response from AI');
      }

      completionTokens = countTokens(response);

      return {
        success: true,
        message: response,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens
        }
      };
    }
  } catch (error) {
    console.error('Error getting AI response:', error);
    let errorMessage = 'Failed to get AI response';
    
    if (error instanceof Error) {
      if (error.message.includes('API key not found')) {
        errorMessage = 'OpenAI API key not configured. Please contact an administrator.';
      } else if (error.message.includes('Admin privileges required')) {
        errorMessage = 'Admin privileges required to use the AI chat.';
      } else if (error.message.includes('Invalid API key format')) {
        errorMessage = 'Invalid API key format. Please check your API key.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Invalid API key. Please check your API key.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Function to validate API key
export async function validateAPIKey(): Promise<boolean> {
  try {
    const openai = await getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: 'Test' }],
      max_tokens: 5
    });
    return !!response;
  } catch (error) {
    console.error('Error validating API key:', error);
    return false;
  }
}
