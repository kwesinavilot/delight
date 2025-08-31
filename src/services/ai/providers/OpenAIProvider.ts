import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { BaseAIProvider } from '../BaseAIProvider';
import { GenerationOptions, SummaryLength, AIConfiguration } from '../../../types/ai';
import { functionManager } from '../FunctionManager';

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

        this.client = createOpenAI({
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
            this.handleError(new Error('OpenAI provider not configured'), 'generateResponseWithHistory');
        }

        if (!this.client) {
            this.initializeClient();
        }

        try {
            // Use centralized chat options preparation
            const preparedOptions = this.prepareChatOptions(options);
            const model = this.client(this.config.model || 'gpt-3.5-turbo');

            // Convert messages to OpenAI format (handle 'model' role from Gemini)
            const openAIMessages = messages.map(msg => ({
                role: msg.role === 'model' ? 'assistant' as const : msg.role as 'user' | 'assistant' | 'system',
                content: msg.content
            }));

            if (preparedOptions.stream !== false) {
                // Streaming response
                const result = streamText({
                    model,
                    system: preparedOptions.systemPrompt,
                    messages: openAIMessages,
                    temperature: preparedOptions.temperature,
                });

                return this.createAsyncIterable(result.textStream);
            } else {
                // Non-streaming response
                const result = await generateText({
                    model,
                    system: preparedOptions.systemPrompt,
                    messages: openAIMessages,
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
            this.handleError(new Error('OpenAI provider not configured'), 'generateSummary');
        }

        if (!this.client) {
            this.initializeClient();
        }

        try {
            // Check if content needs chunking based on model capabilities
            const capabilities = this.getModelCapabilities();
            const maxContentLength = Math.floor(capabilities.maxTokens * 0.6); // Reserve tokens for response
            
            if (content.length > maxContentLength) {
                return await this.generateChunkedSummary(content, length);
            }

            // Use centralized summary options preparation
            const { prompt, systemPrompt, options } = this.prepareSummaryOptions(content, length);
            const model = this.client(this.config.model || 'gpt-3.5-turbo');

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

    private async generateChunkedSummary(content: string, length: SummaryLength): Promise<string> {
        // Use centralized content processing
        const { chunks } = functionManager.processContentForSummary(content);
        const chunkSummaries: string[] = [];

        // Generate summaries for each chunk
        for (let i = 0; i < chunks.length; i++) {
            const { prompt, options } = functionManager.prepareChunkSummaryOptions(chunks[i], i, chunks.length);
            const model = this.client(this.config.model || 'gpt-3.5-turbo');

            const result = await generateText({
                model,
                system: options.systemPrompt,
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: options.temperature,
            });

            chunkSummaries.push(result.text);
        }

        // Combine chunk summaries into final summary
        const { prompt: combinedPrompt, options: combinedOptions } = functionManager.prepareCombinedSummaryOptions(chunkSummaries, length);
        const model = this.client(this.config.model || 'gpt-3.5-turbo');

        const finalResult = await generateText({
            model,
            system: combinedOptions.systemPrompt,
            messages: [
                { role: 'user', content: combinedPrompt }
            ],
            temperature: combinedOptions.temperature,
        });

        return finalResult.text;
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
            // Use a simple test message with minimal options
            const testStream = await this.generateResponse('Hello', {
                systemPrompt: 'Respond with just "OK"',
                stream: false,
                maxTokens: 10,
                temperature: 0
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