export interface Model {
  alias: string;
  name: string;
  description: string;
  isLatest: boolean;
  provider: 'openai' | 'anthropic';
  modelId: string; // Actual model ID to use with the API
}

export interface ProviderConfig {
  name: string;
  description: string;
  models: Model[];
}

export const PROVIDERS: Record<string, ProviderConfig> = {
  anthropic: {
    name: 'Anthropic Claude',
    description: 'Advanced language models with strong reasoning capabilities',
    models: [
      {
        alias: 'claude-3-5-sonnet-latest',
        name: 'Claude 3.5 Sonnet',
        description: 'Latest Claude 3.5 Sonnet model for balanced performance',
        isLatest: true,
        provider: 'anthropic',
        modelId: 'claude-3-sonnet-20240229'
      },
      {
        alias: 'claude-3-5-haiku-latest',
        name: 'Claude 3.5 Haiku',
        description: 'Latest Claude 3.5 Haiku model for faster responses',
        isLatest: true,
        provider: 'anthropic',
        modelId: 'claude-3-haiku-20240229'
      }
    ]
  },
  openai: {
    name: 'OpenAI GPT',
    description: 'State-of-the-art language models from OpenAI',
    models: [
      {
        alias: 'gpt-4o',
        name: 'GPT-4 Optimized',
        description: 'Latest stable GPT-4 model with improved performance',
        isLatest: false,
        provider: 'openai',
        modelId: 'gpt-4'
      },
      {
        alias: 'gpt-4o-2024-08-06',
        name: 'GPT-4 Optimized (Aug 2024)',
        description: 'Specific version of GPT-4 optimized for stability',
        isLatest: false,
        provider: 'openai',
        modelId: 'gpt-4-0613'
      },
      {
        alias: 'chatgpt-4o-latest',
        name: 'ChatGPT-4 Latest',
        description: 'Latest model used in ChatGPT',
        isLatest: true,
        provider: 'openai',
        modelId: 'gpt-4-turbo-preview'
      },
      {
        alias: 'gpt-4o-mini',
        name: 'GPT-4 Mini',
        description: 'Lighter version of GPT-4 for faster responses',
        isLatest: false,
        provider: 'openai',
        modelId: 'gpt-3.5-turbo'
      }
    ]
  }
};

export function getModelId(alias: string): string {
  for (const provider of Object.values(PROVIDERS)) {
    const model = provider.models.find(m => m.alias === alias);
    if (model) {
      return model.modelId;
    }
  }
  // Default to a safe model if alias not found
  return 'gpt-3.5-turbo';
}
