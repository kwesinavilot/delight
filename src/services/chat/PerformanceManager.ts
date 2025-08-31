import {
  PerformanceMetrics,
  // ConversationSettings,
  // ChatSession,
  // ChatMessage,
  // ContextOptimizationResult,
  // CleanupPolicy
} from '../../types/chat';
import { PerformanceOptimizer } from './PerformanceOptimizer';
import { PerformanceMonitor } from './PerformanceMonitor';
import { MessageStore } from './MessageStore';
import { ConversationManager } from './ConversationManager';
import { ContextProcessor } from './ContextProcessor';

export interface PerformanceManagerConfig {
  enableAutoOptimization: boolean;
  enableMonitoring: boolean;
  monitoringInterval: number; // minutes
  autoCleanupThreshold: number; // memory usage percentage
  aggressiveOptimization: boolean;
}

export interface PerformanceReport {
  timestamp: number;
  metrics: PerformanceMetrics;
  memoryAnalysis: {
    usage: number;
    limit: number;
    utilizationPercentage: number;
    recommendation: 'good' | 'warning' | 'critical';
  };
  performanceAnalysis: {
    loadTimeStatus: 'good' | 'slow' | 'critical';
    cacheEfficiency: 'good' | 'poor' | 'critical';
    compressionRatio: number;
    overallScore: number; // 0-100
  };
  recommendations: string[];
  actionItems: Array<{
    priority: 'low' | 'medium' | 'high';
    action: string;
    description: string;
    automated: boolean;
  }>;
}

export class PerformanceManager {
  private static instance: PerformanceManager;
  private config: PerformanceManagerConfig;
  private optimizer: PerformanceOptimizer;
  private monitor: PerformanceMonitor;
  private messageStore: MessageStore;
  private conversationManager: ConversationManager;
  private contextProcessor: ContextProcessor;
  private autoOptimizationEnabled = false;

  private constructor() {
    this.config = {
      enableAutoOptimization: true,
      enableMonitoring: true,
      monitoringInterval: 30,
      autoCleanupThreshold: 80,
      aggressiveOptimization: false
    };

    this.optimizer = PerformanceOptimizer.getInstance();
    this.monitor = PerformanceMonitor.getInstance();
    this.messageStore = MessageStore.getInstance();
    this.conversationManager = ConversationManager.getInstance();
    this.contextProcessor = new ContextProcessor();
  }

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  async initialize(config?: Partial<PerformanceManagerConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Start monitoring if enabled
    if (this.config.enableMonitoring) {
      await this.monitor.startMonitoring(this.config.monitoringInterval);
    }

    // Enable auto-optimization if configured
    if (this.config.enableAutoOptimization) {
      await this.enableAutoOptimization();
    }

    console.log('PerformanceManager initialized with config:', this.config);
  }

  async enableAutoOptimization(): Promise<void> {
    if (this.autoOptimizationEnabled) return;

    this.autoOptimizationEnabled = true;
    
    // Set up periodic auto-optimization
    setInterval(async () => {
      try {
        await this.runAutoOptimization();
      } catch (error) {
        console.error('Auto-optimization failed:', error);
      }
    }, 60 * 60 * 1000); // Every hour

    console.log('Auto-optimization enabled');
  }

  async disableAutoOptimization(): Promise<void> {
    this.autoOptimizationEnabled = false;
    console.log('Auto-optimization disabled');
  }

  private async runAutoOptimization(): Promise<void> {
    const metrics = await this.optimizer.getPerformanceMetrics();
    const settings = await this.messageStore.getSettings();
    
    const memoryUtilization = (metrics.memoryUsage / settings.maxMemoryUsage) * 100;
    
    // Only run if memory usage exceeds threshold
    if (memoryUtilization > this.config.autoCleanupThreshold) {
      console.log(`Auto-optimization triggered: ${memoryUtilization.toFixed(1)}% memory usage`);
      
      const result = await this.optimizePerformance({
        clearCache: true,
        runCleanup: true,
        optimizeContext: true,
        compressMessages: true
      });

      console.log('Auto-optimization completed:', result);
    }
  }

