import { PerformanceManager, PerformanceManagerConfig } from './PerformanceManager';
import { MessageStore } from './MessageStore';

/**
 * Integration service that demonstrates how to use all performance optimization features together
 */
export class PerformanceIntegration {
  private performanceManager: PerformanceManager;
  private messageStore: MessageStore;

  constructor() {
    this.performanceManager = PerformanceManager.getInstance();
    this.messageStore = MessageStore.getInstance();
  }

  /**
   * Initialize performance optimization with recommended settings
   */
  async initializeOptimizedPerformance(): Promise<void> {
    // Configure performance manager with optimal settings
    const config: PerformanceManagerConfig = {
      enableAutoOptimization: true,
      enableMonitoring: true,
      monitoringInterval: 30, // Check every 30 minutes
      autoCleanupThreshold: 75, // Trigger cleanup at 75% memory usage
      aggressiveOptimization: false // Start with conservative optimization
    };

    await this.performanceManager.initialize(config);

    // Configure conversation settings for optimal performance
    await this.messageStore.updateSettings({
      enableLazyLoading: true,
      lazyLoadThreshold: 50, // Start lazy loading after 50 messages
      enableCompression: true,
      compressionThreshold: 7, // Compress messages older than 7 days
      maxMemoryUsage: 50, // 50MB limit
      enablePerformanceMonitoring: true,
      cleanupFrequency: 24, // Cleanup every 24 hours
      maxConcurrentSessions: 15 // Keep 15 sessions in memory max
    });

    console.log('Performance optimization initialized with optimal settings');
  }

  /**
   * Run a comprehensive performance check and optimization
   */
  async runPerformanceOptimization(): Promise<{
    report: any;
    optimizationResult: any;
    recommendations: string[];
  }> {
    // Generate performance report
    const report = await this.performanceManager.generatePerformanceReport();

    console.log('Performance Report:', {
      overallScore: report.performanceAnalysis.overallScore,
      memoryUsage: `${report.memoryAnalysis.utilizationPercentage.toFixed(1)}%`,
      loadTimeStatus: report.performanceAnalysis.loadTimeStatus,
      cacheEfficiency: report.performanceAnalysis.cacheEfficiency
    });

    // Run optimization if needed
    let optimizationResult = null;
    if (report.performanceAnalysis.overallScore < 70) {
      console.log('Performance score below threshold, running optimization...');

      optimizationResult = await this.performanceManager.optimizePerformance({
        clearCache: report.memoryAnalysis.utilizationPercentage > 80,
        runCleanup: true,
        optimizeContext: true,
        compressMessages: true,
        aggressiveMode: report.performanceAnalysis.overallScore < 50
      });

      console.log('Optimization completed:', optimizationResult);
    }

    // Execute high-priority action items automatically
    for (const actionItem of report.actionItems) {
      if (actionItem.priority === 'high' && actionItem.automated) {
        console.log(`Executing automated action: ${actionItem.action}`);
        const result = await this.performanceManager.executeActionItem(actionItem.action);
        console.log(`Action result:`, result);
      }
    }

    return {
      report,
      optimizationResult,
      recommendations: report.recommendations
    };
  }

  /**
   * Monitor and maintain optimal performance continuously
   */
  async enableContinuousOptimization(): Promise<void> {
    // Set up periodic comprehensive optimization
    setInterval(async () => {
      try {
        const report = await this.performanceManager.generatePerformanceReport();

        // Auto-adjust settings based on usage patterns
        if (report.performanceAnalysis.overallScore < 60) {
          console.log('Performance degraded, running automatic optimization...');
          await this.runPerformanceOptimization();
        }

        // Adjust settings based on usage patterns
        await this.adjustSettingsBasedOnUsage(report);

      } catch (error) {
        console.error('Continuous optimization failed:', error);
      }
    }, 2 * 60 * 60 * 1000); // Every 2 hours

    console.log('Continuous performance optimization enabled');
  }

