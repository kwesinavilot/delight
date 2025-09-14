import { AIProvider, GenerationOptions, SummaryLength, AIError, AIErrorType } from '../../types/ai';
import { ChatMessage } from '../../types/chat';
import { ConfigManager } from '../config/ConfigManager';
import { ContextProcessor } from '../chat/ContextProcessor';
import { TrialService } from '../TrialService';
import { ErrorRecoveryService } from './ErrorRecoveryService';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { GrokProvider } from './providers/GrokProvider';
import { GroqProvider } from './providers/GroqProvider';
import { SambaNovaProvider } from './providers/SambaNovaProvider';
// import { GPTOSSOnlineProvider } from './providers/GPTOSSOnlineProvider';
import { OllamaProvider } from './providers/OllamaProvider';

export class AIService {
  private static instance: AIService;
  private configManager: ConfigManager;
  private contextProcessor: ContextProcessor;
  private errorRecoveryService: ErrorRecoveryService;
  private providers: Map<string, AIProvider> = new Map();
  private currentProvider: AIProvider | null = null;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
    this.contextProcessor = new ContextProcessor();
    this.errorRecoveryService = ErrorRecoveryService.getInstance();
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
      sambanova: SambaNovaProvider,
      ollama: OllamaProvider
      // 'gpt-oss-online': GPTOSSOnlineProvider,
    };

    // Check if we should use trial mode
    const useTrialMode = await TrialService.shouldUseTrialMode();
    
    for (const [providerName, ProviderClass] of Object.entries(providerClasses)) {
      try {
        let config;
        
        if (useTrialMode && providerName === 'gemini') {
          // Use trial configuration for Gemini
          config = {
            provider: 'gemini',
            apiKey: TrialService.getTrialApiKey(),
            model: 'gemini-2.5-flash-lite',
            maxTokens: 1000,
            temperature: 0.7
          };
        } else {
          config = await this.configManager.getProviderConfig(providerName);
        }
        
        const provider = new ProviderClass(config);
        this.providers.set(providerName, provider);
        console.log(`Registered provider: ${providerName}${useTrialMode && providerName === 'gemini' ? ' (trial mode)' : ''}`);
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
      // Check if we should use trial mode
      const useTrialMode = await TrialService.shouldUseTrialMode();
      
      if (useTrialMode) {
        // Force Gemini as current provider in trial mode
        const geminiProvider = this.providers.get('gemini');
        if (geminiProvider) {
          this.currentProvider = geminiProvider;
          console.log('Set current provider to Gemini (trial mode)');
          return;
        }
      }
      
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
    
    // Check trial usage before processing
    const useTrialMode = await TrialService.shouldUseTrialMode();
    if (useTrialMode) {
      const remaining = await TrialService.getRemainingTrialRequests();
      if (remaining <= 0) {
        throw new AIError(
          AIErrorType.CONFIGURATION_ERROR,
          'Trial limit reached (5/5 requests used). Please configure your own API key to continue chatting.'
        );
      }
      
      // Increment trial usage
      await TrialService.incrementTrialUsage();
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

    // Prepare fallback providers (exclude current provider)
    const fallbackProviders = this.getConfiguredProviders()
      .filter(name => name !== this.currentProvider?.name)
      .map(name => this.providers.get(name)!)
      .filter(provider => provider.isConfigured());

    // Primary operation
    const primaryOperation = async () => {
      const providerName = this.currentProvider!.name;
      
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
      if (typeof this.currentProvider!.generateResponseWithHistory === 'function') {
        // Use new conversation-aware method
        const responseStream = await this.currentProvider!.generateResponseWithHistory(providerMessages, {
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
          systemPrompt: "You are Delight, a helpful and friendly AI assistant built by Andrews Kwesi Ankomahene and Naviware R&D. You help users with AI-powered conversations, content analysis, and productivity tasks.",
          stream: !!onChunk
        };

        const responseStream = await this.currentProvider!.generateResponse(lastMessage.content, options);
        let fullResponse = '';

        for await (const chunk of responseStream) {
          fullResponse += chunk;
          if (onChunk) {
            onChunk(chunk);
          }
        }
        
        return fullResponse;
      }
    };

    try {
      // Use error recovery service with fallback
      const result = await this.errorRecoveryService.executeWithFallback(
        primaryOperation,
        fallbackProviders,
        'chat',
        { messages: this.contextProcessor.formatForProvider(chatMessages, 'openai'), onChunk }
      );

      // If a fallback provider was used, optionally notify the user
      if (result.usedProvider && result.usedProvider !== this.currentProvider.name) {
        console.log(`Response generated using fallback provider: ${result.usedProvider}`);
      }

      return result.result;
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

    // Prepare fallback providers (exclude current provider)
    const fallbackProviders = this.getConfiguredProviders()
      .filter(name => name !== this.currentProvider?.name)
      .map(name => this.providers.get(name)!)
      .filter(provider => provider.isConfigured());

    // Primary operation
    const primaryOperation = async () => {
      return await this.currentProvider!.generateSummary(content, length);
    };

    try {
      // Use error recovery service with fallback
      const result = await this.errorRecoveryService.executeWithFallback(
        primaryOperation,
        fallbackProviders,
        'summary',
        { content, length }
      );

      // If a fallback provider was used, optionally notify the user
      if (result.usedProvider && result.usedProvider !== this.currentProvider.name) {
        console.log(`Summary generated using fallback provider: ${result.usedProvider}`);
      }

      return result.result;
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

  getCurrentProvider(): AIProvider | null {
    return this.currentProvider;
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

  async getTrialStatus(): Promise<{
    isTrialMode: boolean;
    remainingRequests: number;
    totalRequests: number;
  }> {
    const isTrialMode = await TrialService.shouldUseTrialMode();
    const remainingRequests = await TrialService.getRemainingTrialRequests();
    
    return {
      isTrialMode,
      remainingRequests,
      totalRequests: 5
    };
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
        // case 'gpt-oss-online':
        //   tempProvider = new GPTOSSOnlineProvider(config);
        //   break;
        case 'ollama':
          tempProvider = new OllamaProvider(config);
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

  // Error recovery and network status methods
  async checkNetworkConnectivity(): Promise<boolean> {
    return await this.errorRecoveryService.checkNetworkConnectivity();
  }

  getNetworkStatus(): { isOnline: boolean; lastCheck: number } {
    const status = this.errorRecoveryService.getNetworkStatus();
    return {
      isOnline: status.isOnline,
      lastCheck: status.lastCheck
    };
  }

  getRetryConfiguration(): { maxRetries: number; baseDelay: number; maxDelay: number } {
    const config = this.errorRecoveryService.getRetryConfig();
    return {
      maxRetries: config.maxRetries,
      baseDelay: config.baseDelay,
      maxDelay: config.maxDelay
    };
  }

  updateRetryConfiguration(config: { maxRetries?: number; baseDelay?: number; maxDelay?: number }): void {
    this.errorRecoveryService.updateRetryConfig(config);
  }

  // Test all configured providers and return their status
  async testAllProviders(): Promise<Record<string, { configured: boolean; connected: boolean; error?: string }>> {
    const results: Record<string, { configured: boolean; connected: boolean; error?: string }> = {};
    
    for (const [name, provider] of this.providers.entries()) {
      const configured = provider.isConfigured();
      let connected = false;
      let error: string | undefined;
      
      if (configured) {
        try {
          connected = await this.errorRecoveryService.executeWithRetry(
            () => this.testProvider(name),
            `test provider ${name}`
          );
        } catch (e) {
          error = e instanceof Error ? e.message : 'Unknown error';
        }
      }
      
      results[name] = { configured, connected, error };
    }
    
    return results;
  }
}