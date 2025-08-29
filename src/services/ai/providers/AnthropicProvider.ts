import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, generateText } from 'ai';
import { BaseAIProvider } from '../BaseAIProvider';
import { GenerationOptions, SummaryLength, AIConfiguration } from '../../../types/ai';

export class AnthropicProvider extends BaseAIProvider {
    private client: any;

    constructor(config: AIConfiguration) {
        super(config);
        this.initializeClient();
    }

    get name(): string {
        return 'anthropic';
    }

    private initializeClient(): void {
        if (!this.config.apiKey) {
            return; // Client will be initialized when API key is available
        }

        this.client = createAnthropic({
            apiKey: this.config.apiKey,
        });
    }

    async generateResponse(message: string, options?: GenerationOptions): Promise<AsyncIterable<string>> {
        if (!this.isConfigured()) {
            this.handleError(new Error('Anthropic provider not configured'), 'generateResponse');
        }

        if (!this.client) {
            this.initializeClient();
        }

        try {
            const model = this.client(this.config.model || 'claude-3-haiku-20240307');

            // Anthropic uses a different message format - system prompt is separate
            const messages = [
                { role: 'user' as const, content: message }
            ];

            const systemPrompt = options?.systemPrompt || 'You are Delight, a helpful and friendly AI assistant.';

            if (options?.stream !== false) {
                // Streaming response
                const result = await streamText({
                    model,
                    system: systemPrompt,
                    messages,
                    // maxTokens: options?.maxTokens || this.config.maxTokens || 1000,
                    temperature: options?.temperature || this.config.temperature || 0.7,
                });

                return this.createAsyncIterable(result.textStream);
            } else {
                // Non-streaming response
                const result = await generateText({
                    model,
                    system: systemPrompt,
                    messages,
                    //   maxTokens: options?.maxTokens || this.config.maxTokens || 1000,
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
            this.handleError(new Error('Anthropic provider not configured'), 'generateSummary');
        }

        if (!this.client) {
            this.initializeClient();
        }

        try {
            const model = this.client(this.config.model || 'claude-3-haiku-20240307');
            const prompt = this.getSummaryPrompt(content, length);

            // Determine token limits based on summary length
            // const tokenLimits = {
            //     short: 150,
            //     medium: 300,
            //     detailed: 600
            // };

            const result = await generateText({
                model,
                system: 'You are a helpful assistant that creates clear, concise summaries. Focus on the most important information and present it in a well-structured format.',
                messages: [
                    { role: 'user', content: prompt }
                ],
                // maxTokens: tokenLimits[length],
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
            'claude-3-5-sonnet-20241022',
            'claude-3-5-sonnet-20240620',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ];
    }

    // Get default model
    getDefaultModel(): string {
        return 'claude-3-haiku-20240307';
    }

    // Get model capabilities
    getModelCapabilities(model?: string): { maxTokens: number; supportsStreaming: boolean } {
        const modelName = model || this.config.model || 'claude-3-haiku-20240307';

        const capabilities: Record<string, { maxTokens: number; supportsStreaming: boolean }> = {
            'claude-3-5-sonnet-20241022': { maxTokens: 200000, supportsStreaming: true },
            'claude-3-5-sonnet-20240620': { maxTokens: 200000, supportsStreaming: true },
            'claude-3-5-haiku-20241022': { maxTokens: 200000, supportsStreaming: true },
            'claude-3-opus-20240229': { maxTokens: 200000, supportsStreaming: true },
            'claude-3-sonnet-20240229': { maxTokens: 200000, supportsStreaming: true },
            'claude-3-haiku-20240307': { maxTokens: 200000, supportsStreaming: true }
        };

        return capabilities[modelName] || { maxTokens: 200000, supportsStreaming: true };
    }

    // Anthropic-specific method to get model pricing tier
    getModelTier(model?: string): 'fast' | 'balanced' | 'powerful' {
        const modelName = model || this.config.model || 'claude-3-haiku-20240307';

        if (modelName.includes('haiku')) return 'fast';
        if (modelName.includes('sonnet')) return 'balanced';
        if (modelName.includes('opus')) return 'powerful';

        return 'balanced';
    }

    // Get recommended use cases for the model
    getModelRecommendations(model?: string): string[] {
        const tier = this.getModelTier(model);

        switch (tier) {
            case 'fast':
                return ['Quick responses', 'Simple tasks', 'High-volume usage'];
            case 'balanced':
                return ['General conversation', 'Content creation', 'Analysis'];
            case 'powerful':
                return ['Complex reasoning', 'Research tasks', 'Creative writing'];
            default:
                return ['General purpose'];
        }
    }
}