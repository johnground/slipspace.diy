import OpenAI from 'openai';
import { supabase } from '../supabase';
import { AIProvider, AIResponse, Message } from './types';
import { getModelId } from '../models';

class OpenAIProvider implements AIProvider {
  private static instance: OpenAIProvider;
  private requestTimes: number[] = [];
  private readonly RATE_LIMIT = 50;
  private readonly RATE_WINDOW = 60 * 1000;

  private constructor() {}

  public static getInstance(): OpenAIProvider {
    if (!OpenAIProvider.instance) {
      OpenAIProvider.instance = new OpenAIProvider();
    }
    return OpenAIProvider.instance;
  }

  private async getClient() {
    try {
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

      if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
        throw new Error('Invalid API key format. Please check your API key.');
      }

      return new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      });
    } catch (error) {
      console.error('Error initializing OpenAI client:', error);
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

  private async getSystemPrompt(userId: string): Promise<string> {
    // TODO: Implement system prompt customization
    return 'You are a helpful AI assistant.';
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
    modelAlias: string,
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
      const systemPrompt = await this.getSystemPrompt(userId);
      const model = getModelId(modelAlias);

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      this.trackRequest();

      if (onStream) {
        const stream = await client.chat.completions.create({
          model,
          messages,
          stream: true
        });

        let fullResponse = '';
        let usage = { promptTokens: 0 };

        for await (const chunk of stream) {
          if (chunk.choices[0]?.delta?.content) {
            fullResponse += chunk.choices[0].delta.content;
            onStream(chunk.choices[0].delta.content, usage);
          }
        }

        return {
          success: true,
          message: fullResponse
        };
      } else {
        const completion = await client.chat.completions.create({
          model,
          messages
        });

        return {
          success: true,
          message: completion.choices[0]?.message?.content || '',
          usage: {
            promptTokens: completion.usage?.prompt_tokens || 0,
            completionTokens: completion.usage?.completion_tokens || 0,
            totalTokens: completion.usage?.total_tokens || 0
          }
        };
      }
    } catch (error) {
      console.error('Error getting OpenAI response:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get AI response'
      };
    }
  }

  async validateAPIKey(): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.chat.completions.create({
        model: getModelId('gpt-4'),
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const openAIProvider = OpenAIProvider.getInstance();
