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
  
  abstract generateResponseWithHistory(
    messages: Array<{ role: 'user' | 'assistant' | 'system' | 'model'; content: string }>, 
    options?: GenerationOptions
  ): Promise<AsyncIterable<string>>;
  
  abstract generateSummary(content: string, length: SummaryLength): Promise<string>;

  // Centralized method to prepare chat options
  protected prepareChatOptions(userOptions?: GenerationOptions): GenerationOptions {
    return functionManager.prepareChatOptions(userOptions, this.name, this.config.model);
  }

  // Centralized method to prepare summary options
  protected prepareSummaryOptions(content: string, length: SummaryLength) {
    return functionManager.prepareSummaryOptions(content, length, this.config.model);
  }

  // Centralized method to get standard capabilities
  protected getStandardCapabilities() {
    return functionManager.getStandardModelCapabilities();
  }

  protected handleError(error: any, context: string): never {
    // Enhanced error detection and classification
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code || '';
    const errorStatus = error?.status || error?.response?.status;
    
    // Authentication errors
    if (errorStatus === 401 || errorMessage.includes('unauthorized') || errorMessage.includes('invalid api key')) {
      throw new AIError(
        AIErrorType.INVALID_API_KEY,
        'Invalid API key. Please check your configuration.',
        this.name,
        error
      );
    }
    
    // Rate limiting errors
    if (errorStatus === 429 || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      throw new AIError(
        AIErrorType.RATE_LIMIT_ERROR,
        'Rate limit exceeded. Please try again later.',
        this.name,
        error
      );
    }
    
    // Network connectivity errors
    if (
      errorCode === 'NETWORK_ERROR' || 
      error.name === 'NetworkError' ||
      errorMessage.includes('network error') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('fetch') ||
      errorStatus === 0 ||
      errorStatus >= 500
    ) {
      throw new AIError(
        AIErrorType.NETWORK_ERROR,
        'Network error occurred. Please check your connection.',
        this.name,
        error
      );
    }
    
    // Configuration errors
    if (errorStatus === 400 || errorMessage.includes('bad request') || errorMessage.includes('invalid model')) {
      throw new AIError(
        AIErrorType.CONFIGURATION_ERROR,
        `Configuration error: ${error.message || 'Invalid request parameters'}`,
        this.name,
        error
      );
    }
    
    // Default to API error
    throw new AIError(
      AIErrorType.API_ERROR,
      `${context}: ${error.message || 'Unknown error'}`,
      this.name,
      error
    );
  }

  // Network connectivity test
  protected async testNetworkConnectivity(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  }

  // Enhanced error wrapper for async operations
  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context);
    }
  }

  // Deprecated: Use centralized functionality instead
  protected getSummaryPrompt(content: string, length: SummaryLength): string {
    const { prompt } = this.prepareSummaryOptions(content, length);
    return prompt;
  }
}