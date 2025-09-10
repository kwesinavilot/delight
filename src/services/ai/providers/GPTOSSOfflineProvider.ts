import { BaseAIProvider } from '../BaseAIProvider';
import { GenerationOptions, SummaryLength, AIConfiguration } from '../../../types/ai';

export class GPTOSSOfflineProvider extends BaseAIProvider {
    private ollamaUrl: string = 'http://localhost:11434';

    constructor(config: AIConfiguration) {
        super(config);
    }

    get name(): string {
        return 'gpt-oss-offline';
    }

    isConfigured(): boolean {
        // For offline mode, we don't need an API key
        return true;
    }

    private async checkOllamaConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.ollamaUrl}/api/tags`);
            return response.ok;
        } catch {
            return false;
        }
    }

    private async checkModelAvailable(model: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.ollamaUrl}/api/tags`);
            if (!response.ok) return false;

            const data = await response.json();
            return data.models?.some((m: any) => m.name.includes(model));
        } catch {
            return false;
        }
    }

    async generateResponse(message: string, options?: GenerationOptions): Promise<AsyncIterable<string>> {
        const messages = [{ role: 'user' as const, content: message }];
        return this.generateResponseWithHistory(messages, options);
    }

    async generateResponseWithHistory(
        messages: Array<{ role: 'user' | 'assistant' | 'system' | 'model'; content: string }>,
        options?: GenerationOptions
    ): Promise<AsyncIterable<string>> {
        const isConnected = await this.checkOllamaConnection();
        if (!isConnected) {
            throw new Error('Ollama is not running. Please start Ollama and ensure GPT-OSS models are installed.');
        }

        const model = this.config.model || 'gpt-oss-20b';
        const isModelAvailable = await this.checkModelAvailable(model);
        if (!isModelAvailable) {
            throw new Error(`Model ${model} is not available in Ollama. Please install it first: ollama pull ${model}`);
        }

        try {
            const preparedOptions = this.prepareChatOptions(options);

            // Convert messages to Ollama format
            const ollamaMessages = messages.map(msg => ({
                role: msg.role === 'model' ? 'assistant' : msg.role,
                content: msg.content
            }));

            const response = await fetch(`${this.ollamaUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: ollamaMessages,
                    stream: true,
                    options: {
                        temperature: preparedOptions.temperature,
                        num_predict: preparedOptions.maxTokens
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            return this.createStreamFromResponse(response);
        } catch (error: any) {
            this.handleError(error, 'generateResponseWithHistory');
        }
    }

    private async *createStreamFromResponse(response: Response): AsyncIterable<string> {
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body available');
        }

        const decoder = new TextDecoder();

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.message?.content) {
                            yield data.message.content;
                        }
                    } catch {
                        // Skip invalid JSON lines
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    async generateSummary(content: string, length: SummaryLength): Promise<string> {
        const { prompt, systemPrompt } = this.prepareSummaryOptions(content, length);

        const messages = [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content: prompt }
        ];

        let result = '';
        const responseStream = await this.generateResponseWithHistory(messages);
        for await (const chunk of responseStream) {
            result += chunk;
        }

        return result;
    }

    async testConnection(): Promise<boolean> {
        const isConnected = await this.checkOllamaConnection();
        if (!isConnected) return false;

        const model = this.config.model || 'gpt-oss-20b';
        return await this.checkModelAvailable(model);
    }

    getAvailableModels(): string[] {
        return [
            'gpt-oss-120b',
            'gpt-oss-20b'
        ];
    }

    getDefaultModel(): string {
        return 'gpt-oss-20b';
    }

    getModelCapabilities(): { maxTokens: number; supportsStreaming: boolean } {
        return { maxTokens: 131072, supportsStreaming: true };
    }
}