import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText } from 'ai';
import { BaseAIProvider } from '../BaseAIProvider';
import { GenerationOptions, SummaryLength, AIConfiguration } from '../../../types/ai';

export class GeminiProvider extends BaseAIProvider {
  private client: any;

  constructor(config: AIConfiguration) {
    super(config);
    this.initializeClient();
  }

  get name(): string {
    return 'gemini';
  }

  private initializeClient(): void {
    if (!this.config.apiKey) {
      return; // Client will be initialized when API key is available
    }

    this.client = createGoogleGenerativeAI({
      apiKey: this.config.apiKey,
    });
  }

  async generateResponse(message: string, options?: GenerationOptions): Promise<AsyncIterable<string>> {
    if (!this.isConfigured()) {
      this.handleError(new Error('Gemini provider not configured'), 'generateResponse');
    }

    if (!this.client) {
      this.initializeClient();
    }

    try {
      // Use centralized chat options preparation
      const preparedOptions = this.prepareChatOptions(options);
      const model = this.client(this.config.model || 'gemini-2.5-flash');

      const messages = [
        { role: 'user' as const, content: message }
      ];

      if (preparedOptions.stream !== false) {
        // Streaming response
        const result = streamText({
          model,
          system: preparedOptions.systemPrompt,
          messages,
          temperature: preparedOptions.temperature,
        });

        return this.createAsyncIterable(result.textStream);
      } else {
        // Non-streaming response
        const result = await generateText({
          model,
          system: preparedOptions.systemPrompt,
          messages,
          temperature: preparedOptions.temperature,
        });

        return this.createAsyncIterable([result.text]);
      }
    } catch (error: any) {
      this.handleError(error, 'generateResponse');
    }
  }

  async generateSummary(content: string, length: SummaryLength): Promise<string> {
    if (!this.isConfigured()) {
      this.handleError(new Error('Gemini provider not configured'), 'generateSummary');
    }

    if (!this.client) {
      this.initializeClient();
    }

    try {
      // Use centralized summary options preparation
      const { prompt, systemPrompt, options } = this.prepareSummaryOptions(content, length);
      const model = this.client(this.config.model || 'gemini-2.5-flash');

      const result = await generateText({
        model,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature,
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
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-1.0-pro',
      'gemini-pro-vision'
    ];
  }

  // Get default model
  getDefaultModel(): string {
    return 'gemini-2.5-flash';
  }

  // Get model capabilities
  getModelCapabilities(model?: string): { maxTokens: number; supportsStreaming: boolean } {
    const modelName = model || this.config.model || 'gemini-2.5-flash';

    const capabilities: Record<string, { maxTokens: number; supportsStreaming: boolean }> = {
      'gemini-2.5-pro': { maxTokens: 2097152, supportsStreaming: true },
      'gemini-2.5-flash': { maxTokens: 1048576, supportsStreaming: true },
      'gemini-1.0-pro': { maxTokens: 32768, supportsStreaming: true },
      'gemini-pro-vision': { maxTokens: 16384, supportsStreaming: true }
    };

    return capabilities[modelName] || { maxTokens: 32768, supportsStreaming: true };
  }

  // Gemini-specific method to get model performance tier
  getModelPerformance(model?: string): 'ultra-fast' | 'fast' | 'balanced' | 'powerful' {
    const modelName = model || this.config.model || 'gemini-2.5-flash';

    if (modelName.includes('flash')) return 'ultra-fast';
    if (modelName.includes('flash-lite')) return 'fast';
    if (modelName.includes('pro')) return 'powerful';
    if (modelName.includes('')) return 'balanced';

    return 'balanced';
  }

  // Get recommended use cases for the model
  getModelRecommendations(model?: string): string[] {
    const performance = this.getModelPerformance(model);

    switch (performance) {
      case 'ultra-fast':
        return ['Real-time chat', 'Quick responses', 'High-volume usage', 'Simple tasks'];
      case 'fast':
        return ['General conversation', 'Basic analysis', 'Content generation'];
      case 'balanced':
        return ['Multimodal tasks', 'Image analysis', 'Visual content'];
      case 'powerful':
        return ['Complex reasoning', 'Long-form content', 'Advanced analysis', 'Research tasks'];
      default:
        return ['General purpose'];
    }
  }

  // Check if model supports vision/multimodal capabilities
  supportsVision(model?: string): boolean {
    const modelName = model || this.config.model || 'gemini-2.5-flash';
    return modelName.includes('vision') || modelName.includes('1.5');
  }
}