import { 
  ChatSession, 
  ChatMessage, 
  ConversationManager as IConversationManager,
  ProviderMessage,
  ConversationError,
  ConversationErrorType,
  PerformanceMetrics
} from '../../types/chat';
import { MessageStore } from './MessageStore';
import { ContextProcessor } from './ContextProcessor';
// import { PerformanceOptimizer } from './PerformanceOptimizer';

export class ConversationManager implements IConversationManager {
  private static instance: ConversationManager;
  private messageStore: MessageStore;
  private contextProcessor: ContextProcessor;
  private currentSession: ChatSession | null = null;

  private constructor() {
    this.messageStore = MessageStore.getInstance();
    this.contextProcessor = new ContextProcessor();
  }

  static getInstance(): ConversationManager {
    if (!ConversationManager.instance) {
      ConversationManager.instance = new ConversationManager();
    }
    return ConversationManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Load current session if exists
      const currentSessionId = await this.messageStore.getCurrentSessionId();
      if (currentSessionId) {
        this.currentSession = await this.messageStore.getSession(currentSessionId);
      }

      // Run cleanup on initialization
      await this.messageStore.cleanup();
    } catch (error) {
      console.error('Failed to initialize ConversationManager:', error);
      // Don't throw - allow graceful degradation
    }
  }

  getCurrentSession(): ChatSession {
    if (!this.currentSession) {
      throw new ConversationError(
        ConversationErrorType.SESSION_NOT_FOUND,
        'No current session available. Create a new session first.'
      );
    }
    return this.currentSession;
  }

  async createNewSession(provider?: string): Promise<ChatSession> {
    try {
      // Use current provider if not specified
      const sessionProvider = provider || this.currentSession?.provider || 'openai';
      
      const newSession = await this.messageStore.createSession(sessionProvider);
      this.currentSession = newSession;
      
      console.log(`Created new conversation session: ${newSession.id}`);
      return newSession;
    } catch (error) {
      console.error('Failed to create new session:', error);
      throw new ConversationError(
        ConversationErrorType.STORAGE_ERROR,
        'Failed to create new conversation session',
        error
      );
    }
  }

  async clearCurrentSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // Clear messages from current session
      this.currentSession.messages = [];
      this.currentSession.lastUpdated = Date.now();
      
      await this.messageStore.updateSession(this.currentSession);
      console.log(`Cleared current session: ${this.currentSession.id}`);
    } catch (error) {
      console.error('Failed to clear current session:', error);
      throw new ConversationError(
        ConversationErrorType.STORAGE_ERROR,
        'Failed to clear conversation',
        error
      );
    }
  }

  async switchToSession(sessionId: string): Promise<void> {
    try {
      const session = await this.messageStore.getSession(sessionId);
      if (!session) {
        throw new ConversationError(
          ConversationErrorType.SESSION_NOT_FOUND,
          `Session ${sessionId} not found`
        );
      }

      this.currentSession = session;
      await this.messageStore.setCurrentSessionId(sessionId);
      
      console.log(`Switched to session: ${sessionId}`);
    } catch (error) {
      console.error('Failed to switch session:', error);
      throw error;
    }
  }

  async addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    // Ensure we have a current session
    if (!this.currentSession) {
      await this.createNewSession();
    }

    const fullMessage: ChatMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now()
    };

    try {
      await this.messageStore.addMessage(this.currentSession!.id, fullMessage);
      
      // Update local session
      this.currentSession!.messages.push(fullMessage);
      this.currentSession!.lastUpdated = Date.now();
      
      console.log(`Added message to session ${this.currentSession!.id}:`, fullMessage.role);
      return fullMessage;
    } catch (error) {
      console.error('Failed to add message:', error);
      throw new ConversationError(
        ConversationErrorType.STORAGE_ERROR,
        'Failed to add message to conversation',
        error
      );
    }
  }

  getConversationHistory(): ChatMessage[] {
    if (!this.currentSession) {
      return [];
    }
    return [...this.currentSession.messages];
  }

  async getContextForProvider(provider: string): Promise<ProviderMessage[]> {
    const messages = this.getConversationHistory();
    
    try {
      const settings = await this.messageStore.getSettings();
      
      // Use performance-optimized context processing for large histories
      if (settings.enablePerformanceMonitoring && messages.length > settings.lazyLoadThreshold) {
        const optimizationResult = await this.contextProcessor.optimizeContextAsync(
          messages,
          settings.maxTokensPerContext
        );
        
        console.log(`Context optimization: ${optimizationResult.originalTokens} → ${optimizationResult.optimizedTokens} tokens (${optimizationResult.processingTime}ms)`);
        
        // Get the optimized messages (simplified - in real implementation would use the actual optimized messages)
        const optimizedMessages = this.contextProcessor.optimizeContext(messages, settings.maxTokensPerContext);
        return this.contextProcessor.formatForProvider(optimizedMessages, provider);
      } else {
        // Standard optimization for smaller histories
        const optimizedMessages = this.contextProcessor.optimizeContext(
          messages, 
          settings.maxTokensPerContext
        );
        
        return this.contextProcessor.formatForProvider(optimizedMessages, provider);
      }
    } catch (error) {
      console.error('Failed to get context for provider:', error);
      // Fallback to basic formatting
      return this.contextProcessor.formatForProvider(messages, provider);
    }
  }

  async exportConversation(): Promise<string> {
    if (!this.currentSession) {
      throw new ConversationError(
        ConversationErrorType.SESSION_NOT_FOUND,
        'No current session to export'
      );
    }

    try {
      const exportData = {
        session: this.currentSession,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export conversation:', error);
      throw new ConversationError(
        ConversationErrorType.EXPORT_ERROR,
        'Failed to export conversation',
        error
      );
    }
  }

  async importConversation(data: string): Promise<void> {
    try {
      const importData = JSON.parse(data);
      
      if (!importData.session || !importData.session.messages) {
        throw new Error('Invalid conversation format');
      }

      // Create new session with imported data
      await this.createNewSession(importData.session.provider);
      
      // Add all messages from import
      for (const message of importData.session.messages) {
        await this.addMessage({
          role: message.role,
          content: message.content,
          provider: message.provider,
          metadata: message.metadata
        });
      }

      console.log(`Imported conversation with ${importData.session.messages.length} messages`);
    } catch (error) {
      console.error('Failed to import conversation:', error);
      throw new ConversationError(
        ConversationErrorType.IMPORT_ERROR,
        'Failed to import conversation',
        error
      );
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (!this.currentSession) {
      throw new ConversationError(
        ConversationErrorType.SESSION_NOT_FOUND,
        'No current session available'
      );
    }

    try {
      await this.messageStore.deleteMessage(this.currentSession.id, messageId);
      
      // Update local session
      const messageIndex = this.currentSession.messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        this.currentSession.messages.splice(messageIndex, 1);
        this.currentSession.lastUpdated = Date.now();
      }

      console.log(`Deleted message ${messageId} from session ${this.currentSession.id}`);
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  async getAllSessions(): Promise<ChatSession[]> {
    try {
      return await this.messageStore.getAllSessions();
    } catch (error) {
      console.error('Failed to get all sessions:', error);
      throw new ConversationError(
        ConversationErrorType.STORAGE_ERROR,
        'Failed to retrieve conversation sessions',
        error
      );
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      await this.messageStore.deleteSession(sessionId);
      
      // If this was the current session, clear it
      if (this.currentSession?.id === sessionId) {
        this.currentSession = null;
      }

      console.log(`Deleted session: ${sessionId}`);
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  // Provider switching with context preservation
  async switchProvider(
    newProvider: string, 
    preserveContext?: boolean,
    options?: {
      createNewSession?: boolean;
      convertContext?: boolean;
      validateConversion?: boolean;
    }
  ): Promise<{
    success: boolean;
    warnings?: string[];
    newSessionId?: string;
    contextConverted?: boolean;
  }> {
    const settings = await this.messageStore.getSettings();
    const shouldPreserveContext = preserveContext ?? settings.preserveOnProviderSwitch;
    const warnings: string[] = [];

    if (!this.currentSession) {
      // Just create new session with new provider
      const newSession = await this.createNewSession(newProvider);
      return {
        success: true,
        newSessionId: newSession.id
      };
    }

    try {
      const oldProvider = this.currentSession.provider;
      
      if (options?.createNewSession || !shouldPreserveContext) {
        // Create new session with new provider
        const newSession = await this.createNewSession(newProvider);
        console.log(`Switched to new session with provider ${newProvider}`);
        return {
          success: true,
          newSessionId: newSession.id
        };
      }

      // Preserve context - update current session
      let contextConverted = false;
      
      if (options?.convertContext && oldProvider !== newProvider) {
        // Convert context format between providers
        try {
          const convertedMessages = this.contextProcessor.convertContextBetweenProviders(
            this.currentSession.messages,
            oldProvider,
            newProvider
          );
          
          // Validate conversion if requested
          if (options.validateConversion) {
            const { AIService } = await import('../ai/AIService');
            const aiService = AIService.getInstance();
            const validation = await aiService.validateContextConversion(
              oldProvider,
              newProvider,
              this.currentSession.messages
            );
            
            if (!validation.canConvert) {
              warnings.push('Context conversion not recommended for this provider switch');
              warnings.push(...validation.warnings);
            } else {
              warnings.push(...validation.warnings);
            }
          }
          
          this.currentSession.messages = convertedMessages;
          contextConverted = true;
          
          console.log(`Converted context from ${oldProvider} to ${newProvider}`);
        } catch (error) {
          console.error('Failed to convert context:', error);
          warnings.push('Context conversion failed, keeping original format');
        }
      }

      // Update session provider
      this.currentSession.provider = newProvider;
      this.currentSession.lastUpdated = Date.now();
      
      // Add metadata about the provider switch
      if (this.currentSession.metadata) {
        this.currentSession.metadata.providerSwitches = [
          ...(this.currentSession.metadata.providerSwitches || []),
          {
            from: oldProvider,
            to: newProvider,
            timestamp: Date.now(),
            contextConverted
          }
        ];
      } else {
        (this.currentSession as any).metadata = {
          providerSwitches: [{
            from: oldProvider,
            to: newProvider,
            timestamp: Date.now(),
            contextConverted
          }]
        };
      }
      
      await this.messageStore.updateSession(this.currentSession);
      
      console.log(`Switched provider to ${newProvider} with context preserved`);
      
      return {
        success: true,
        warnings: warnings.length > 0 ? warnings : undefined,
        contextConverted
      };
    } catch (error) {
      console.error('Failed to switch provider:', error);
      throw new ConversationError(
        ConversationErrorType.STORAGE_ERROR,
        'Failed to switch AI provider',
        error
      );
    }
  }

  // Utility methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async updateSessionTitle(title: string): Promise<void> {
    if (!this.currentSession) {
      throw new ConversationError(
        ConversationErrorType.SESSION_NOT_FOUND,
        'No current session available'
      );
    }

    try {
      this.currentSession.title = title;
      this.currentSession.lastUpdated = Date.now();
      
      await this.messageStore.updateSession(this.currentSession);
      console.log(`Updated session title: ${title}`);
    } catch (error) {
      console.error('Failed to update session title:', error);
      throw new ConversationError(
        ConversationErrorType.STORAGE_ERROR,
        'Failed to update session title',
        error
      );
    }
  }

  async getConversationStats(): Promise<{
    currentSessionMessages: number;
    totalSessions: number;
    totalMessages: number;
  }> {
    try {
      const stats = await this.messageStore.getStorageStats();
      
      return {
        currentSessionMessages: this.currentSession?.messages.length || 0,
        totalSessions: stats.sessions,
        totalMessages: stats.messages
      };
    } catch (error) {
      console.error('Failed to get conversation stats:', error);
      return {
        currentSessionMessages: 0,
        totalSessions: 0,
        totalMessages: 0
      };
    }
  }

  // Get provider switching recommendations
  async getProviderSwitchRecommendations(targetProvider: string): Promise<{
    canPreserveContext: boolean;
    shouldConvertContext: boolean;
    warnings: string[];
    recommendations: string[];
    estimatedTokensAfterSwitch?: number;
  }> {
    const recommendations: string[] = [];
    const warnings: string[] = [];
    
    if (!this.currentSession) {
      return {
        canPreserveContext: true,
        shouldConvertContext: false,
        warnings: [],
        recommendations: ['No active conversation - new session will be created']
      };
    }

    const currentProvider = this.currentSession.provider;
    const messages = this.currentSession.messages;
    
    if (currentProvider === targetProvider) {
      return {
        canPreserveContext: true,
        shouldConvertContext: false,
        warnings: [],
        recommendations: ['Same provider selected - no changes needed']
      };
    }

    try {
      // Get AI service for validation
      const { AIService } = await import('../ai/AIService');
      const aiService = AIService.getInstance();
      
      const validation = await aiService.validateContextConversion(
        currentProvider,
        targetProvider,
        messages
      );

      const canPreserveContext = validation.canConvert;
      const shouldConvertContext = messages.length > 0 && currentProvider !== targetProvider;

      // Add recommendations based on conversation state
      if (messages.length === 0) {
        recommendations.push('No conversation history - switch will be seamless');
      } else if (messages.length < 5) {
        recommendations.push('Short conversation - context preservation recommended');
      } else if (messages.length > 20) {
        recommendations.push('Long conversation - consider starting fresh or expect context truncation');
      } else {
        recommendations.push('Medium conversation - context preservation should work well');
      }

      // Add provider-specific recommendations
      const targetCapabilities = aiService.getProviderCapabilities(targetProvider);
      const currentTokens = this.contextProcessor.calculateTokenCount(messages);
      
      if (currentTokens > targetCapabilities.maxTokens) {
        warnings.push(`Context may be truncated (${currentTokens} tokens > ${targetCapabilities.maxTokens} limit)`);
        recommendations.push('Consider starting a new conversation to avoid truncation');
      }

      return {
        canPreserveContext,
        shouldConvertContext,
        warnings: [...warnings, ...validation.warnings],
        recommendations,
        estimatedTokensAfterSwitch: validation.tokensAfterConversion
      };
    } catch (error) {
      console.error('Failed to get provider switch recommendations:', error);
      return {
        canPreserveContext: false,
        shouldConvertContext: false,
        warnings: ['Unable to analyze context compatibility'],
        recommendations: ['Consider starting a new conversation to be safe']
      };
    }
  }

  // Check if conversation manager is ready
  isReady(): boolean {
    return this.currentSession !== null;
  }

  // Get current session info without throwing
  getCurrentSessionInfo(): { id: string; title: string; messageCount: number; provider: string } | null {
    if (!this.currentSession) return null;
    
    return {
      id: this.currentSession.id,
      title: this.currentSession.title || 'Untitled Conversation',
      messageCount: this.currentSession.messages.length,
      provider: this.currentSession.provider
    };
  }

  // Performance monitoring and optimization methods
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return await this.messageStore.getPerformanceMetrics();
  }

  async optimizePerformance(): Promise<{
    memoryFreed: number;
    sessionsCompressed: number;
    cacheCleared: boolean;
    contextOptimized: boolean;
  }> {
    const storeResult = await this.messageStore.optimizePerformance();
    
    // Optimize current session context if it exists
    let contextOptimized = false;
    if (this.currentSession && this.currentSession.messages.length > 50) {
      try {
        const settings = await this.messageStore.getSettings();
        const optimizationResult = await this.contextProcessor.optimizeContextAsync(
          this.currentSession.messages,
          settings.maxTokensPerContext
        );
        
        if (optimizationResult.messagesRemoved > 0 || optimizationResult.compressionApplied) {
          contextOptimized = true;
          console.log(`Context optimized: removed ${optimizationResult.messagesRemoved} messages, compression: ${optimizationResult.compressionApplied}`);
        }
      } catch (error) {
        console.error('Failed to optimize current session context:', error);
      }
    }

    return {
      ...storeResult,
      contextOptimized
    };
  }

  async enablePerformanceOptimization(enabled: boolean): Promise<void> {
    await this.messageStore.updateSettings({
      enablePerformanceMonitoring: enabled,
      enableLazyLoading: enabled,
      enableCompression: enabled
    });
    
    console.log(`Performance optimization ${enabled ? 'enabled' : 'disabled'}`);
  }

  async getMemoryUsage(): Promise<{
    currentSessionSize: number;
    totalMemoryUsage: number;
    cacheSize: number;
    recommendCleanup: boolean;
  }> {
    const metrics = await this.getPerformanceMetrics();
    const currentSessionSize = this.currentSession ? 
      JSON.stringify(this.currentSession).length / 1024 : 0; // KB
    
    const settings = await this.messageStore.getSettings();
    const recommendCleanup = metrics.memoryUsage > (settings.maxMemoryUsage * 0.8); // 80% threshold
    
    return {
      currentSessionSize,
      totalMemoryUsage: metrics.memoryUsage,
      cacheSize: metrics.sessionCount,
      recommendCleanup
    };
  }

  async runPerformanceCleanup(): Promise<{
    success: boolean;
    sessionsDeleted: number;
    messagesCompressed: number;
    spaceSaved: number;
    error?: string;
  }> {
    try {
      await this.messageStore.cleanup();
      
      return {
        success: true,
        sessionsDeleted: 0, // Would be tracked during cleanup
        messagesCompressed: 0, // Would be tracked during cleanup
        spaceSaved: 0 // Would be calculated during cleanup
      };
    } catch (error) {
      console.error('Performance cleanup failed:', error);
      return {
        success: false,
        sessionsDeleted: 0,
        messagesCompressed: 0,
        spaceSaved: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}