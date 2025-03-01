import { AIProvider } from './types';
import { openAIProvider } from './openai';
import { anthropicProvider } from './anthropic';
import { PROVIDERS } from '../models';

export function getProvider(model: string | undefined | null): AIProvider {
  // Default to OpenAI if no model is specified
  if (!model || typeof model !== 'string') {
    return openAIProvider;
  }

  // Find the provider that has this model
  for (const [providerId, provider] of Object.entries(PROVIDERS)) {
    if (provider.models.some(m => m.alias === model)) {
      if (providerId === 'anthropic') {
        return anthropicProvider;
      }
      return openAIProvider;
    }
  }

  // Default to OpenAI if model not found
  return openAIProvider;
}
