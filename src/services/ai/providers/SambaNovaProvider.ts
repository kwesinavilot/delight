import { openai } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { BaseAIProvider } from '../BaseAIProvider';
import { GenerationOptions, SummaryLength, AIConfiguration } from '../../../types/ai';

export class SambaNovaProvider extends BaseAIProvider {
  private client: any;

  constructor(config: AIConfiguration) {
    super(config);
    this.initializeClient();
  }

  get name(): string {
    return 'sambanova';
  }

  private initializeClient(): void {
    if (!this.config.apiKey) {
      return; // Client will be initialized when API key is available
    }

    // SambaNova uses OpenAI-compatible API with custom base URL
    this.client = openai({
      apiKey: this.config.apiKey,
      baseURL: 'https://api.sambanova.ai/v1',
    });
  }

  async generateResponse(message: string, options?: GenerationOptions): Promise<AsyncIterable<string>> {
    if (!this.isConfigured()) {
      this.handleError(new Error('SambaNova provider not configured'), 'generateResponse');
    }

    if (!this.client) {
      this.initializeClient();
    }

    try {
      const model = this.client(this.config.model || 'Meta-Llama-3.1-8B-Instruct');
      
      const messages = [
        ...(options?.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
        { role: 'user' as const, content: message }
      ];

      if (options?.stream !== false) {
        // Streaming response
        const result = await streamText({
          model,
          messages,
          maxTokens: options?.maxTokens || this.config.maxTokens || 1000,
          temperature: options?.temperature || this.config.temperature || 0.7,
        });

        return this.createAsyncIterable(result.textStream);
      } else {
        // Non-streaming response
        const result = await generateText({
          model,
          messages,
          maxTokens: options?.maxTokens || this.config.maxTokens || 1000,
          temperature: options?.temperature || this.config.temperature || 0.7,
        });

        return this.createAsyncIterable([result.text]);
      }
    } catch (error: any) {
      this.handleError(error, 'generateResponse');
    }
  }

  async generateSummary(content: string, length: SummaryLength): Promise<string> {
    if (!this.isConfigured()) {
      this.handleError(new Error('SambaNova provider not configured'), 'generateSummary');
    }

    if (!this.client) {
      this.initializeClient();
    }

    try {
      const model = this.client(this.config.model || 'Meta-Llama-3.1-8B-Instruct');
      const prompt = this.getSummaryPrompt(content, length);

      // Determine token limits based on summary length
      const tokenLimits = {
        short: 150,
        medium: 300,
        detailed: 600
      };

      const result = await generateText({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant powered by SambaNova\'s high-performance computing platform. Create clear, accurate summaries that capture the essential information.' },
          { role: 'user', content: prompt }
        ],
        maxTokens: tokenLimits[length],
        temperature: 0.3, // Lower temperature for consistent summaries
      });

      return result.text;
    } catch (error: any) {
      this.handleError(error, 'generateSummary');
    }
  }

  private async *createAsyncIterable(source: AsyncIterable<string> | string[]): AsyncIterable<string> {
    if (Array.isArray(source)) {
      // Handle array of strings (non-streaming)
      for (const chunk of source) {
        yield chunk;
      }
    } else {
      // Handle async iterable (streaming)
      try {
        for await (const chunk of source) {
          yield chunk;
        }
      } catch (error) {
        this.handleError(error, 'streaming');
      }
    }
  }

  // Method to update configuration and reinitialize client
  updateConfig(config: AIConfiguration): void {
    this.config = config;
    this.initializeClient();
  }

  // Method to test the connection
  async testConnection(): Promise<boolean> {
    try {
      const testStream = await this.generateResponse('Hello', { 
        systemPrompt: 'Respond with just "OK"',
        stream: false 
      });
      
      // Consume the stream to test connectivity
      for await (const _ of testStream) {
        // Just consume the response
      }
      
      return true;
    } catch {
      return false;
    }
  }

  // Get available models for this provider
  getAvailableModels(): string[] {
    return [
      'Meta-Llama-3.1-405B-Instruct',
      'Meta-Llama-3.1-70B-Instruct',
      'Meta-Llama-3.1-8B-Instruct',
      'Llama-3.2-90B-Vision-Instruct',
      'Llama-3.2-11B-Vision-Instruct',
      'Llama-3.2-3B-Instruct',
      'Llama-3.2-1B-Instruct'
    ];
  }

  // Get default model
  getDefaultModel(): string {
    return 'Meta-Llama-3.1-8B-Instruct';
  }

  // Get model capabilities
  getModelCapabilities(model?: string): { maxTokens: number; supportsStreaming: boolean } {
    const modelName = model || this.config.model || 'Meta-Llama-3.1-8B-Instruct';
    
    const capabilities: Record<string, { maxTokens: number; supportsStreaming: boolean }> = {
      'Meta-Llama-3.1-405B-Instruct': { maxTokens: 131072, supportsStreaming: true },
      'Meta-Llama-3.1-70B-Instruct': { maxTokens: 131072, supportsStreaming: true },
      'Meta-Llama-3.1-8B-Instruct': { maxTokens: 131072, supportsStreaming: true },
      'Llama-3.2-90B-Vision-Instruct': { maxTokens: 131072, supportsStreaming: true },
      'Llama-3.2-11B-Vision-Instruct': { maxTokens: 131072, supportsStreaming: true },
      'Llama-3.2-3B-Instruct': { maxTokens: 131072, supportsStreaming: true },
      'Llama-3.2-1B-Instruct': { maxTokens: 131072, supportsStreaming: true }
    };

    return capabilities[modelName] || { maxTokens: 131072, supportsStreaming: true };
  }

  // SambaNova-specific method to get model size category
  getModelSize(model?: string): 'small' | 'medium' | 'large' | 'extra-large' {
    const modelName = model || this.config.model || 'Meta-Llama-3.1-8B-Instruct';
    
    if (modelName.includes('1B')) return 'small';
    if (modelName.includes('3B') || modelName.includes('8B') || modelName.includes('11B')) return 'medium';
    if (modelName.includes('70B') || modelName.includes('90B')) return 'large';
    if (modelName.includes('405B')) return 'extra-large';
    
    return 'medium';
  }

  // Get recommended use cases for the model
  getModelRecommendations(model?: string): string[] {
    const size = this.getModelSize(model);
    const modelName = model || this.config.model || 'Meta-Llama-3.1-8B-Instruct';
    
    if (modelName.includes('Vision')) {
      return ['Image analysis', 'Visual content', 'Multimodal tasks', 'Document processing'];
    }
    
    switch (size) {
      case 'small':
        return ['Quick responses', 'Simple tasks', 'Edge deployment', 'High-throughput'];
      case 'medium':
        return ['General conversation', 'Content creation', 'Code assistance', 'Analysis'];
      case 'large':
        return ['Complex reasoning', 'Advanced analysis', 'Research tasks', 'Professional use'];
      case 'extra-large':
        return ['Expert-level tasks', 'Complex problem solving', 'Research', 'Advanced reasoning'];
      default:
        return ['General purpose'];
    }
  }

  // Check if model supports vision capabilities
  supportsVision(model?: string): boolean {
    const modelName = model || this.config.model || 'Meta-Llama-3.1-8B-Instruct';
    return modelName.includes('Vision');
  }

  // Get model performance characteristics
  getPerformanceProfile(model?: string): { speed: 'fast' | 'medium' | 'slow'; quality: 'good' | 'better' | 'best' } {
    const size = this.getModelSize(model);
    
    switch (size) {
      case 'small':
        return { speed: 'fast', quality: 'good' };
      case 'medium':
        return { speed: 'fast', quality: 'better' };
      case 'large':
        return { speed: 'medium', quality: 'better' };
      case 'extra-large':
        return { speed: 'slow', quality: 'best' };
      default:
        return { speed: 'medium', quality: 'better' };
    }
  }
}