  private async adjustSettingsBasedOnUsage(report: any): Promise<void> {
    const currentSettings = await this.messageStore.getSettings();
    const updates: any = {};

    // Adjust lazy loading threshold based on load times
    if (report.performanceAnalysis.loadTimeStatus === 'critical' && currentSettings.lazyLoadThreshold > 20) {
      updates.lazyLoadThreshold = Math.max(20, currentSettings.lazyLoadThreshold - 10);
    } else if (report.performanceAnalysis.loadTimeStatus === 'good' && currentSettings.lazyLoadThreshold < 100) {
      updates.lazyLoadThreshold = Math.min(100, currentSettings.lazyLoadThreshold + 10);
    }

    // Adjust memory limits based on usage
    if (report.memoryAnalysis.utilizationPercentage > 90) {
      updates.maxConcurrentSessions = Math.max(5, currentSettings.maxConcurrentSessions - 2);
    } else if (report.memoryAnalysis.utilizationPercentage < 40) {
      updates.maxConcurrentSessions = Math.min(25, currentSettings.maxConcurrentSessions + 2);
    }

    // Adjust cleanup frequency based on session count
    if (report.metrics.sessionCount > 30 && currentSettings.cleanupFrequency > 12) {
      updates.cleanupFrequency = 12; // More frequent cleanup
    } else if (report.metrics.sessionCount < 10 && currentSettings.cleanupFrequency < 48) {
      updates.cleanupFrequency = 48; // Less frequent cleanup
    }

    if (Object.keys(updates).length > 0) {
      await this.messageStore.updateSettings(updates);
      console.log('Settings auto-adjusted based on usage:', updates);
    }
  }

  /**
   * Get current performance status and recommendations
   */
  async getPerformanceStatus(): Promise<{
    status: 'excellent' | 'good' | 'warning' | 'critical';
    score: number;
    keyMetrics: {
      memoryUsage: string;
      loadTime: string;
      cacheHitRate: string;
      sessionCount: number;
    };
    recommendations: string[];
    nextOptimization: string;
  }> {
    const report = await this.performanceManager.generatePerformanceReport();
    const status = await this.performanceManager.getStatus();

    let statusLevel: 'excellent' | 'good' | 'warning' | 'critical';
    if (report.performanceAnalysis.overallScore >= 85) {
      statusLevel = 'excellent';
    } else if (report.performanceAnalysis.overallScore >= 70) {
      statusLevel = 'good';
    } else if (report.performanceAnalysis.overallScore >= 50) {
      statusLevel = 'warning';
    } else {
      statusLevel = 'critical';
    }

    return {
      status: statusLevel,
      score: report.performanceAnalysis.overallScore,
      keyMetrics: {
        memoryUsage: `${report.memoryAnalysis.utilizationPercentage.toFixed(1)}%`,
        loadTime: `${report.metrics.averageLoadTime.toFixed(0)}ms`,
        cacheHitRate: `${(report.metrics.cacheHitRate * 100).toFixed(1)}%`,
        sessionCount: report.metrics.sessionCount
      },
      recommendations: report.recommendations.slice(0, 3), // Top 3 recommendations
      nextOptimization: new Date(status.nextScheduledOptimization).toLocaleString()
    };
  }

  /**
   * Emergency performance recovery for critical situations
   */
  async emergencyPerformanceRecovery(): Promise<{
    success: boolean;
    actionsPerformed: string[];
    memoryFreed: number;
    error?: string;
  }> {
    const actionsPerformed: string[] = [];
    let totalMemoryFreed = 0;

    try {
      console.log('Starting emergency performance recovery...');

      // 1. Clear all caches immediately
      const performanceOptimizer = (this.performanceManager as any).optimizer;
      performanceOptimizer.clearMemoryCache();
      actionsPerformed.push('Cleared memory cache');

      // 2. Run aggressive cleanup
      const cleanupResult = await this.performanceManager.optimizePerformance({
        clearCache: true,
        runCleanup: true,
        optimizeContext: true,
        compressMessages: true,
        aggressiveMode: true
      });

      if (cleanupResult.success) {
        totalMemoryFreed += cleanupResult.memoryFreed;
        actionsPerformed.push(`Aggressive cleanup (${cleanupResult.memoryFreed.toFixed(2)}MB freed)`);
      }

      // 3. Reduce memory limits temporarily
      await this.messageStore.updateSettings({
        maxConcurrentSessions: 5,
        lazyLoadThreshold: 10,
        maxMemoryUsage: 25 // Reduce to 25MB temporarily
      });
      actionsPerformed.push('Reduced memory limits');

      // 4. Force garbage collection if available
      if (typeof (globalThis as any).gc === 'function') {
        (globalThis as any).gc();
        actionsPerformed.push('Forced garbage collection');
      }

      console.log('Emergency recovery completed successfully');

      return {
        success: true,
        actionsPerformed,
        memoryFreed: totalMemoryFreed
      };

    } catch (error) {
      console.error('Emergency performance recovery failed:', error);
      return {
        success: false,
        actionsPerformed,
        memoryFreed: totalMemoryFreed,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cleanup and shutdown performance optimization
   */
  async shutdown(): Promise<void> {
    await this.performanceManager.destroy();
    console.log('Performance optimization shutdown completed');
  }
}