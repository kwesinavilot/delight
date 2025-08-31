// Chat History and Context Management Services
export { ConversationManager } from './ConversationManager';
export { MessageStore } from './MessageStore';
export { ContextProcessor } from './ContextProcessor';

// Performance Optimization Services
export { PerformanceOptimizer } from './PerformanceOptimizer';
export { PerformanceMonitor } from './PerformanceMonitor';
export { PerformanceManager } from './PerformanceManager';

// Re-export types for convenience
export type {
  ChatMessage,
  ChatSession,
  ConversationManager as IConversationManager,
  MessageStore as IMessageStore,
  ContextProcessor as IContextProcessor,
  ProviderMessage,
  StoredConversation,
  ConversationSettings,
  ConversationExport,
  LazyLoadedSession,
  MessageCompressionResult,
  PerformanceMetrics,
  CleanupPolicy,
  ContextOptimizationResult,
  ConversationError,
  ConversationErrorType
} from '../../types/chat';

// Performance Manager Configuration
export type { PerformanceManagerConfig, PerformanceReport } from './PerformanceManager';