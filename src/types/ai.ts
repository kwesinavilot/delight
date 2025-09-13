export type SummaryLength = 'short' | 'medium' | 'detailed';

export interface GenerationOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AIProvider {
  name: string;
  isConfigured(): boolean;
  generateResponse(message: string, options?: GenerationOptions): Promise<AsyncIterable<string>>;
  generateSummary(content: string, length: SummaryLength): Promise<string>;
  
  // Method for conversation history support
  generateResponseWithHistory(
    messages: Array<{ role: 'user' | 'assistant' | 'system' | 'model'; content: string }>, 
    options?: GenerationOptions
  ): Promise<AsyncIterable<string>>;
}

export interface AIConfiguration {
  provider: string;
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ExtensionSettings {
  ai: {
    currentProvider: string;
    providers: {
      [key: string]: {
        apiKey: string;
        model: string;
        maxTokens: number;
        temperature: number;
      };
    };
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface SummaryRequest {
  content: string;
  length: SummaryLength;
  url?: string;
}

export enum AIErrorType {
  CONFIGURATION_ERROR = 'configuration_error',
  API_ERROR = 'api_error',
  NETWORK_ERROR = 'network_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  INVALID_API_KEY = 'invalid_api_key'
}

export class AIError extends Error {
  constructor(
    public type: AIErrorType,
    message: string,
    public provider?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AIError';
  }
}