  async optimizePerformance(options: {
    clearCache?: boolean;
    runCleanup?: boolean;
    optimizeContext?: boolean;
    compressMessages?: boolean;
    aggressiveMode?: boolean;
  } = {}): Promise<{
    success: boolean;
    memoryFreed: number;
    sessionsOptimized: number;
    messagesCompressed: number;
    contextOptimized: boolean;
    processingTime: number;
    error?: string;
  }> {
    const startTime = performance.now();
    let memoryFreed = 0;
    let sessionsOptimized = 0;
    let messagesCompressed = 0;
    let contextOptimized = false;

    try {
      const initialMetrics = await this.optimizer.getPerformanceMetrics();

      // Clear memory cache if requested
      if (options.clearCache) {
        this.optimizer.clearMemoryCache();
        console.log('Memory cache cleared');
      }

      // Run cleanup if requested
      if (options.runCleanup) {
        await this.messageStore.cleanup();
        console.log('Storage cleanup completed');
      }

      // Optimize current context if requested
      if (options.optimizeContext) {
        const currentSession = this.conversationManager.getCurrentSessionInfo();
        if (currentSession && currentSession.messageCount > 20) {
          try {
            const session = this.conversationManager.getCurrentSession();
            const settings = await this.messageStore.getSettings();
            
            const optimizationResult = await this.contextProcessor.optimizeContextAsync(
              session.messages,
              settings.maxTokensPerContext
            );

            if (optimizationResult.messagesRemoved > 0 || optimizationResult.compressionApplied) {
              contextOptimized = true;
              console.log(`Context optimized: ${optimizationResult.messagesRemoved} messages removed`);
            }
          } catch (error) {
            console.error('Context optimization failed:', error);
          }
        }
      }

      // Compress old messages if requested
      if (options.compressMessages) {
        const sessions = await this.conversationManager.getAllSessions();
        const settings = await this.messageStore.getSettings();
        
        if (settings.enableCompression) {
          const cleanupPolicy = this.optimizer.createCleanupPolicy(settings);
          const result = await this.optimizer.applyCleanupPolicy(sessions, cleanupPolicy, this.messageStore);
          messagesCompressed = result.messagesCompressed;
          console.log(`Compressed ${messagesCompressed} messages`);
        }
      }

      const finalMetrics = await this.optimizer.getPerformanceMetrics();
      memoryFreed = Math.max(0, initialMetrics.memoryUsage - finalMetrics.memoryUsage);

      const processingTime = performance.now() - startTime;

      return {
        success: true,
        memoryFreed,
        sessionsOptimized,
        messagesCompressed,
        contextOptimized,
        processingTime
      };

    } catch (error) {
      console.error('Performance optimization failed:', error);
      return {
        success: false,
        memoryFreed: 0,
        sessionsOptimized: 0,
        messagesCompressed: 0,
        contextOptimized: false,
        processingTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generatePerformanceReport(): Promise<PerformanceReport> {
    const metrics = await this.optimizer.getPerformanceMetrics();
    const settings = await this.messageStore.getSettings();
    const monitorReport = await this.monitor.getPerformanceReport();

    // Memory analysis
    const memoryUtilization = (metrics.memoryUsage / settings.maxMemoryUsage) * 100;
    let memoryRecommendation: 'good' | 'warning' | 'critical';
    
    if (memoryUtilization < 60) {
      memoryRecommendation = 'good';
    } else if (memoryUtilization < 85) {
      memoryRecommendation = 'warning';
    } else {
      memoryRecommendation = 'critical';
    }

    // Performance analysis
    let loadTimeStatus: 'good' | 'slow' | 'critical';
    if (metrics.averageLoadTime < 300) {
      loadTimeStatus = 'good';
    } else if (metrics.averageLoadTime < 1000) {
      loadTimeStatus = 'slow';
    } else {
      loadTimeStatus = 'critical';
    }

    let cacheEfficiency: 'good' | 'poor' | 'critical';
    if (metrics.cacheHitRate > 0.7) {
      cacheEfficiency = 'good';
    } else if (metrics.cacheHitRate > 0.4) {
      cacheEfficiency = 'poor';
    } else {
      cacheEfficiency = 'critical';
    }

    // Calculate overall performance score
    let overallScore = 100;
    overallScore -= Math.max(0, (memoryUtilization - 60) * 2); // Penalty for high memory usage
    overallScore -= Math.max(0, (metrics.averageLoadTime - 300) / 10); // Penalty for slow load times
    overallScore -= Math.max(0, (0.7 - metrics.cacheHitRate) * 100); // Penalty for poor cache efficiency
    overallScore = Math.max(0, Math.min(100, overallScore));

    // Generate recommendations and action items
    const recommendations: string[] = [...monitorReport.recommendations];
    const actionItems: Array<{
      priority: 'low' | 'medium' | 'high';
      action: string;
      description: string;
      automated: boolean;
    }> = [];

    if (memoryRecommendation === 'critical') {
      actionItems.push({
        priority: 'high',
        action: 'immediate_cleanup',
        description: 'Memory usage is critical. Run immediate cleanup.',
        automated: this.config.enableAutoOptimization
      });
    }

    if (loadTimeStatus === 'critical') {
      actionItems.push({
        priority: 'high',
        action: 'enable_lazy_loading',
        description: 'Load times are too high. Enable aggressive lazy loading.',
        automated: false
      });
    }

    if (cacheEfficiency === 'poor') {
      actionItems.push({
        priority: 'medium',
        action: 'optimize_cache',
        description: 'Cache hit rate is low. Consider increasing cache size.',
        automated: false
      });
    }

    if (!settings.enableCompression && metrics.sessionCount > 5) {
      actionItems.push({
        priority: 'medium',
        action: 'enable_compression',
        description: 'Enable message compression to reduce storage usage.',
        automated: true
      });
    }

    return {
      timestamp: Date.now(),
      metrics,
      memoryAnalysis: {
        usage: metrics.memoryUsage,
        limit: settings.maxMemoryUsage,
        utilizationPercentage: memoryUtilization,
        recommendation: memoryRecommendation
      },
      performanceAnalysis: {
        loadTimeStatus,
        cacheEfficiency,
        compressionRatio: metrics.compressionRatio,
        overallScore: Math.round(overallScore)
      },
      recommendations,
      actionItems
    };
  }

  async executeActionItem(actionId: string): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }> {
    try {
      switch (actionId) {
        case 'immediate_cleanup':
          const cleanupResult = await this.optimizePerformance({
            clearCache: true,
            runCleanup: true,
            compressMessages: true
          });
          return { success: cleanupResult.success, result: cleanupResult };

        case 'enable_lazy_loading':
          await this.messageStore.updateSettings({
            enableLazyLoading: true,
            lazyLoadThreshold: 20
          });
          return { success: true, result: 'Lazy loading enabled' };

        case 'optimize_cache':
          await this.messageStore.updateSettings({
            maxConcurrentSessions: Math.min(30, (await this.messageStore.getSettings()).maxConcurrentSessions + 5)
          });
          return { success: true, result: 'Cache size increased' };

        case 'enable_compression':
          await this.messageStore.updateSettings({
            enableCompression: true,
            compressionThreshold: 7
          });
          return { success: true, result: 'Compression enabled' };

        default:
          return { success: false, error: `Unknown action: ${actionId}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getConfiguration(): Promise<PerformanceManagerConfig> {
    return { ...this.config };
  }

  async updateConfiguration(config: Partial<PerformanceManagerConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    // Apply configuration changes
    if (config.enableMonitoring !== undefined) {
      if (config.enableMonitoring) {
        await this.monitor.startMonitoring(this.config.monitoringInterval);
      } else {
        this.monitor.stopMonitoring();
      }
    }

    if (config.enableAutoOptimization !== undefined) {
      if (config.enableAutoOptimization) {
        await this.enableAutoOptimization();
      } else {
        await this.disableAutoOptimization();
      }
    }

    console.log('PerformanceManager configuration updated:', this.config);
  }

  async getStatus(): Promise<{
    initialized: boolean;
    monitoring: boolean;
    autoOptimization: boolean;
    lastOptimization: number;
    nextScheduledOptimization: number;
  }> {
    const monitoringStatus = await this.monitor.getMonitoringStatus();
    
    return {
      initialized: true,
      monitoring: monitoringStatus.active,
      autoOptimization: this.autoOptimizationEnabled,
      lastOptimization: Date.now(), // Simplified
      nextScheduledOptimization: Date.now() + (60 * 60 * 1000) // Next hour
    };
  }

  // Cleanup resources
  async destroy(): Promise<void> {
    this.monitor.stopMonitoring();
    this.autoOptimizationEnabled = false;
    this.optimizer.destroy();
    console.log('PerformanceManager destroyed');
  }
}