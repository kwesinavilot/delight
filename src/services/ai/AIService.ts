import { AIProvider, GenerationOptions, SummaryLength, AIError, AIErrorType } from '../../types/ai';
import { ChatMessage } from '../../types/chat';
import { ConfigManager } from '../config/ConfigManager';
import { ContextProcessor } from '../chat/ContextProcessor';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { GrokProvider } from './providers/GrokProvider';
import { GroqProvider } from './providers/GroqProvider';
import { SambaNovaProvider } from './providers/SambaNovaProvider';

export class AIService {
  private static instance: AIService;
  private configManager: ConfigManager;
  private contextProcessor: ContextProcessor;
  private providers: Map<string, AIProvider> = new Map();
  private currentProvider: AIProvider | null = null;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
    this.contextProcessor = new ContextProcessor();
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
    const providerClasses = {
      openai: OpenAIProvider,
      anthropic: AnthropicProvider,
      gemini: GeminiProvider,
      grok: GrokProvider,
      groq: GroqProvider,
      sambanova: SambaNovaProvider
    };

    for (const [providerName, ProviderClass] of Object.entries(providerClasses)) {
      try {
        const config = await this.configManager.getProviderConfig(providerName);
        const provider = new ProviderClass(config);
        this.providers.set(providerName, provider);
        console.log(`Registered provider: ${providerName}`);
      } catch (error) {
        console.warn(`Failed to register provider ${providerName}:`, error);
        // Continue with other providers instead of failing completely
      }
    }

