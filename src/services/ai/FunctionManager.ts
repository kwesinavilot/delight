import { SummaryLength, GenerationOptions } from '../../types/ai';
import { promptManager } from './PromptManager';

/**
 * Centralized functionality manager for all AI operations
 * This ensures consistent behavior across all providers
 */
export class FunctionManager {
  private static instance: FunctionManager;

  private constructor() {}

  static getInstance(): FunctionManager {
    if (!FunctionManager.instance) {
      FunctionManager.instance = new FunctionManager();
    }
    return FunctionManager.instance;
  }

  /**
   * Check if model is a reasoning model that doesn't support temperature
   */
  private isReasoningModel(modelName?: string): boolean {
    if (!modelName) return false;
    
    const reasoningModels = [
      // Groq reasoning models
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b', 
      'deepseek-r1-distill-llama',
      'qwen/qwen3-32b',
      // SambaNova reasoning models
      'DeepSeek-R1-0528',
      'DeepSeek-R1-Distill-Llama-70B',
      'DeepSeek-V3.1',
      'Qwen3-32B'
    ];
    
    return reasoningModels.some(model => modelName.includes(model.replace('/', '')));
  }

  /**
   * Prepare chat options with centralized system prompt
   */
  prepareChatOptions(userOptions?: GenerationOptions, providerName?: string, modelName?: string): GenerationOptions {
    const systemPrompt = promptManager.getChatSystemPrompt(providerName);
    const isReasoning = this.isReasoningModel(modelName);
    
    const options: GenerationOptions = {
      systemPrompt,
      stream: userOptions?.stream !== false, // Default to streaming
      maxTokens: userOptions?.maxTokens || 1000,
      ...userOptions
    };
    
    // Only add temperature if not a reasoning model
    if (!isReasoning) {
      options.temperature = userOptions?.temperature || 0.7;
    }
    
    return options;
  }

  /**
   * Prepare summary options with centralized prompts and settings
   */
  prepareSummaryOptions(content: string, length: SummaryLength, modelName?: string): {
    prompt: string;
    systemPrompt: string;
    options: GenerationOptions;
  } {
    const prompt = promptManager.getSummaryPrompt(content, length);
    const systemPrompt = promptManager.getSummarySystemPrompt();
    const isReasoning = this.isReasoningModel(modelName);
    
    // Token limits based on summary length
    const tokenLimits = {
      short: 150,
      medium: 300,
      detailed: 600
    };

    const options: GenerationOptions = {
      systemPrompt,
      maxTokens: tokenLimits[length],
      stream: false // Summaries don't need streaming
    };
    
    // Only add temperature if not a reasoning model
    if (!isReasoning) {
      options.temperature = 0.3; // Lower temperature for consistent summaries
    }

    return { prompt, systemPrompt, options };
  }

  /**
   * Process content for summarization (chunking if needed)
   */
  processContentForSummary(content: string, maxChunkSize: number = 8000): {
    chunks: string[];
    needsChunking: boolean;
  } {
    const needsChunking = content.length > maxChunkSize;
    
    if (!needsChunking) {
      return { chunks: [content], needsChunking: false };
    }

    // Split content into chunks at sentence boundaries
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const potentialChunk = currentChunk + sentence + '.';
      
      if (potentialChunk.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence + '.';
      } else {
        currentChunk = potentialChunk;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return { chunks, needsChunking: true };
  }

  /**
   * Prepare chunk summary options
   */
  prepareChunkSummaryOptions(chunk: string, chunkIndex: number, totalChunks: number): {
    prompt: string;
    options: GenerationOptions;
  } {
    const prompt = promptManager.getChunkSummaryPrompt(chunk, chunkIndex, totalChunks);
    
    const options: GenerationOptions = {
      systemPrompt: promptManager.getSummarySystemPrompt(),
      temperature: 0.3,
      maxTokens: 200, // Smaller limit for chunk summaries
      stream: false
    };

    return { prompt, options };
  }

  /**
   * Prepare combined summary options
   */
  prepareCombinedSummaryOptions(chunkSummaries: string[], length: SummaryLength): {
    prompt: string;
    options: GenerationOptions;
  } {
    const prompt = promptManager.getCombinedSummaryPrompt(chunkSummaries, length);
    
    const tokenLimits = {
      short: 150,
      medium: 300,
      detailed: 600
    };

    const options: GenerationOptions = {
      systemPrompt: promptManager.getSummarySystemPrompt(),
      temperature: 0.3,
      maxTokens: tokenLimits[length],
      stream: false
    };

    return { prompt, options };
  }

  /**
   * Prepare test connection options
   */
  prepareTestConnectionOptions(): GenerationOptions {
    return {
      systemPrompt: 'You are a test assistant. Respond exactly as requested.',
      temperature: 0,
      maxTokens: 10,
      stream: false
    };
  }

  /**
   * Prepare error recovery options
   */
  prepareErrorRecoveryOptions(originalPrompt: string, errorType: string): {
    prompt: string;
    options: GenerationOptions;
  } {
    const prompt = promptManager.getErrorRecoveryPrompt(originalPrompt, errorType);
    
    const options: GenerationOptions = {
      systemPrompt: 'You are a helpful assistant providing simplified responses.',
      temperature: 0.5,
      maxTokens: 500,
      stream: false
    };

    return { prompt, options };
  }

  /**
   * Get standard model capabilities for any provider
   */
  getStandardModelCapabilities(): { maxTokens: number; supportsStreaming: boolean } {
    return {
      maxTokens: 4096, // Safe default
      supportsStreaming: true
    };
  }

  /**
   * Validate and normalize model configuration
   */
  validateModelConfig(config: any): {
    isValid: boolean;
    normalizedConfig: any;
    errors: string[];
  } {
    const errors: string[] = [];
    const normalizedConfig = { ...config };

    // Validate API key
    if (!config.apiKey || typeof config.apiKey !== 'string' || config.apiKey.trim().length === 0) {
      errors.push('API key is required and must be a non-empty string');
    }

    // Validate provider
    const validProviders = ['openai', 'anthropic', 'gemini', 'grok', 'sambanova'];
    if (!config.provider || !validProviders.includes(config.provider)) {
      errors.push(`Provider must be one of: ${validProviders.join(', ')}`);
    }

    // Normalize temperature
    if (config.temperature !== undefined) {
      const temp = parseFloat(config.temperature);
      if (isNaN(temp) || temp < 0 || temp > 2) {
        errors.push('Temperature must be a number between 0 and 2');
      } else {
        normalizedConfig.temperature = temp;
      }
    }

    // Normalize maxTokens
    if (config.maxTokens !== undefined) {
      const tokens = parseInt(config.maxTokens);
      if (isNaN(tokens) || tokens < 1 || tokens > 100000) {
        errors.push('Max tokens must be a number between 1 and 100000');
      } else {
        normalizedConfig.maxTokens = tokens;
      }
    }

    return {
      isValid: errors.length === 0,
      normalizedConfig,
      errors
    };
  }
}

export const functionManager = FunctionManager.getInstance();