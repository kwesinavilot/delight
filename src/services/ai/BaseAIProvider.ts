import { AIProvider, GenerationOptions, SummaryLength, AIConfiguration, AIError, AIErrorType } from '../../types/ai';

export abstract class BaseAIProvider implements AIProvider {
  protected config: AIConfiguration;
  
  constructor(config: AIConfiguration) {
    this.config = config;
  }

  abstract get name(): string;
  
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.apiKey.trim());
  }

  abstract generateResponse(message: string, options?: GenerationOptions): Promise<AsyncIterable<string>>;
  
  abstract generateSummary(content: string, length: SummaryLength): Promise<string>;

  protected handleError(error: any, context: string): never {
    if (error.status === 401) {
      throw new AIError(
        AIErrorType.INVALID_API_KEY,
        'Invalid API key. Please check your configuration.',
        this.name,
        error
      );
    }
    
    if (error.status === 429) {
      throw new AIError(
        AIErrorType.RATE_LIMIT_ERROR,
        'Rate limit exceeded. Please try again later.',
        this.name,
        error
      );
    }
    
    if (error.code === 'NETWORK_ERROR' || error.name === 'NetworkError') {
      throw new AIError(
        AIErrorType.NETWORK_ERROR,
        'Network error occurred. Please check your connection.',
        this.name,
        error
      );
    }
    
    throw new AIError(
      AIErrorType.API_ERROR,
      `${context}: ${error.message || 'Unknown error'}`,
      this.name,
      error
    );
  }

  protected getSummaryPrompt(content: string, length: SummaryLength): string {
    const prompts = {
      short: `Please provide a brief summary (2-3 sentences) of the following content:\n\n${content}`,
      medium: `Please provide a medium-length summary (1-2 paragraphs) of the following content, highlighting the key points:\n\n${content}`,
      detailed: `Please provide a comprehensive summary of the following content, including all important details and context:\n\n${content}`
    };
    
    return prompts[length];
  }
}