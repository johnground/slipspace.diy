import { supabase } from './supabase';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client with a function to get the API key
async function getAnthropicClient() {
  try {
    // Check if user is authenticated first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const { data: apiKey, error } = await supabase.rpc('get_api_key', {
      service_name: 'anthropic'
    });

    if (error) {
      if (error.message.includes('Admin privileges required')) {
        throw new Error('Admin privileges required to access API key');
      }
      throw error;
    }
    
    if (!apiKey) {
      throw new Error('Anthropic API key not found. Please set up your API key in the admin panel.');
    }

    return new Anthropic({
      apiKey
    });
  } catch (error) {
    console.error('Error initializing Anthropic client:', error);
    throw error;
  }
}

// Rate limiting configuration
const RATE_LIMIT = 50; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds
const requestTimes: number[] = [];

// Message type
export interface Message {
  role: 'user' | 'assistant';
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

// Get conversation history
export async function getConversationHistory(sessionId: string, limit = 10): Promise<Message[]> {
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return messages.reverse().map(msg => ({
    role: msg.is_bot ? 'assistant' : 'user',
    content: msg.content
  }));
}

// Main function to get AI response
export async function getAnthropicResponse(
  message: string,
  userId: string,
  sessionId: string,
  model = 'claude-3-5-sonnet-latest',
  onStream?: (chunk: string, usage?: { promptTokens: number }) => void
): Promise<AIResponse> {
  try {
    if (!checkRateLimit()) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      };
    }

    const client = await getAnthropicClient();
    const history = await getConversationHistory(sessionId);

    const messages = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    messages.push({ role: 'user', content: message });

    trackRequest();

    if (onStream) {
      const stream = await client.messages.create({
        model,
        messages,
        stream: true,
        max_tokens: 4096
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.text) {
          fullResponse += chunk.delta.text;
          onStream(chunk.delta.text);
        }
      }

      return {
        success: true,
        message: fullResponse
      };
    } else {
      const response = await client.messages.create({
        model,
        messages,
        max_tokens: 4096
      });

      return {
        success: true,
        message: response.content[0].text
      };
    }
  } catch (error) {
    console.error('Error getting Anthropic response:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get AI response'
    };
  }
}

// Function to validate API key
export async function validateAPIKey(): Promise<boolean> {
  try {
    const client = await getAnthropicClient();
    await client.messages.create({
      model: 'claude-3-5-haiku-latest',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 1
    });
    return true;
  } catch {
    return false;
  }
}