    if (this.providers.size === 0) {
      throw new AIError(
        AIErrorType.CONFIGURATION_ERROR,
        'No AI providers could be registered'
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

  async switchProvider(providerName: string, options?: {
    preserveContext?: boolean;
    clearContext?: boolean;
  }): Promise<void> {
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

    const previousProvider = this.currentProvider?.name;
    this.currentProvider = provider;
    await this.configManager.setCurrentProvider(providerName);

    // Handle conversation context if ConversationManager is available
    if (options && (options.preserveContext !== undefined || options.clearContext)) {
      try {
        const { ConversationManager } = await import('../chat/ConversationManager');
        const conversationManager = ConversationManager.getInstance();
        
        if (options.clearContext) {
          await conversationManager.clearCurrentSession();
        } else if (options.preserveContext) {
          await conversationManager.switchProvider(providerName, true);
        } else {
          // Default behavior based on user settings
          await conversationManager.switchProvider(providerName);
        }
        
        console.log(`Switched from ${previousProvider} to ${providerName} with context handling`);
      } catch (error) {
        console.warn('Failed to handle conversation context during provider switch:', error);
        // Continue with provider switch even if context handling fails
      }
    }
  }

  // Legacy method for backward compatibility
  async generateChatResponse(
    message: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    // Convert single message to conversation format
    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    return this.generateChatResponseWithHistory([chatMessage], onChunk);
  }

  // New method that supports conversation history (ChatMessage format)
  async generateChatResponseWithHistory(
    messages: ChatMessage[] | any[],
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    // Handle both ChatMessage[] and ProviderMessage[] formats
    let chatMessages: ChatMessage[];
    
    if (messages.length > 0 && 'id' in messages[0]) {
      // Already ChatMessage format
      chatMessages = messages as ChatMessage[];
    } else {
      // Convert from ProviderMessage format
      chatMessages = (messages as any[]).map((msg, index) => ({
        id: `msg_${Date.now()}_${index}`,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: Date.now()
      }));
    }
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
      const providerName = this.currentProvider.name;
      
      // Optimize context for the current provider
      const maxTokens = this.contextProcessor.getProviderTokenLimit(providerName);
      const optimizedMessages = this.contextProcessor.optimizeContext(chatMessages, maxTokens);
      
      // Format messages for the specific provider
      const providerMessages = this.contextProcessor.formatForProvider(optimizedMessages, providerName);
      
      // Validate message format
      if (!this.contextProcessor.validateMessageFormat(providerMessages, providerName)) {
        throw new AIError(
          AIErrorType.CONFIGURATION_ERROR,
          'Invalid message format for provider'
        );
      }

      // Check if provider supports conversation history
      if (typeof this.currentProvider.generateResponseWithHistory === 'function') {
        // Use new conversation-aware method
        const responseStream = await this.currentProvider.generateResponseWithHistory(providerMessages, {
          stream: !!onChunk
        });
        
        let fullResponse = '';
        for await (const chunk of responseStream) {
          fullResponse += chunk;
          if (onChunk) {
            onChunk(chunk);
          }
        }
        
        return fullResponse;
      } else {
        // Fallback to legacy single-message method
        const lastMessage = providerMessages[providerMessages.length - 1];
        if (!lastMessage || lastMessage.role !== 'user') {
          throw new AIError(
            AIErrorType.CONFIGURATION_ERROR,
            'No user message found in conversation'
          );
        }

        const options: GenerationOptions = {
          systemPrompt: "You are Delight, a helpful and friendly AI assistant.",
          stream: !!onChunk
        };

        const responseStream = await this.currentProvider.generateResponse(lastMessage.content, options);
        let fullResponse = '';

        for await (const chunk of responseStream) {
          fullResponse += chunk;
          if (onChunk) {
            onChunk(chunk);
          }
        }
        
        return fullResponse;
      }
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
    try {
      // If not initialized, check config directly
      if (!this.currentProvider) {
        return false;
      }
      return this.currentProvider.isConfigured();
    } catch {
      return false;
    }
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

  // Method for testing provider connectivity with specific configuration
  async testProviderConnection(providerName: string, config: any): Promise<boolean> {
    try {
      // Create a temporary provider instance with the given config
      let tempProvider: AIProvider;

      switch (providerName) {
        case 'openai':
          tempProvider = new OpenAIProvider(config);
          break;
        case 'anthropic':
          tempProvider = new AnthropicProvider(config);
          break;
        case 'gemini':
          tempProvider = new GeminiProvider(config);
          break;
        case 'grok':
          tempProvider = new GrokProvider(config);
          break;
        case 'groq':
          tempProvider = new GroqProvider(config);
          break;
        case 'sambanova':
          tempProvider = new SambaNovaProvider(config);
          break;
        default:
          return false;
      }

      if (!tempProvider.isConfigured()) {
        return false;
      }

      // Test with a simple message
      const testStream = await tempProvider.generateResponse('Hello', {
        systemPrompt: 'Respond with just "OK"',
        stream: false
      });

      // Consume the stream to test connectivity
      for await (const _ of testStream) {
        // Just consume the response
      }

      return true;
    } catch (error) {
      console.error(`Failed to test ${providerName} connection:`, error);
      return false;
    }
  }

  // Get provider-specific capabilities and limitations
  getProviderCapabilities(providerName?: string): {
    maxTokens: number;
    supportsSystemMessages: boolean;
    supportsConversationHistory: boolean;
    messageFormatRequirements: string[];
  } {
    const provider = providerName || this.currentProvider?.name || 'openai';
    
    const capabilities = {
      openai: {
        maxTokens: 4000,
        supportsSystemMessages: true,
        supportsConversationHistory: true,
        messageFormatRequirements: ['role', 'content']
      },
      anthropic: {
        maxTokens: 8000,
        supportsSystemMessages: true,
        supportsConversationHistory: true,
        messageFormatRequirements: ['role', 'content']
      },
      gemini: {
        maxTokens: 8000,
        supportsSystemMessages: true,
        supportsConversationHistory: true,
        messageFormatRequirements: ['role', 'content', 'role_conversion_assistant_to_model']
      },
      grok: {
        maxTokens: 4000,
        supportsSystemMessages: true,
        supportsConversationHistory: true,
        messageFormatRequirements: ['role', 'content']
      },
      groq: {
        maxTokens: 4000,
        supportsSystemMessages: true,
        supportsConversationHistory: true,
        messageFormatRequirements: ['role', 'content']
      },
      sambanova: {
        maxTokens: 4000,
        supportsSystemMessages: true,
        supportsConversationHistory: true,
        messageFormatRequirements: ['role', 'content']
      }
    };

    return capabilities[provider as keyof typeof capabilities] || capabilities.openai;
  }

  // Check if context can be converted between providers
  async validateContextConversion(
    _fromProvider: string, 
    toProvider: string, 
    messages: ChatMessage[]
  ): Promise<{
    canConvert: boolean;
    warnings: string[];
    tokensAfterConversion?: number;
  }> {
    const toCapabilities = this.getProviderCapabilities(toProvider);
    
    const warnings: string[] = [];
    let canConvert = true;

    // Check token limits
    const estimatedTokens = this.contextProcessor.calculateTokenCount(messages);
    if (estimatedTokens > toCapabilities.maxTokens) {
      warnings.push(`Context may be truncated due to ${toProvider} token limits (${estimatedTokens} > ${toCapabilities.maxTokens})`);
    }

    // Check system message support
    const hasSystemMessages = messages.some(m => m.role === 'system');
    if (hasSystemMessages && !toCapabilities.supportsSystemMessages) {
      warnings.push(`${toProvider} may not fully support system messages`);
    }

    // Check conversation history support
    if (messages.length > 1 && !toCapabilities.supportsConversationHistory) {
      warnings.push(`${toProvider} may not support full conversation history`);
      canConvert = false;
    }

    // Format the messages for the target provider to get accurate token count
    try {
      const convertedMessages = this.contextProcessor.formatForProvider(messages, toProvider);
      const tokensAfterConversion = this.contextProcessor.calculateTokenCount(
        convertedMessages.map(m => ({
          id: `temp_${Date.now()}`,
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
          timestamp: Date.now()
        }))
      );

      return {
        canConvert,
        warnings,
        tokensAfterConversion
      };
    } catch (error) {
      warnings.push(`Error during context format conversion: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        canConvert: false,
        warnings
      };
    }
  }
}