import { 
  ChatMessage, 
  ProviderMessage, 
  ContextProcessor as IContextProcessor,
  ContextOptimizationResult
} from '../../types/chat';
import { PerformanceOptimizer } from './PerformanceOptimizer';

export class ContextProcessor implements IContextProcessor {
  // Rough token estimation (1 token ≈ 4 characters for English text)
  private readonly CHARS_PER_TOKEN = 4;
  private performanceOptimizer: PerformanceOptimizer;
  
  // Provider-specific token limits (conservative estimates)
  private readonly PROVIDER_LIMITS: Record<string, number> = {
    'openai': 4000,      // GPT-3.5-turbo context window
    'anthropic': 8000,   // Claude context window
    'gemini': 8000,      // Gemini Pro context window
    'grok': 4000,        // Grok context window
    'groq': 4000,        // Groq context window
    'sambanova': 4000    // SambaNova context window
  };

  constructor() {
    this.performanceOptimizer = PerformanceOptimizer.getInstance();
  }

  formatForProvider(messages: ChatMessage[], provider: string): ProviderMessage[] {
    try {
      switch (provider.toLowerCase()) {
        case 'openai':
        case 'groq':
          return this.formatForOpenAI(messages);
        
        case 'anthropic':
          return this.formatForAnthropic(messages);
        
        case 'gemini':
          return this.formatForGemini(messages);
        
        case 'grok':
          return this.formatForGrok(messages);
        
        case 'sambanova':
          return this.formatForSambaNova(messages);
        
        default:
          console.warn(`Unknown provider ${provider}, using OpenAI format`);
          return this.formatForOpenAI(messages);
      }
    } catch (error) {
      console.error(`Failed to format messages for provider ${provider}:`, error);
      // Fallback to basic format
      return messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    }
  }

