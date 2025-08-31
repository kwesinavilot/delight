import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { BaseAIProvider } from '../BaseAIProvider';
import { GenerationOptions, SummaryLength, AIConfiguration } from '../../../types/ai';

export class GrokProvider extends BaseAIProvider {
  private client: any;

  constructor(config: AIConfiguration) {
    super(config);
    this.initializeClient();
  }

  get name(): string {
    return 'grok';
  }

  private initializeClient(): void {
    if (!this.config.apiKey) {
      return; // Client will be initialized when API key is available
    }

    // Grok uses OpenAI-compatible API with custom base URL
    this.client = createOpenAI({
      apiKey: this.config.apiKey,
      baseURL: 'https://api.x.ai/v1',
    });
  }

  async generateResponse(message: string, options?: GenerationOptions): Promise<AsyncIterable<string>> {
    // Convert single message to conversation format for consistency
    const messages = [{ role: 'user' as const, content: message }];
    return this.generateResponseWithHistory(messages, options);
  }

  async generateResponseWithHistory(
    messages: Array<{ role: 'user' | 'assistant' | 'system' | 'model'; content: string }>, 
    options?: GenerationOptions
  ): Promise<AsyncIterable<string>> {
    if (!this.isConfigured()) {
      this.handleError(new Error('Grok provider not configured'), 'generateResponseWithHistory');
    }

    if (!this.client) {
      this.initializeClient();
    }

    try {
      const model = this.client(this.config.model || 'grok-beta');

      // Convert messages to OpenAI format (handle 'model' role from Gemini)
      const grokMessages = messages.map(msg => ({
        role: msg.role === 'model' ? 'assistant' as const : msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));

      // Add system prompt if provided and no system message exists
      if (options?.systemPrompt && !grokMessages.some(msg => msg.role === 'system')) {
        grokMessages.unshift({ role: 'system', content: options.systemPrompt });
      }

      if (options?.stream !== false) {
        // Streaming response
        const result = streamText({
          model,
          messages: grokMessages,
          temperature: options?.temperature || this.config.temperature || 0.7,
        });

        return this.createAsyncIterable(result.textStream);
      } else {
        // Non-streaming response
        const result = await generateText({
          model,
          messages: grokMessages,
          temperature: options?.temperature || this.config.temperature || 0.7,
        });

        return this.createAsyncIterable([result.text]);
      }
    } catch (error: any) {
      this.handleError(error, 'generateResponseWithHistory');
    }
  }

  async generateSummary(content: string, length: SummaryLength): Promise<string> {
    if (!this.isConfigured()) {
      this.handleError(new Error('Grok provider not configured'), 'generateSummary');
    }

    if (!this.client) {
      this.initializeClient();
    }

    try {
      const model = this.client(this.config.model || 'grok-beta');
      const prompt = this.getSummaryPrompt(content, length);

      // Determine token limits based on summary length
      // const tokenLimits = {
      //   short: 150,
      //   medium: 300,
      //   detailed: 600
      // };

      const result = await generateText({
        model,
        messages: [
          { role: 'system', content: 'You are Grok, a witty and helpful AI assistant that creates clear, engaging summaries. Add a touch of humor when appropriate while maintaining accuracy.' },
          { role: 'user', content: prompt }
        ],
        // maxTokens: tokenLimits[length],
        temperature: 0.4, // Slightly higher temperature for Grok's personality
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
      'grok-beta'
    ];
  }

  // Get default model
  getDefaultModel(): string {
    return 'grok-beta';
  }

  // Get model capabilities
  getModelCapabilities(model?: string): { maxTokens: number; supportsStreaming: boolean } {
    const modelName = model || this.config.model || 'grok-beta';

    const capabilities: Record<string, { maxTokens: number; supportsStreaming: boolean }> = {
      'grok-beta': { maxTokens: 131072, supportsStreaming: true }
    };

    return capabilities[modelName] || { maxTokens: 131072, supportsStreaming: true };
  }

  // Grok-specific method to get model personality
  getModelPersonality(model?: string): 'witty' | 'balanced' | 'visual' {
    const modelName = model || this.config.model || 'grok-beta';

    if (modelName.includes('vision')) return 'visual';
    return 'witty';
  }

  // Get recommended use cases for the model
  getModelRecommendations(model?: string): string[] {
    const personality = this.getModelPersonality(model);

    switch (personality) {
      case 'witty':
        return ['Conversational AI', 'Creative writing', 'Engaging content', 'Real-time information'];
      case 'visual':
        return ['Image analysis', 'Visual content', 'Multimodal tasks', 'Creative projects'];
      default:
        return ['General conversation', 'Content creation'];
    }
  }

  // Check if model supports vision capabilities
  supportsVision(model?: string): boolean {
    const modelName = model || this.config.model || 'grok-beta';
    return modelName.includes('vision');
  }

  // Check if model has real-time capabilities
  supportsRealTime(_model?: string): boolean {
    // Grok has access to real-time information
    return true;
  }
}