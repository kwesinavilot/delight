import { AIProvider, GenerationOptions, SummaryLength, AIError, AIErrorType } from '../../types/ai';
import { ConfigManager } from '../config/ConfigManager';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';

export class AIService {
  private static instance: AIService;
  private configManager: ConfigManager;
  private providers: Map<string, AIProvider> = new Map();
  private currentProvider: AIProvider | null = null;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async initialize(): Promise<void> {
    await this.configManager.initialize();
    await this.registerProviders();
    await this.setCurrentProvider();
  }

  private async registerProviders(): Promise<void> {
    try {
      // Register OpenAI provider
      const openaiConfig = await this.configManager.getProviderConfig('openai');
      const openaiProvider = new OpenAIProvider(openaiConfig);
      this.providers.set('openai', openaiProvider);

      // Register Anthropic provider
      const anthropicConfig = await this.configManager.getProviderConfig('anthropic');
      const anthropicProvider = new AnthropicProvider(anthropicConfig);
      this.providers.set('anthropic', anthropicProvider);
    } catch (error) {
      console.error('Failed to register providers:', error);
      throw new AIError(
        AIErrorType.CONFIGURATION_ERROR,
        'Failed to initialize AI providers',
        undefined,
        error as Error
      );
    }
  }

  private async setCurrentProvider(): Promise<void> {
    try {
      const currentProviderName = await this.configManager.getCurrentProvider();
      const provider = this.providers.get(currentProviderName);
      
      if (!provider) {
        throw new AIError(
          AIErrorType.CONFIGURATION_ERROR,
          `Provider ${currentProviderName} is not available`
        );
      }

      this.currentProvider = provider;
    } catch (error) {
      console.error('Failed to set current provider:', error);
      // Try to fall back to any configured provider
      await this.fallbackToAvailableProvider();
    }
  }

  private async fallbackToAvailableProvider(): Promise<void> {
    const availableProviders = Array.from(this.providers.entries());
    
    for (const [name, provider] of availableProviders) {
      if (provider.isConfigured()) {
        console.log(`Falling back to provider: ${name}`);
        this.currentProvider = provider;
        await this.configManager.setCurrentProvider(name);
        return;
      }
    }

    throw new AIError(
      AIErrorType.CONFIGURATION_ERROR,
      'No configured AI providers available'
    );
  }

  async switchProvider(providerName: string): Promise<void> {
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new AIError(
        AIErrorType.CONFIGURATION_ERROR,
        `Provider ${providerName} is not available`
      );
    }

    if (!provider.isConfigured()) {
      throw new AIError(
        AIErrorType.CONFIGURATION_ERROR,
        `Provider ${providerName} is not configured. Please add an API key.`
      );
    }

    this.currentProvider = provider;
    await this.configManager.setCurrentProvider(providerName);
  }

  async generateChatResponse(
    message: string, 
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    if (!this.currentProvider) {
      throw new AIError(
        AIErrorType.CONFIGURATION_ERROR,
        'No AI provider is currently configured'
      );
    }

    if (!this.currentProvider.isConfigured()) {
      throw new AIError(
        AIErrorType.CONFIGURATION_ERROR,
        'Current AI provider is not properly configured'
      );
    }

    try {
      const options: GenerationOptions = {
        systemPrompt: "You are Delight, a helpful and friendly AI assistant.",
        stream: !!onChunk
      };

      const responseStream = await this.currentProvider.generateResponse(message, options);
      let fullResponse = '';

      for await (const chunk of responseStream) {
        fullResponse += chunk;
        if (onChunk) {
          onChunk(chunk);
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('Chat response generation failed:', error);
      
      if (error instanceof AIError) {
        throw error;
      }
      
      throw new AIError(
        AIErrorType.API_ERROR,
        'Failed to generate chat response',
        this.currentProvider.name,
        error as Error
      );
    }
  }

  async generatePageSummary(content: string, length: SummaryLength): Promise<string> {
    if (!this.currentProvider) {
      throw new AIError(
        AIErrorType.CONFIGURATION_ERROR,
        'No AI provider is currently configured'
      );
    }

    if (!this.currentProvider.isConfigured()) {
      throw new AIError(
        AIErrorType.CONFIGURATION_ERROR,
        'Current AI provider is not properly configured'
      );
    }

    try {
      return await this.currentProvider.generateSummary(content, length);
    } catch (error) {
      console.error('Summary generation failed:', error);
      
      if (error instanceof AIError) {
        throw error;
      }
      
      throw new AIError(
        AIErrorType.API_ERROR,
        'Failed to generate page summary',
        this.currentProvider.name,
        error as Error
      );
    }
  }

  getCurrentProviderName(): string | null {
    return this.currentProvider?.name || null;
  }

  isCurrentProviderConfigured(): boolean {
    return this.currentProvider?.isConfigured() || false;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getConfiguredProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isConfigured())
      .map(([name, _]) => name);
  }

  async refreshProviderConfiguration(): Promise<void> {
    await this.registerProviders();
    await this.setCurrentProvider();
  }

  async validateCurrentConfiguration(): Promise<boolean> {
    try {
      if (!this.currentProvider) {
        return false;
      }
      
      return this.currentProvider.isConfigured();
    } catch {
      return false;
    }
  }

  // Method for testing provider connectivity
  async testProvider(providerName?: string): Promise<boolean> {
    const provider = providerName 
      ? this.providers.get(providerName)
      : this.currentProvider;

    if (!provider || !provider.isConfigured()) {
      return false;
    }

    try {
      // Test with a simple message
      const testStream = await provider.generateResponse('Hello', { 
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
}