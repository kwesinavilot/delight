import { AIProvider, GenerationOptions, SummaryLength, AIConfiguration, AIError, AIErrorType } from '../../types/ai';
import { functionManager } from './FunctionManager';

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

  // Centralized method to prepare chat options
  protected prepareChatOptions(userOptions?: GenerationOptions): GenerationOptions {
    return functionManager.prepareChatOptions(userOptions, this.name);
  }

  // Centralized method to prepare summary options
  protected prepareSummaryOptions(content: string, length: SummaryLength) {
    return functionManager.prepareSummaryOptions(content, length);
  }

  // Centralized method to get standard capabilities
  protected getStandardCapabilities() {
    return functionManager.getStandardModelCapabilities();
  }

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

  // Deprecated: Use centralized functionality instead
  protected getSummaryPrompt(content: string, length: SummaryLength): string {
    const { prompt } = this.prepareSummaryOptions(content, length);
    return prompt;
  }
}