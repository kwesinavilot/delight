import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { BaseAIProvider } from '../BaseAIProvider';
import { GenerationOptions, SummaryLength, AIConfiguration } from '../../../types/ai';
import { functionManager } from '../FunctionManager';

export class GroqProvider extends BaseAIProvider {
    private client: any;

    constructor(config: AIConfiguration) {
        super(config);
        this.initializeClient();
    }

    get name(): string {
        return 'groq';
    }

    private initializeClient(): void {
        if (!this.config.apiKey) {
            return; // Client will be initialized when API key is available
        }

        // Groq uses OpenAI-compatible API with custom base URL
        this.client = createOpenAI({
            apiKey: this.config.apiKey,
            baseURL: 'https://api.groq.com/openai/v1',
        });
    }

    async generateResponse(message: string, options?: GenerationOptions): Promise<AsyncIterable<string>> {
        if (!this.isConfigured()) {
            this.handleError(new Error('Groq provider not configured'), 'generateResponse');
        }

        if (!this.client) {
            this.initializeClient();
        }

        try {
            // Use centralized chat options preparation
            const preparedOptions = this.prepareChatOptions(options);
            const model = this.client(this.config.model || 'openai/gpt-oss-20b');

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
            this.handleError(new Error('Groq provider not configured'), 'generateSummary');
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
            const model = this.client(this.config.model || 'openai/gpt-oss-20b');

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
            const model = this.client(this.config.model || 'openai/gpt-oss-20b');

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
        const model = this.client(this.config.model || 'openai/gpt-oss-20b');

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
            'openai/gpt-oss-120b',
            'openai/gpt-oss-20b',
            'meta-llama/llama-4-maverick-17b-128e-instruct',
            'meta-llama/llama-4-scout-17b-16e-instruct',
            'llama-3.3-70b-versatile',
            'llama-3.1-8b-instant',
            'qwen/qwen3-32b',
            'deepseek-r1-distill-llama-70b',
            'gemma2-9b-it'
        ];
    }

    // Get default model
    getDefaultModel(): string {
        return 'openai/gpt-oss-20b';
    }

    // Get model capabilities
    getModelCapabilities(model?: string): { maxTokens: number; supportsStreaming: boolean } {
        const modelName = model || this.config.model || 'openai/gpt-oss-20b';

        const capabilities: Record<string, { maxTokens: number; supportsStreaming: boolean }> = {
            'openai/gpt-oss-120b': { maxTokens: 131072, supportsStreaming: true },
            'openai/gpt-oss-20b': { maxTokens: 131072, supportsStreaming: true },
            'meta-llama/llama-4-maverick-17b-128e-instruct': { maxTokens: 131072, supportsStreaming: true },
            'meta-llama/llama-4-scout-17b-16e-instruct': { maxTokens: 131072, supportsStreaming: true },
            'llama-3.3-70b-versatile': { maxTokens: 131072, supportsStreaming: true },
            'llama-3.1-8b-instant': { maxTokens: 131072, supportsStreaming: true },
            'qwen/qwen3-32b': { maxTokens: 131072, supportsStreaming: true },
            'deepseek-r1-distill-llama-70b': { maxTokens: 131072, supportsStreaming: true },
            'gemma2-9b-it': { maxTokens: 8192, supportsStreaming: true }
        };

        return capabilities[modelName] || { maxTokens: 8192, supportsStreaming: true };
    }

    // Get model performance characteristics
    getModelPerformance(model?: string): 'ultra-fast' | 'fast' | 'balanced' | 'powerful' {
        const modelName = model || this.config.model || 'openai/gpt-oss-20b';

        if (modelName.includes('instant') || modelName.includes('1b') || modelName.includes('3b')) return 'ultra-fast';
        if (modelName.includes('8b') || modelName.includes('11b') || modelName.includes('gemma')) return 'fast';
        if (modelName.includes('70b') || modelName.includes('90b') || modelName.includes('mixtral')) return 'balanced';
        if (modelName.includes('405b')) return 'powerful';

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
                return ['Complex reasoning', 'Detailed analysis', 'Creative writing', 'Code generation'];
            case 'powerful':
                return ['Advanced reasoning', 'Research tasks', 'Complex problem solving', 'Long-form content'];
            default:
                return ['General purpose'];
        }
    }

    // Check if model supports function calling
    supportsFunctionCalling(model?: string): boolean {
        const modelName = model || this.config.model || 'openai/gpt-oss-20b';
        // Most Llama 3.1+ models support function calling
        return modelName.includes('llama-3.1') || modelName.includes('llama-3.2');
    }
}