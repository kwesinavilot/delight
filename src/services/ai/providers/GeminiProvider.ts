import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText, type CoreMessage } from 'ai';
import { BaseAIProvider } from '../BaseAIProvider';
import { GenerationOptions, SummaryLength, AIConfiguration } from '../../../types/ai';

// Structured output types
export interface StructuredOutputOptions {
  responseSchema?: any;
  responseMimeType?: 'application/json' | 'text/x.enum';
}

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
    // Convert single message to conversation format for consistency
    const messages = [{ role: 'user' as const, content: message }];
    return this.generateResponseWithHistory(messages, options);
  }

  // New method for structured output
  async generateStructuredResponse<T = any>(
    message: string, 
    schema: any,
    options?: GenerationOptions
  ): Promise<T> {
    if (!this.isConfigured()) {
      this.handleError(new Error('Gemini provider not configured'), 'generateStructuredResponse');
    }

    if (!this.client) {
      this.initializeClient();
    }

    try {
      const preparedOptions = this.prepareChatOptions(options);
      const model = this.client(this.config.model || 'gemini-2.5-flash');

      console.log('🧠 [GeminiProvider] Generating structured response with schema:', schema);

      // Enhanced prompt for structured JSON output
      const structuredPrompt = `${message}

IMPORTANT: Respond ONLY with valid JSON matching this exact schema:
${JSON.stringify(schema, null, 2)}

No explanations, no markdown, just the JSON object.`;

      const result = await generateText({
        model,
        system: preparedOptions.systemPrompt,
        messages: [{ role: 'user', content: structuredPrompt }],
        temperature: preparedOptions.temperature
      });

      console.log('✅ [GeminiProvider] Structured response received:', result.text);
      
      // Clean up the response text to extract JSON
      let jsonText = result.text.trim();
      
      // Remove markdown code blocks
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      // Find JSON object in the text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      console.log('🧠 [GeminiProvider] Cleaned JSON text:', jsonText);
      return JSON.parse(jsonText);
    } catch (error: any) {
      console.error('❌ [GeminiProvider] Structured response failed:', error);
      this.handleError(error, 'generateStructuredResponse');
    }
  }

  async generateResponseWithHistory(
    messages: Array<{ role: 'user' | 'assistant' | 'system' | 'model'; content: string }>, 
    options?: GenerationOptions
  ): Promise<AsyncIterable<string>> {
    if (!this.isConfigured()) {
      this.handleError(new Error('Gemini provider not configured'), 'generateResponseWithHistory');
    }

    if (!this.client) {
      this.initializeClient();
    }

    try {
      // Use centralized chat options preparation
      const preparedOptions = this.prepareChatOptions(options);
      const model = this.client(this.config.model || 'gemini-2.5-flash');

      // Convert messages to Gemini format (assistant -> model, handle system messages)
      const geminiMessages: CoreMessage[] = messages
        .filter(msg => msg.role !== 'system') // System messages handled separately
        .map(msg => {
          if (msg.role === 'assistant') {
            return { role: 'assistant' as const, content: msg.content };
          } else {
            return { role: 'user' as const, content: msg.content };
          }
        });

      // Extract system messages and combine them
      const systemMessages = messages.filter(msg => msg.role === 'system');
      const systemPrompt = systemMessages.length > 0 
        ? systemMessages.map(msg => msg.content).join('\n\n')
        : preparedOptions.systemPrompt;

      if (preparedOptions.stream !== false) {
        // Streaming response
        const result = streamText({
          model,
          system: systemPrompt,
          messages: geminiMessages,
          temperature: preparedOptions.temperature,
        });

        return this.createAsyncIterable(result.textStream);
      } else {
        // Non-streaming response
        const result = await generateText({
          model,
          system: systemPrompt,
          messages: geminiMessages,
          temperature: preparedOptions.temperature,
        });

        return this.createAsyncIterable([result.text]);
      }
    } catch (error: any) {
      this.handleError(error, 'generateResponseWithHistory');
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
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemma-3-27b-it',
      'gemma-3-12b-it',
      'gemma-3-4b-it'
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
      'gemini-2.5-flash-lite': { maxTokens: 1048576, supportsStreaming: true },
      'gemini-2.0-flash': { maxTokens: 1048576, supportsStreaming: true },
      'gemini-2.0-flash-lite': { maxTokens: 1048576, supportsStreaming: true },
      'gemma-3-27b-it': { maxTokens: 8192, supportsStreaming: true },
      'gemma-3-12b-it': { maxTokens: 8192, supportsStreaming: true },
      'gemma-3-4b-it': { maxTokens: 8192, supportsStreaming: true }
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

  // Check if model supports structured output
  supportsStructuredOutput(model?: string): boolean {
    const modelName = model || this.config.model || 'gemini-2.5-flash';
    // Structured output is supported on Gemini 2.5 models
    return modelName.includes('2.5');
  }

  // Helper to create JSON schema for task planning
  static createTaskPlanSchema() {
    return {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Brief description of the task'
        },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { 
                type: 'string',
                enum: ['navigate', 'click', 'extract', 'fill', 'wait']
              },
              description: { type: 'string' },
              url: { type: 'string' },
              selector: { type: 'string' },
              data: { type: 'string' },
              duration: { type: 'number' }
            },
            required: ['id', 'type', 'description'],
            propertyOrdering: ['id', 'type', 'description', 'url', 'selector', 'data', 'duration']
          }
        },
        estimatedDuration: {
          type: 'number',
          description: 'Estimated duration in milliseconds'
        }
      },
      required: ['description', 'steps', 'estimatedDuration'],
      propertyOrdering: ['description', 'steps', 'estimatedDuration']
    };
  }
}