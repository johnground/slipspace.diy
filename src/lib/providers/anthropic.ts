import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../supabase';
import { AIProvider, AIResponse, Message } from './types';

class AnthropicProvider implements AIProvider {
  private static instance: AnthropicProvider;
  private requestTimes: number[] = [];
  private readonly RATE_LIMIT = 50;
  private readonly RATE_WINDOW = 60 * 1000;

  private constructor() {}

  public static getInstance(): AnthropicProvider {
    if (!AnthropicProvider.instance) {
      AnthropicProvider.instance = new AnthropicProvider();
    }
    return AnthropicProvider.instance;
  }

  private async getClient() {
    try {
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

  private checkRateLimit(): boolean {
    const now = Date.now();
    while (this.requestTimes.length > 0 && this.requestTimes[0] < now - this.RATE_WINDOW) {
      this.requestTimes.shift();
    }
    return this.requestTimes.length < this.RATE_LIMIT;
  }

  private trackRequest() {
    this.requestTimes.push(Date.now());
  }

  async getConversationHistory(sessionId: string, limit = 10): Promise<Message[]> {
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

  async getResponse(
    message: string,
    userId: string,
    sessionId: string,
    model: string,
    onStream?: (chunk: string, usage?: { promptTokens: number }) => void
  ): Promise<AIResponse> {
    try {
      if (!this.checkRateLimit()) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        };
      }

      const client = await this.getClient();
      const history = await this.getConversationHistory(sessionId);

      const messages = history.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        content: msg.content
      }));

      messages.push({ role: 'user', content: message });

      this.trackRequest();

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

  async validateAPIKey(): Promise<boolean> {
    try {
      const client = await this.getClient();
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
}

export const anthropicProvider = AnthropicProvider.getInstance();
