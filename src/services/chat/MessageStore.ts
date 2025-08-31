import { 
  ChatSession, 
  ChatMessage, 
  MessageStore as IMessageStore, 
  StoredConversation, 
  ConversationSettings,
  ConversationError,
  ConversationErrorType,
  ConversationExport,
  PerformanceMetrics,

} from '../../types/chat';
import { PerformanceOptimizer } from './PerformanceOptimizer';

export class MessageStore implements IMessageStore {
  private static instance: MessageStore;
  private readonly STORAGE_KEY = 'chatConversations';
  private readonly SETTINGS_KEY = 'conversationSettings';
  private cache: StoredConversation | null = null;
  private performanceOptimizer: PerformanceOptimizer;

  private constructor() {
    this.performanceOptimizer = PerformanceOptimizer.getInstance();
  }

  static getInstance(): MessageStore {
    if (!MessageStore.instance) {
      MessageStore.instance = new MessageStore();
    }
    return MessageStore.instance;
  }

  private getDefaultSettings(): ConversationSettings {
    return {
      maxHistoryLength: 100, // Maximum messages per session
      autoCleanupDays: 30, // Auto-delete sessions older than 30 days
      preserveOnProviderSwitch: true,
      maxTokensPerContext: 4000, // Conservative token limit for context
      enableAutoTitles: true,
      providerSwitchBehavior: 'ask', // Ask user what to do when switching providers
      enableContextConversion: true, // Enable automatic context format conversion
      warnOnLargeContextSwitch: true, // Warn when switching with large contexts
      // Performance optimization settings
      enableLazyLoading: true,
      lazyLoadThreshold: 50, // Start lazy loading after 50 messages
      enableCompression: true,
      compressionThreshold: 7, // Compress messages older than 7 days
      maxMemoryUsage: 50, // 50MB max memory usage
      enablePerformanceMonitoring: true,
      cleanupFrequency: 24, // Run cleanup every 24 hours
      maxConcurrentSessions: 20 // Keep max 20 sessions in memory
    };
  }