  private formatForOpenAI(messages: ChatMessage[]): ProviderMessage[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  private formatForAnthropic(messages: ChatMessage[]): ProviderMessage[] {
    // Anthropic uses similar format to OpenAI
    // but may handle system messages differently
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  private formatForGemini(messages: ChatMessage[]): ProviderMessage[] {
    // Gemini may use 'user' and 'model' instead of 'assistant'
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : msg.role,
      content: msg.content
    }));
  }

  private formatForGrok(messages: ChatMessage[]): ProviderMessage[] {
    // Grok uses OpenAI-compatible format
    return this.formatForOpenAI(messages);
  }

  private formatForSambaNova(messages: ChatMessage[]): ProviderMessage[] {
    // SambaNova uses OpenAI-compatible format
    return this.formatForOpenAI(messages);
  }

  calculateTokenCount(messages: ChatMessage[]): number {
    const totalChars = messages.reduce((sum, msg) => {
      // Count characters in content plus some overhead for role and structure
      return sum + msg.content.length + 20; // 20 chars overhead per message
    }, 0);

    return Math.ceil(totalChars / this.CHARS_PER_TOKEN);
  }

  optimizeContext(messages: ChatMessage[], maxTokens: number): ChatMessage[] {
    const currentTokens = this.calculateTokenCount(messages);
    
    if (currentTokens <= maxTokens) {
      return messages;
    }

    console.log(`Context too large (${currentTokens} tokens), optimizing to ${maxTokens} tokens`);
    
    // Use performance optimizer for large histories
    if (messages.length > 20) {
      return this.optimizeContextWithPerformanceOptimizer(messages, maxTokens);
    }
    
    return this.truncateContext(messages, maxTokens);
  }

  private optimizeContextWithPerformanceOptimizer(messages: ChatMessage[], maxTokens: number): ChatMessage[] {
    try {
      // This is a synchronous wrapper for the async optimization
      // In a real implementation, you might want to make the entire chain async
      // For now, fall back to regular truncation
      // TODO: Make this properly async in the calling chain
      return this.truncateContext(messages, maxTokens);
    } catch (error) {
      console.error('Performance optimization failed, falling back to truncation:', error);
      return this.truncateContext(messages, maxTokens);
    }
  }

  truncateContext(messages: ChatMessage[], maxTokens: number): ChatMessage[] {
    if (messages.length === 0) return messages;

    // Strategy: Keep system messages and recent conversation
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const conversationMessages = messages.filter(msg => msg.role !== 'system');

    // Calculate tokens for system messages
    const systemTokens = this.calculateTokenCount(systemMessages);
    const availableTokens = maxTokens - systemTokens;

    if (availableTokens <= 0) {
      console.warn('System messages exceed token limit, truncating system messages');
      return this.truncateMessages(systemMessages, maxTokens);
    }

    // Truncate conversation messages to fit remaining space
    const truncatedConversation = this.truncateMessages(conversationMessages, availableTokens);
    
    return [...systemMessages, ...truncatedConversation];
  }

  private truncateMessages(messages: ChatMessage[], maxTokens: number): ChatMessage[] {
    if (messages.length === 0) return messages;

    // Start from the end (most recent) and work backwards
    const result: ChatMessage[] = [];
    let currentTokens = 0;

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const messageTokens = this.calculateTokenCount([message]);
      
      if (currentTokens + messageTokens <= maxTokens) {
        result.unshift(message);
        currentTokens += messageTokens;
      } else {
        // Try to fit a truncated version of this message
        const truncatedMessage = this.truncateMessage(message, maxTokens - currentTokens);
        if (truncatedMessage) {
          result.unshift(truncatedMessage);
        }
        break;
      }
    }

    return result;
  }

  private truncateMessage(message: ChatMessage, maxTokens: number): ChatMessage | null {
    if (maxTokens <= 0) return null;

    const maxChars = maxTokens * this.CHARS_PER_TOKEN;
    
    if (message.content.length <= maxChars) {
      return message;
    }

    // Truncate content and add ellipsis
    const truncatedContent = message.content.substring(0, maxChars - 3) + '...';
    
    return {
      ...message,
      content: truncatedContent,
      metadata: {
        ...message.metadata,
        truncated: true
      }
    };
  }

  // Get provider-specific token limit
  getProviderTokenLimit(provider: string): number {
    return this.PROVIDER_LIMITS[provider.toLowerCase()] || 4000;
  }

  // Estimate if context will fit for a provider
  willContextFit(messages: ChatMessage[], provider: string): boolean {
    const tokenCount = this.calculateTokenCount(messages);
    const limit = this.getProviderTokenLimit(provider);
    return tokenCount <= limit;
  }

  // Create a summary of truncated messages for context
  createContextSummary(truncatedMessages: ChatMessage[]): ChatMessage {
    const messageCount = truncatedMessages.length;
    const timeRange = this.getTimeRange(truncatedMessages);
    
    const summaryContent = `[Previous conversation summary: ${messageCount} messages from ${timeRange} were truncated to fit context limits]`;
    
    return {
      id: `summary_${Date.now()}`,
      role: 'system',
      content: summaryContent,
      timestamp: Date.now(),
      metadata: {
        isSummary: true,
        originalMessageCount: messageCount
      }
    };
  }

  private getTimeRange(messages: ChatMessage[]): string {
    if (messages.length === 0) return 'unknown time';
    
    const timestamps = messages.map(m => m.timestamp).sort((a, b) => a - b);
    const earliest = new Date(timestamps[0]);
    const latest = new Date(timestamps[timestamps.length - 1]);
    
    const formatDate = (date: Date) => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'less than an hour ago';
      if (diffHours < 24) return `${diffHours} hours ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString();
    };

    if (timestamps.length === 1) {
      return formatDate(earliest);
    }

    return `${formatDate(earliest)} to ${formatDate(latest)}`;
  }

  // Advanced context optimization with summarization
  async optimizeContextWithSummary(messages: ChatMessage[], maxTokens: number): Promise<ChatMessage[]> {
    const currentTokens = this.calculateTokenCount(messages);
    
    if (currentTokens <= maxTokens) {
      return messages;
    }

    // Find split point for summarization
    const targetTokens = Math.floor(maxTokens * 0.7); // Use 70% for recent messages
    const recentMessages = this.truncateMessages(messages, targetTokens);
    
    // Find messages that were truncated
    const recentMessageIds = new Set(recentMessages.map(m => m.id));
    const truncatedMessages = messages.filter(m => !recentMessageIds.has(m.id));
    
    if (truncatedMessages.length > 0) {
      // Create summary of truncated messages
      const summary = this.createContextSummary(truncatedMessages);
      return [summary, ...recentMessages];
    }

    return recentMessages;
  }

  // Validate message format for provider
  validateMessageFormat(messages: ProviderMessage[], provider: string): boolean {
    try {
      for (const message of messages) {
        if (!message.role || !message.content) {
          return false;
        }
        
        // Provider-specific validation
        switch (provider.toLowerCase()) {
          case 'gemini':
            // For Gemini, we expect assistant messages to remain as assistant
            // The actual conversion happens in the provider layer
            break;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Message format validation failed:', error);
      return false;
    }
  }

  // Convert context between different providers
  convertContextBetweenProviders(
    messages: ChatMessage[], 
    fromProvider: string, 
    toProvider: string
  ): ChatMessage[] {
    try {
      // If same provider, no conversion needed
      if (fromProvider.toLowerCase() === toProvider.toLowerCase()) {
        return messages;
      }

      console.log(`Converting context from ${fromProvider} to ${toProvider}`);

      // Convert messages to target provider format and back to ChatMessage format
      const providerMessages = this.formatForProvider(messages, toProvider);
      
      // Convert back to ChatMessage format with any necessary adjustments
      const convertedMessages: ChatMessage[] = providerMessages.map((msg, index) => {
        const originalMessage = messages[index] || messages[messages.length - 1];
        
        return {
          ...originalMessage,
          role: this.normalizeRole(msg.role, toProvider),
          content: msg.content,
          provider: toProvider,
          metadata: {
            ...originalMessage.metadata,
            convertedFrom: fromProvider,
            convertedAt: Date.now()
          }
        };
      });

      // Add conversion notice if there were significant changes
      if (this.hasSignificantConversionChanges(messages, convertedMessages)) {
        const conversionNotice: ChatMessage = {
          id: `conversion_${Date.now()}`,
          role: 'system',
          content: `[Context converted from ${fromProvider} to ${toProvider}. Some formatting may have changed.]`,
          timestamp: Date.now(),
          provider: toProvider,
          metadata: {
            isConversionNotice: true,
            fromProvider,
            toProvider
          }
        };
        
        return [conversionNotice, ...convertedMessages];
      }

      return convertedMessages;
    } catch (error) {
      console.error('Failed to convert context between providers:', error);
      
      // Fallback: return original messages with updated provider info
      return messages.map(msg => ({
        ...msg,
        provider: toProvider,
        metadata: {
          ...msg.metadata,
          conversionFailed: true,
          originalProvider: fromProvider
        }
      }));
    }
  }

  private normalizeRole(role: string, provider: string): 'user' | 'assistant' | 'system' {
    // Convert provider-specific roles back to standard roles
    switch (provider.toLowerCase()) {
      case 'gemini':
        if (role === 'model') return 'assistant';
        break;
    }
    
    // Ensure role is one of the valid types
    if (['user', 'assistant', 'system'].includes(role)) {
      return role as 'user' | 'assistant' | 'system';
    }
    
    // Default fallback
    return 'assistant';
  }

  private hasSignificantConversionChanges(
    original: ChatMessage[], 
    converted: ChatMessage[]
  ): boolean {
    if (original.length !== converted.length) return true;
    
    for (let i = 0; i < original.length; i++) {
      const orig = original[i];
      const conv = converted[i];
      
      // Check for role changes
      if (orig.role !== conv.role) return true;
      
      // Check for significant content changes (more than whitespace)
      if (orig.content.trim() !== conv.content.trim()) return true;
    }
    
    return false;
  }

  // Get provider-specific context optimization settings
  getProviderOptimizationSettings(provider: string): {
    preferredTokenLimit: number;
    truncationStrategy: 'recent' | 'summary' | 'balanced';
    preserveSystemMessages: boolean;
    maxContextMessages: number;
  } {
    const settings = {
      openai: {
        preferredTokenLimit: 3500, // Leave room for response
        truncationStrategy: 'balanced' as const,
        preserveSystemMessages: true,
        maxContextMessages: 50
      },
      anthropic: {
        preferredTokenLimit: 7000,
        truncationStrategy: 'recent' as const,
        preserveSystemMessages: true,
        maxContextMessages: 100
      },
      gemini: {
        preferredTokenLimit: 7000,
        truncationStrategy: 'balanced' as const,
        preserveSystemMessages: true,
        maxContextMessages: 80
      },
      grok: {
        preferredTokenLimit: 3500,
        truncationStrategy: 'recent' as const,
        preserveSystemMessages: true,
        maxContextMessages: 40
      },
      groq: {
        preferredTokenLimit: 3500,
        truncationStrategy: 'recent' as const,
        preserveSystemMessages: true,
        maxContextMessages: 40
      },
      sambanova: {
        preferredTokenLimit: 3500,
        truncationStrategy: 'recent' as const,
        preserveSystemMessages: true,
        maxContextMessages: 40
      }
    };

    return settings[provider.toLowerCase() as keyof typeof settings] || settings.openai;
  }

  // Async context optimization for large histories
  async optimizeContextAsync(messages: ChatMessage[], maxTokens: number): Promise<ContextOptimizationResult> {
    return await this.performanceOptimizer.optimizeContextForLargeHistory(
      messages,
      maxTokens,
      this
    );
  }

  // Optimize context specifically for provider switching
  optimizeContextForProviderSwitch(
    messages: ChatMessage[], 
    fromProvider: string, 
    toProvider: string
  ): ChatMessage[] {
    const toSettings = this.getProviderOptimizationSettings(toProvider);
    
    // First convert the context format
    const convertedMessages = this.convertContextBetweenProviders(messages, fromProvider, toProvider);
    
    // Then optimize for the target provider
    return this.optimizeContext(convertedMessages, toSettings.preferredTokenLimit);
  }

  // Async version for provider switching with performance optimization
  async optimizeContextForProviderSwitchAsync(
    messages: ChatMessage[], 
    fromProvider: string, 
    toProvider: string
  ): Promise<{
    optimizedMessages: ChatMessage[];
    optimizationResult: ContextOptimizationResult;
  }> {
    const toSettings = this.getProviderOptimizationSettings(toProvider);
    
    // First convert the context format
    const convertedMessages = this.convertContextBetweenProviders(messages, fromProvider, toProvider);
    
    // Then optimize for the target provider with performance monitoring
    const optimizationResult = await this.optimizeContextAsync(convertedMessages, toSettings.preferredTokenLimit);
    
    return {
      optimizedMessages: convertedMessages.slice(-optimizationResult.optimizedTokens), // Simplified
      optimizationResult
    };
  }
}