import { createSambaNova } from 'sambanova-ai-provider';
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

    // Use official SambaNova provider
    this.client = createSambaNova({
      apiKey: this.config.apiKey,
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
      this.handleError(new Error('SambaNova provider not configured'), 'generateResponseWithHistory');
    }

    if (!this.client) {
      this.initializeClient();
    }

    try {
      // Use centralized chat options preparation
      const preparedOptions = this.prepareChatOptions(options);
      // Use a known working model for testing
      const modelName = this.config.model || 'DeepSeek-V3.1';
      const model = this.client(modelName);
      
      // Convert messages to OpenAI format (handle 'model' role from Gemini)
      const sambaNovaMessages = messages.map(msg => ({
        role: msg.role === 'model' ? 'assistant' as const : msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));

      console.log('SambaNova messages:', sambaNovaMessages);
      console.log('SambaNova model:', modelName);
      console.log('SambaNova API key (first 10 chars):', this.config.apiKey?.substring(0, 10));
      console.log('SambaNova options:', preparedOptions);

      if (preparedOptions.stream !== false) {
        // Streaming response
        const result = streamText({
          model,
          system: preparedOptions.systemPrompt,
          messages: sambaNovaMessages,
          temperature: preparedOptions.temperature,
        });

        return this.createAsyncIterable(result.textStream);
      } else {
        // Non-streaming response
        const result = await generateText({
          model,
          system: preparedOptions.systemPrompt,
          messages: sambaNovaMessages,
          temperature: preparedOptions.temperature,
        });

        console.log('SambaNova response:', result.text);
        return this.createAsyncIterable([result.text]);
      }
    } catch (error: any) {
      console.error('SambaNova error details:', error);
      this.handleError(error, 'generateResponseWithHistory');
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
      // const tokenLimits = {
      //   short: 150,
      //   medium: 300,
      //   detailed: 600
      // };

      const result = await generateText({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant powered by SambaNova\'s high-performance computing platform. Create clear, accurate summaries that capture the essential information.' },
          { role: 'user', content: prompt }
        ],
        // maxTokens: tokenLimits[length],
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
      console.log('Testing SambaNova connection...');
      const testStream = await this.generateResponse('Hello', { 
        systemPrompt: 'Respond with just "OK"',
        stream: false 
      });
      
      // Consume the stream to test connectivity
      for await (const chunk of testStream) {
        console.log('SambaNova test response chunk:', chunk);
      }
      
      console.log('SambaNova connection test successful');
      return true;
    } catch (error) {
      console.error('SambaNova connection test failed:', error);
      return false;
    }
  }

  // Get available models for this provider
  getAvailableModels(): string[] {
    return [
      // Text models
      'DeepSeek-V3-0324',
      'Llama-3.3-Swallow-70B-Instruct-v0.4',
      'Meta-Llama-3.1-8B-Instruct',
      'Meta-Llama-3.3-70B-Instruct',
      // Reasoning models
      'DeepSeek-R1-0528',
      'DeepSeek-R1-Distill-Llama-70B',
      'DeepSeek-V3.1',
      'Qwen3-32B',
      // Legacy models (keeping for compatibility)
      'Meta-Llama-3.1-405B-Instruct',
      'Meta-Llama-3.1-70B-Instruct',
      'Llama-3.2-90B-Vision-Instruct',
      'Llama-3.2-11B-Vision-Instruct',
      'Llama-3.2-3B-Instruct',
      'Llama-3.2-1B-Instruct'
    ];
  }

  // Get default model
  getDefaultModel(): string {
    return 'DeepSeek-V3.1';
  }

  // Get model capabilities
  getModelCapabilities(model?: string): { maxTokens: number; supportsStreaming: boolean } {
    const modelName = model || this.config.model || 'Meta-Llama-3.1-8B-Instruct';
    
    const capabilities: Record<string, { maxTokens: number; supportsStreaming: boolean }> = {
      // New text models
      'DeepSeek-V3-0324': { maxTokens: 131072, supportsStreaming: true },
      'Llama-3.3-Swallow-70B-Instruct-v0.4': { maxTokens: 131072, supportsStreaming: true },
      'Meta-Llama-3.1-8B-Instruct': { maxTokens: 131072, supportsStreaming: true },
      'Meta-Llama-3.3-70B-Instruct': { maxTokens: 131072, supportsStreaming: true },
      // New reasoning models
      'DeepSeek-R1-0528': { maxTokens: 131072, supportsStreaming: true },
      'DeepSeek-R1-Distill-Llama-70B': { maxTokens: 131072, supportsStreaming: true },
      'DeepSeek-V3.1': { maxTokens: 131072, supportsStreaming: true },
      'Qwen3-32B': { maxTokens: 131072, supportsStreaming: true },
      // Legacy models
      'Meta-Llama-3.1-405B-Instruct': { maxTokens: 131072, supportsStreaming: true },
      'Meta-Llama-3.1-70B-Instruct': { maxTokens: 131072, supportsStreaming: true },
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