  private async loadData(): Promise<StoredConversation> {
    if (this.cache) {
      return this.cache;
    }

    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEY]);
      const data = result[this.STORAGE_KEY];

      if (!data) {
        // Initialize with empty data
        const newCache: StoredConversation = {
          sessions: {},
          currentSessionId: '',
          settings: this.getDefaultSettings()
        };
        this.cache = newCache;
        await this.saveData();
        return newCache;
      }

      this.cache = data;
      return data;
    } catch (error) {
      console.error('Failed to load conversation data:', error);
      throw new ConversationError(
        ConversationErrorType.STORAGE_ERROR,
        'Failed to load conversation data',
        error
      );
    }
  }

  private async saveData(): Promise<void> {
    if (!this.cache) return;

    try {
      await chrome.storage.local.set({
        [this.STORAGE_KEY]: this.cache
      });
    } catch (error) {
      console.error('Failed to save conversation data:', error);
      throw new ConversationError(
        ConversationErrorType.STORAGE_ERROR,
        'Failed to save conversation data',
        error
      );
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionTitle(messages: ChatMessage[]): string {
    if (messages.length === 0) return 'New Conversation';
    
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) return 'New Conversation';
    
    // Take first 50 characters of the first user message
    const title = firstUserMessage.content.substring(0, 50);
    return title.length < firstUserMessage.content.length ? `${title}...` : title;
  }

  async createSession(provider: string): Promise<ChatSession> {
    const data = await this.loadData();
    
    const session: ChatSession = {
      id: this.generateId(),
      messages: [],
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      provider,
      title: 'New Conversation'
    };

    data.sessions[session.id] = session;
    data.currentSessionId = session.id;
    
    await this.saveData();
    return session;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const settings = await this.getSettings();
    
    // Use lazy loading if enabled and session is large
    if (settings.enableLazyLoading) {
      try {
        return await this.performanceOptimizer.loadSessionLazily(sessionId, this);
      } catch (error) {
        console.warn('Lazy loading failed, falling back to direct load:', error);
      }
    }

    const data = await this.loadData();
    return data.sessions[sessionId] || null;
  }

  async getAllSessions(): Promise<ChatSession[]> {
    const data = await this.loadData();
    return Object.values(data.sessions).sort((a, b) => b.lastUpdated - a.lastUpdated);
  }

  async updateSession(session: ChatSession): Promise<void> {
    const data = await this.loadData();
    
    if (!data.sessions[session.id]) {
      throw new ConversationError(
        ConversationErrorType.SESSION_NOT_FOUND,
        `Session ${session.id} not found`
      );
    }

    session.lastUpdated = Date.now();
    
    // Auto-generate title if enabled and no custom title set
    if (data.settings.enableAutoTitles && session.title === 'New Conversation' && session.messages.length > 0) {
      session.title = this.generateSessionTitle(session.messages);
    }

    data.sessions[session.id] = session;
    await this.saveData();
  }

  async deleteSession(sessionId: string): Promise<void> {
    const data = await this.loadData();
    
    if (!data.sessions[sessionId]) {
      throw new ConversationError(
        ConversationErrorType.SESSION_NOT_FOUND,
        `Session ${sessionId} not found`
      );
    }

    delete data.sessions[sessionId];
    
    // If this was the current session, clear it
    if (data.currentSessionId === sessionId) {
      data.currentSessionId = '';
    }

    await this.saveData();
  }

  async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      throw new ConversationError(
        ConversationErrorType.SESSION_NOT_FOUND,
        `Session ${sessionId} not found`
      );
    }

    session.messages.push(message);
    
    // Enforce max history length
    const data = await this.loadData();
    if (session.messages.length > data.settings.maxHistoryLength) {
      // Keep system messages and recent messages
      const systemMessages = session.messages.filter(m => m.role === 'system');
      const recentMessages = session.messages
        .filter(m => m.role !== 'system')
        .slice(-data.settings.maxHistoryLength + systemMessages.length);
      
      session.messages = [...systemMessages, ...recentMessages];
    }

    await this.updateSession(session);
  }

  async deleteMessage(sessionId: string, messageId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      throw new ConversationError(
        ConversationErrorType.SESSION_NOT_FOUND,
        `Session ${sessionId} not found`
      );
    }

    const messageIndex = session.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      throw new ConversationError(
        ConversationErrorType.MESSAGE_NOT_FOUND,
        `Message ${messageId} not found`
      );
    }

    session.messages.splice(messageIndex, 1);
    await this.updateSession(session);
  }

  async getSettings(): Promise<ConversationSettings> {
    try {
      const result = await chrome.storage.local.get([this.SETTINGS_KEY]);
      return result[this.SETTINGS_KEY] || this.getDefaultSettings();
    } catch (error) {
      console.error('Failed to load conversation settings:', error);
      return this.getDefaultSettings();
    }
  }

  async updateSettings(settings: Partial<ConversationSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      
      await chrome.storage.local.set({
        [this.SETTINGS_KEY]: newSettings
      });

      // Update cache if loaded
      if (this.cache) {
        this.cache.settings = newSettings;
      }
    } catch (error) {
      console.error('Failed to save conversation settings:', error);
      throw new ConversationError(
        ConversationErrorType.STORAGE_ERROR,
        'Failed to save conversation settings',
        error
      );
    }
  }

  async cleanup(): Promise<void> {
    const settings = await this.getSettings();
    
    // Check if we should run cleanup based on frequency
    if (!this.performanceOptimizer.shouldRunCleanup(settings)) {
      return;
    }

    const data = await this.loadData();
    const sessions = Object.values(data.sessions);
    
    // Create cleanup policy from settings
    const cleanupPolicy = this.performanceOptimizer.createCleanupPolicy(settings);
    
    try {
      // Apply advanced cleanup with compression and performance optimization
      const result = await this.performanceOptimizer.applyCleanupPolicy(
        sessions,
        cleanupPolicy,
        this
      );

      console.log(`Cleanup completed: ${result.sessionsDeleted} sessions deleted, ${result.messagesCompressed} messages compressed, ${result.spaceSaved}KB saved`);
      
      // Reload data after cleanup
      this.cache = null;
      await this.loadData();
    } catch (error) {
      console.error('Advanced cleanup failed, falling back to basic cleanup:', error);
      
      // Fallback to basic cleanup
      const cutoffTime = Date.now() - (settings.autoCleanupDays * 24 * 60 * 60 * 1000);
      let deletedCount = 0;
      
      for (const [sessionId, session] of Object.entries(data.sessions)) {
        if (session.lastUpdated < cutoffTime) {
          delete data.sessions[sessionId];
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`Basic cleanup: ${deletedCount} old conversation sessions deleted`);
        await this.saveData();
      }
    }
  }

  async exportData(): Promise<string> {
    try {
      const data = await this.loadData();
      const settings = await this.getSettings();
      
      const exportData: ConversationExport = {
        version: '1.0.0',
        exportDate: Date.now(),
        sessions: Object.values(data.sessions),
        settings
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export conversation data:', error);
      throw new ConversationError(
        ConversationErrorType.EXPORT_ERROR,
        'Failed to export conversation data',
        error
      );
    }
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const importData: ConversationExport = JSON.parse(jsonData);
      
      // Validate import data structure
      if (!importData.sessions || !Array.isArray(importData.sessions)) {
        throw new Error('Invalid import data format');
      }

      const data = await this.loadData();
      
      // Import sessions
      for (const session of importData.sessions) {
        // Generate new ID to avoid conflicts
        const newId = this.generateId();
        const importedSession: ChatSession = {
          ...session,
          id: newId,
          lastUpdated: Date.now()
        };
        
        data.sessions[newId] = importedSession;
      }

      // Import settings if provided
      if (importData.settings) {
        data.settings = { ...data.settings, ...importData.settings };
      }

      await this.saveData();
      console.log(`Imported ${importData.sessions.length} conversation sessions`);
    } catch (error) {
      console.error('Failed to import conversation data:', error);
      throw new ConversationError(
        ConversationErrorType.IMPORT_ERROR,
        'Failed to import conversation data',
        error
      );
    }
  }

  // Utility methods
  async getCurrentSessionId(): Promise<string> {
    const data = await this.loadData();
    return data.currentSessionId;
  }

  async setCurrentSessionId(sessionId: string): Promise<void> {
    const data = await this.loadData();
    data.currentSessionId = sessionId;
    await this.saveData();
  }

  async getStorageStats(): Promise<{ sessions: number; messages: number; storageUsed: number }> {
    const data = await this.loadData();
    const sessions = Object.values(data.sessions);
    const totalMessages = sessions.reduce((sum, session) => sum + session.messages.length, 0);
    
    // Estimate storage usage (rough calculation)
    const dataSize = JSON.stringify(data).length;
    
    return {
      sessions: sessions.length,
      messages: totalMessages,
      storageUsed: dataSize
    };
  }

  // Performance monitoring methods
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return this.performanceOptimizer.getPerformanceMetrics();
  }

  async optimizePerformance(): Promise<{
    memoryFreed: number;
    sessionsCompressed: number;
    cacheCleared: boolean;
  }> {
    const initialMetrics = await this.getPerformanceMetrics();
    
    // Clear memory cache to free up memory
    this.performanceOptimizer.clearMemoryCache();
    
    // Run cleanup
    await this.cleanup();
    
    const finalMetrics = await this.getPerformanceMetrics();
    
    return {
      memoryFreed: initialMetrics.memoryUsage - finalMetrics.memoryUsage,
      sessionsCompressed: 0, // This would be tracked during cleanup
      cacheCleared: true
    };
  }

  async enablePerformanceMonitoring(enabled: boolean): Promise<void> {
    await this.updateSettings({
      enablePerformanceMonitoring: enabled
    });
  }

  // Clear cache (useful for testing or forcing reload)
  clearCache(): void {
    this.cache = null;
    this.performanceOptimizer.clearMemoryCache();
  }
}