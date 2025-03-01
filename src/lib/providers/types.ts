export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

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

export interface AIProvider {
  getResponse(
    message: string,
    userId: string,
    sessionId: string,
    model: string,
    onStream?: (chunk: string, usage?: { promptTokens: number }) => void
  ): Promise<AIResponse>;
  
  validateAPIKey(): Promise<boolean>;
  
  getConversationHistory(sessionId: string, limit?: number): Promise<Message[]>;
}
