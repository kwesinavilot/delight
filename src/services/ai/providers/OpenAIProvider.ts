import { openai } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { BaseAIProvider } from '../BaseAIProvider';
import { GenerationOptions, SummaryLength, AIConfiguration } from '../../../types/ai';

export class OpenAIProvider extends BaseAIProvider {
  private client: any;

  constructor(config: AIConfiguration) {
    super(config);
    this.initializeClient();
  }

  get name(): string {
    return 'openai';
  }

  private initializeClient(): void {
    if (!this.config.apiKey) {
      return; // Client will be initialized when API key is available
    }

    this.client = openai({
      apiKey: this.config.apiKey,
    });
  }

  async generateResponse(message: string, options?: GenerationOptions): Promise<AsyncIterable<string>> {
    if (!this.isConfigured()) {
      this.handleError(new Error('OpenAI provider not configured'), 'generateResponse');
    }

    if (!this.client) {
      this.initializeClient();
    }

    try {
      const model = this.client(this.config.model || 'gpt-3.5-turbo');
      
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
      this.handleError(new Error('OpenAI provider not configured'), 'generateSummary');
    }

    if (!this.client) {
      this.initializeClient();
    }

    try {
      const model = this.client(this.config.model || 'gpt-3.5-turbo');
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
          { role: 'system', content: 'You are a helpful assistant that creates clear, concise summaries.' },
          { role: 'user', content: prompt }
        ],
        maxTokens: tokenLimits[length],
        temperature: 0.3, // Lower temperature for more consistent summaries
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
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ];
  }

  // Get default model
  getDefaultModel(): string {
    return 'gpt-3.5-turbo';
  }

  // Get model capabilities
  getModelCapabilities(model?: string): { maxTokens: number; supportsStreaming: boolean } {
    const modelName = model || this.config.model || 'gpt-3.5-turbo';
    
    const capabilities: Record<string, { maxTokens: number; supportsStreaming: boolean }> = {
      'gpt-4o': { maxTokens: 128000, supportsStreaming: true },
      'gpt-4o-mini': { maxTokens: 128000, supportsStreaming: true },
      'gpt-4-turbo': { maxTokens: 128000, supportsStreaming: true },
      'gpt-4': { maxTokens: 8192, supportsStreaming: true },
      'gpt-3.5-turbo': { maxTokens: 4096, supportsStreaming: true },
      'gpt-3.5-turbo-16k': { maxTokens: 16384, supportsStreaming: true }
    };

    return capabilities[modelName] || { maxTokens: 4096, supportsStreaming: true };
  }
}