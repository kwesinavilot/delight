// Chat History and Context Management Types

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  provider?: string; // Which AI provider generated this response
  metadata?: {
    tokenCount?: number;
    model?: string;
    processingTime?: number;
    compressed?: boolean;
    originalSize?: number;
    truncated?: boolean;
    isSummary?: boolean;
    originalMessageCount?: number;
    isConversionNotice?: boolean;
    fromProvider?: string;
    toProvider?: string;
    conversionFailed?: boolean;
    originalProvider?: string;
    convertedFrom?: string;
    convertedAt?: number;
  };
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  lastUpdated: number;
  provider: string;
  title?: string; // Auto-generated or user-defined
  metadata?: {
    providerSwitches?: Array<{
      from: string;
      to: string;
      timestamp: number;
      contextConverted: boolean;
    }>;
    messageCount?: number;
    compressedMessageCount?: number;
    totalTokens?: number;
    lastCleanup?: number;
    performanceMetrics?: {
      averageLoadTime?: number;
      averageTokenCount?: number;
      compressionRatio?: number;
    };
  };
}

export interface ConversationManager {
  // Session management
  getCurrentSession(): ChatSession;
  createNewSession(provider?: string): Promise<ChatSession>;
  clearCurrentSession(): Promise<void>;
  switchToSession(sessionId: string): Promise<void>;
  
  // Message handling
  addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage>;
  getConversationHistory(): ChatMessage[];
  getContextForProvider(provider: string): Promise<ProviderMessage[]>;
  
  // History management
  exportConversation(): Promise<string>;
  importConversation(data: string): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
  
  // Session management
  getAllSessions(): Promise<ChatSession[]>;
  deleteSession(sessionId: string): Promise<void>;
}

export interface ProviderMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ContextProcessor {
  formatForProvider(messages: ChatMessage[], provider: string): ProviderMessage[];
  optimizeContext(messages: ChatMessage[], maxTokens: number): ChatMessage[];
  calculateTokenCount(messages: ChatMessage[]): number;
  truncateContext(messages: ChatMessage[], maxTokens: number): ChatMessage[];
}

export interface StoredConversation {
  sessions: Record<string, ChatSession>;
  currentSessionId: string;
  settings: ConversationSettings;
}

export interface ConversationSettings {
  maxHistoryLength: number;
  autoCleanupDays: number;
  preserveOnProviderSwitch: boolean;
  maxTokensPerContext: number;
  enableAutoTitles: boolean;
  providerSwitchBehavior: 'ask' | 'preserve' | 'new_session';
  enableContextConversion: boolean;
  warnOnLargeContextSwitch: boolean;
  // Performance optimization settings
  enableLazyLoading: boolean;
  lazyLoadThreshold: number; // Number of messages before lazy loading kicks in
  enableCompression: boolean;
  compressionThreshold: number; // Message age in days before compression
  maxMemoryUsage: number; // Max memory usage in MB
  enablePerformanceMonitoring: boolean;
  cleanupFrequency: number; // Hours between automatic cleanup runs
  maxConcurrentSessions: number; // Max sessions to keep in memory
}

export interface MessageStore {
  // Session operations
  createSession(provider: string): Promise<ChatSession>;
  getSession(sessionId: string): Promise<ChatSession | null>;
  getAllSessions(): Promise<ChatSession[]>;
  updateSession(session: ChatSession): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  
  // Message operations
  addMessage(sessionId: string, message: ChatMessage): Promise<void>;
  deleteMessage(sessionId: string, messageId: string): Promise<void>;
  
  // Settings and cleanup
  getSettings(): Promise<ConversationSettings>;
  updateSettings(settings: Partial<ConversationSettings>): Promise<void>;
  cleanup(): Promise<void>;
  
  // Import/Export
  exportData(): Promise<string>;
  importData(data: string): Promise<void>;
}

// Utility types for conversation management
export interface ConversationExport {
  version: string;
  exportDate: number;
  sessions: ChatSession[];
  settings: ConversationSettings;
}

export interface ConversationStats {
  totalSessions: number;
  totalMessages: number;
  oldestSession: number;
  newestSession: number;
  storageUsed: number;
}

// Performance optimization interfaces
export interface LazyLoadedSession {
  id: string;
  metadata: ChatSession['metadata'];
  createdAt: number;
  lastUpdated: number;
  provider: string;
  title?: string;
  messageCount: number;
  isLoaded: boolean;
}

export interface MessageCompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  success: boolean;
  error?: string;
}

export interface PerformanceMetrics {
  memoryUsage: number; // MB
  sessionCount: number;
  messageCount: number;
  averageLoadTime: number; // ms
  compressionRatio: number;
  cacheHitRate: number;
  lastCleanup: number;
}

export interface CleanupPolicy {
  maxAge: number; // days
  maxSessions: number;
  maxMessages: number;
  compressionAge: number; // days
  enableAutoCleanup: boolean;
}

export interface ContextOptimizationResult {
  originalTokens: number;
  optimizedTokens: number;
  messagesRemoved: number;
  compressionApplied: boolean;
  processingTime: number;
}

// Error types for conversation management
export enum ConversationErrorType {
  STORAGE_ERROR = 'STORAGE_ERROR',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
  CONTEXT_TOO_LARGE = 'CONTEXT_TOO_LARGE',
  IMPORT_ERROR = 'IMPORT_ERROR',
  EXPORT_ERROR = 'EXPORT_ERROR',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  COMPRESSION_ERROR = 'COMPRESSION_ERROR',
  PERFORMANCE_ERROR = 'PERFORMANCE_ERROR'
}

export class ConversationError extends Error {
  constructor(
    public type: ConversationErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ConversationError';
  }
}