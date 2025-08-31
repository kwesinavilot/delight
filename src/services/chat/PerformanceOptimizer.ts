import {
  ChatMessage,
  ChatSession,
  LazyLoadedSession,
  MessageCompressionResult,
  PerformanceMetrics,
  CleanupPolicy,
  ContextOptimizationResult,
  ConversationSettings,
  ConversationError,
  ConversationErrorType
} from '../../types/chat';

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private memoryCache = new Map<string, ChatSession>();
  private lazyLoadedSessions = new Map<string, LazyLoadedSession>();
  private performanceMetrics: PerformanceMetrics;
  private lastCleanup = 0;
  private compressionWorker: Worker | null = null;

  private constructor() {
    this.performanceMetrics = {
      memoryUsage: 0,
      sessionCount: 0,
      messageCount: 0,
      averageLoadTime: 0,
      compressionRatio: 1.0,
      cacheHitRate: 0,
      lastCleanup: Date.now()
    };
    this.initializeCompressionWorker();
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  private initializeCompressionWorker(): void {
    try {
      // Create a simple compression worker using Web Workers API
      const workerCode = `
        self.onmessage = function(e) {
          const { action, data, messageId } = e.data;
          
          if (action === 'compress') {
            try {
              // Simple compression using JSON stringify and basic compression
              const compressed = btoa(JSON.stringify(data));
              const originalSize = JSON.stringify(data).length;
              const compressedSize = compressed.length;
              
              self.postMessage({
                messageId,
                success: true,
                compressed,
                originalSize,
                compressedSize,
                compressionRatio: originalSize / compressedSize
              });
            } catch (error) {
              self.postMessage({
                messageId,
                success: false,
                error: error.message
              });
            }
          } else if (action === 'decompress') {
            try {
              const decompressed = JSON.parse(atob(data));
              self.postMessage({
                messageId,
                success: true,
                decompressed
              });
            } catch (error) {
              self.postMessage({
                messageId,
                success: false,
                error: error.message
              });
            }
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.compressionWorker = new Worker(URL.createObjectURL(blob));
    } catch (error) {
      console.warn('Failed to initialize compression worker:', error);
      this.compressionWorker = null;
    }
  }

  // Lazy loading implementation
  async loadSessionLazily(sessionId: string, messageStore: any): Promise<ChatSession> {
    const startTime = performance.now();
    
    try {
      // Check if session is already in memory cache
      if (this.memoryCache.has(sessionId)) {
        this.updateCacheHitRate(true);
        return this.memoryCache.get(sessionId)!;
      }

      this.updateCacheHitRate(false);

      // Load session from storage
      const session = await messageStore.getSession(sessionId);
      if (!session) {
        throw new ConversationError(
          ConversationErrorType.SESSION_NOT_FOUND,
          `Session ${sessionId} not found`
        );
      }

      // Check if we need to decompress messages
      const decompressedSession = await this.decompressSessionMessages(session);

      // Add to memory cache with size limit check
      await this.addToMemoryCache(sessionId, decompressedSession);

      // Update performance metrics
      const loadTime = performance.now() - startTime;
      this.updateLoadTimeMetrics(loadTime);

      return decompressedSession;
    } catch (error) {
      console.error('Failed to load session lazily:', error);
      throw error;
    }
  }

  private async addToMemoryCache(sessionId: string, session: ChatSession): Promise<void> {
    // Check memory usage before adding
    const sessionSize = this.estimateSessionSize(session);
    const currentMemoryUsage = this.calculateMemoryUsage();
    
    // If adding this session would exceed memory limit, clean up cache
    if (currentMemoryUsage + sessionSize > this.getMaxMemoryUsage()) {
      await this.cleanupMemoryCache();
    }

    this.memoryCache.set(sessionId, session);
    this.updateMemoryMetrics();
  }

  private estimateSessionSize(session: ChatSession): number {
    // Rough estimation of session size in bytes
    const jsonString = JSON.stringify(session);
    return jsonString.length * 2; // Rough estimate for UTF-16 encoding
  }

  private calculateMemoryUsage(): number {
    let totalSize = 0;
    for (const session of this.memoryCache.values()) {
      totalSize += this.estimateSessionSize(session);
    }
    return totalSize / (1024 * 1024); // Convert to MB
  }

  private getMaxMemoryUsage(): number {
    // Default to 50MB if not configured
    return 50;
  }

  private async cleanupMemoryCache(): Promise<void> {
    // Remove least recently used sessions
    const sessions = Array.from(this.memoryCache.entries());
    sessions.sort((a, b) => a[1].lastUpdated - b[1].lastUpdated);
    
    // Remove oldest 25% of sessions
    const toRemove = Math.ceil(sessions.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(sessions[i][0]);
    }

    this.updateMemoryMetrics();
  }

  // Message compression implementation
  async compressMessage(message: ChatMessage): Promise<MessageCompressionResult> {
    if (!this.compressionWorker) {
      return this.fallbackCompression(message);
    }

    return new Promise((resolve) => {
      const messageId = `compress_${Date.now()}_${Math.random()}`;
      
      const timeout = setTimeout(() => {
        resolve(this.fallbackCompression(message));
      }, 5000); // 5 second timeout

      const handleMessage = (e: MessageEvent) => {
        if (e.data.messageId === messageId) {
          clearTimeout(timeout);
          this.compressionWorker!.removeEventListener('message', handleMessage);
          
          if (e.data.success) {
            resolve({
              originalSize: e.data.originalSize,
              compressedSize: e.data.compressedSize,
              compressionRatio: e.data.compressionRatio,
              success: true
            });
          } else {
            resolve({
              originalSize: 0,
              compressedSize: 0,
              compressionRatio: 1,
              success: false,
              error: e.data.error
            });
          }
        }
      };

      if (this.compressionWorker) {
        this.compressionWorker.addEventListener('message', handleMessage);
        this.compressionWorker.postMessage({
          action: 'compress',
          data: message,
          messageId
        });
      }
    });
  }

  private fallbackCompression(message: ChatMessage): MessageCompressionResult {
    try {
      const original = JSON.stringify(message);
      const compressed = btoa(original);
      
      return {
        originalSize: original.length,
        compressedSize: compressed.length,
        compressionRatio: original.length / compressed.length,
        success: true
      };
    } catch (error) {
      return {
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 1,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown compression error'
      };
    }
  }

  async decompressMessage(compressedData: string): Promise<ChatMessage> {
    if (!this.compressionWorker) {
      return this.fallbackDecompression(compressedData);
    }

    return new Promise((resolve, reject) => {
      const messageId = `decompress_${Date.now()}_${Math.random()}`;
      
      const timeout = setTimeout(() => {
        resolve(this.fallbackDecompression(compressedData));
      }, 5000);

      const handleMessage = (e: MessageEvent) => {
        if (e.data.messageId === messageId) {
          clearTimeout(timeout);
          this.compressionWorker!.removeEventListener('message', handleMessage);
          
          if (e.data.success) {
            resolve(e.data.decompressed);
          } else {
            reject(new Error(e.data.error));
          }
        }
      };

      if (this.compressionWorker) {
        this.compressionWorker.addEventListener('message', handleMessage);
        this.compressionWorker.postMessage({
          action: 'decompress',
          data: compressedData,
          messageId
        });
      }
    });
  }

  private fallbackDecompression(compressedData: string): ChatMessage {
    try {
      const decompressed = JSON.parse(atob(compressedData));
      return decompressed;
    } catch (error) {
      throw new ConversationError(
        ConversationErrorType.COMPRESSION_ERROR,
        'Failed to decompress message',
        error
      );
    }
  }

  private async decompressSessionMessages(session: ChatSession): Promise<ChatSession> {
    const decompressedMessages: ChatMessage[] = [];
    
    for (const message of session.messages) {
      if (message.metadata?.compressed) {
        try {
          const decompressed = await this.decompressMessage(message.content);
          decompressedMessages.push({
            ...decompressed,
            metadata: {
              ...decompressed.metadata,
              compressed: false
            }
          });
        } catch (error) {
          console.error('Failed to decompress message:', error);
          // Keep original message if decompression fails
          decompressedMessages.push(message);
        }
      } else {
        decompressedMessages.push(message);
      }
    }

    return {
      ...session,
      messages: decompressedMessages
    };
  }

  // Automatic cleanup policies
  async applyCleanupPolicy(
    sessions: ChatSession[], 
    policy: CleanupPolicy,
    messageStore: any
  ): Promise<{
    sessionsDeleted: number;
    messagesCompressed: number;
    spaceSaved: number;
  }> {
    let sessionsDeleted = 0;
    let messagesCompressed = 0;
    let spaceSaved = 0;

    const now = Date.now();
    const maxAgeMs = policy.maxAge * 24 * 60 * 60 * 1000;
    const compressionAgeMs = policy.compressionAge * 24 * 60 * 60 * 1000;

    // Sort sessions by last updated (oldest first)
    const sortedSessions = [...sessions].sort((a, b) => a.lastUpdated - b.lastUpdated);

    // Delete old sessions
    for (const session of sortedSessions) {
      if (now - session.lastUpdated > maxAgeMs) {
        try {
          await messageStore.deleteSession(session.id);
          sessionsDeleted++;
          spaceSaved += this.estimateSessionSize(session);
        } catch (error) {
          console.error(`Failed to delete session ${session.id}:`, error);
        }
      }
    }

    // Compress old messages in remaining sessions
    const remainingSessions = sortedSessions.slice(sessionsDeleted);
    for (const session of remainingSessions) {
      let sessionModified = false;
      
      for (const message of session.messages) {
        if (
          !message.metadata?.compressed &&
          now - message.timestamp > compressionAgeMs
        ) {
          try {
            const compressionResult = await this.compressMessage(message);
            if (compressionResult.success) {
              message.content = btoa(JSON.stringify(message));
              message.metadata = {
                ...message.metadata,
                compressed: true,
                originalSize: compressionResult.originalSize
              };
              messagesCompressed++;
              spaceSaved += compressionResult.originalSize - compressionResult.compressedSize;
              sessionModified = true;
            }
          } catch (error) {
            console.error(`Failed to compress message ${message.id}:`, error);
          }
        }
      }

      if (sessionModified) {
        try {
          await messageStore.updateSession(session);
        } catch (error) {
          console.error(`Failed to update session ${session.id}:`, error);
        }
      }
    }

    // Enforce session count limit
    if (remainingSessions.length > policy.maxSessions) {
      const excessSessions = remainingSessions.slice(0, remainingSessions.length - policy.maxSessions);
      for (const session of excessSessions) {
        try {
          await messageStore.deleteSession(session.id);
          sessionsDeleted++;
          spaceSaved += this.estimateSessionSize(session);
        } catch (error) {
          console.error(`Failed to delete excess session ${session.id}:`, error);
        }
      }
    }

    this.lastCleanup = now;
    this.updatePerformanceMetrics();

    return {
      sessionsDeleted,
      messagesCompressed,
      spaceSaved: Math.round(spaceSaved / 1024) // Convert to KB
    };
  }

  // Context processing optimization
  async optimizeContextForLargeHistory(
    messages: ChatMessage[],
    maxTokens: number,
    contextProcessor: any
  ): Promise<ContextOptimizationResult> {
    const startTime = performance.now();
    const originalTokens = contextProcessor.calculateTokenCount(messages);
    
    if (originalTokens <= maxTokens) {
      return {
        originalTokens,
        optimizedTokens: originalTokens,
        messagesRemoved: 0,
        compressionApplied: false,
        processingTime: performance.now() - startTime
      };
    }

    let optimizedMessages = [...messages];
    let messagesRemoved = 0;
    let compressionApplied = false;

    // Strategy 1: Remove old non-essential messages
    const essentialMessages = optimizedMessages.filter(m => 
      m.role === 'system' || 
      m.metadata?.isSummary ||
      (Date.now() - m.timestamp) < (24 * 60 * 60 * 1000) // Last 24 hours
    );

    const nonEssentialMessages = optimizedMessages.filter(m => 
      !essentialMessages.includes(m)
    );

    // Keep recent non-essential messages that fit in the token budget
    let currentTokens = contextProcessor.calculateTokenCount(essentialMessages);
    const recentNonEssential: ChatMessage[] = [];

    for (let i = nonEssentialMessages.length - 1; i >= 0; i--) {
      const message = nonEssentialMessages[i];
      const messageTokens = contextProcessor.calculateTokenCount([message]);
      
      if (currentTokens + messageTokens <= maxTokens) {
        recentNonEssential.unshift(message);
        currentTokens += messageTokens;
      } else {
        messagesRemoved++;
      }
    }

    optimizedMessages = [...essentialMessages, ...recentNonEssential];
    
    // Strategy 2: Compress message content if still too large
    currentTokens = contextProcessor.calculateTokenCount(optimizedMessages);
    if (currentTokens > maxTokens) {
      const compressedMessages: ChatMessage[] = [];
      
      for (const message of optimizedMessages) {
        if (message.role === 'system' || message.metadata?.isSummary) {
          compressedMessages.push(message);
          continue;
        }

        // Try to compress long messages
        if (message.content.length > 500) {
          const compressedContent = this.compressMessageContent(message.content, 0.7);
          const compressedMessage: ChatMessage = {
            ...message,
            content: compressedContent,
            metadata: {
              ...message.metadata,
              compressed: true,
              originalSize: message.content.length
            }
          };
          compressedMessages.push(compressedMessage);
          compressionApplied = true;
        } else {
          compressedMessages.push(message);
        }
      }

      optimizedMessages = compressedMessages;
    }

    const finalTokens = contextProcessor.calculateTokenCount(optimizedMessages);
    const processingTime = performance.now() - startTime;

    return {
      originalTokens,
      optimizedTokens: finalTokens,
      messagesRemoved,
      compressionApplied,
      processingTime
    };
  }

  private compressMessageContent(content: string, ratio: number): string {
    // Simple content compression by removing redundant whitespace and shortening
    const targetLength = Math.floor(content.length * ratio);
    
    if (content.length <= targetLength) {
      return content;
    }

    // Remove extra whitespace
    let compressed = content.replace(/\s+/g, ' ').trim();
    
    if (compressed.length <= targetLength) {
      return compressed;
    }

    // Truncate with ellipsis
    return compressed.substring(0, targetLength - 3) + '...';
  }

  // Performance metrics and monitoring
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  private updateMemoryMetrics(): void {
    this.performanceMetrics.memoryUsage = this.calculateMemoryUsage();
    this.performanceMetrics.sessionCount = this.memoryCache.size;
    
    let totalMessages = 0;
    for (const session of this.memoryCache.values()) {
      totalMessages += session.messages.length;
    }
    this.performanceMetrics.messageCount = totalMessages;
  }

  private updateLoadTimeMetrics(loadTime: number): void {
    // Simple moving average
    const alpha = 0.1;
    this.performanceMetrics.averageLoadTime = 
      (1 - alpha) * this.performanceMetrics.averageLoadTime + alpha * loadTime;
  }

  private updateCacheHitRate(hit: boolean): void {
    // Simple moving average for cache hit rate
    const alpha = 0.05;
    const hitValue = hit ? 1 : 0;
    this.performanceMetrics.cacheHitRate = 
      (1 - alpha) * this.performanceMetrics.cacheHitRate + alpha * hitValue;
  }

  private updatePerformanceMetrics(): void {
    this.performanceMetrics.lastCleanup = this.lastCleanup;
    this.updateMemoryMetrics();
  }

  // Utility methods
  shouldRunCleanup(settings: ConversationSettings): boolean {
    const now = Date.now();
    const cleanupInterval = settings.cleanupFrequency * 60 * 60 * 1000; // Convert hours to ms
    return (now - this.lastCleanup) > cleanupInterval;
  }

  createCleanupPolicy(settings: ConversationSettings): CleanupPolicy {
    return {
      maxAge: settings.autoCleanupDays,
      maxSessions: settings.maxConcurrentSessions || 50,
      maxMessages: settings.maxHistoryLength * 10, // 10x the per-session limit
      compressionAge: settings.compressionThreshold || 7,
      enableAutoCleanup: true
    };
  }

  clearMemoryCache(): void {
    this.memoryCache.clear();
    this.lazyLoadedSessions.clear();
    this.updateMemoryMetrics();
  }

  // Cleanup resources
  destroy(): void {
    this.clearMemoryCache();
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
      this.compressionWorker = null;
    }
  }
}