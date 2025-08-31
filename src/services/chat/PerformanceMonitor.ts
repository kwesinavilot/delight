import {
  PerformanceMetrics
} from '../../types/chat';
import { PerformanceOptimizer } from './PerformanceOptimizer';
import { MessageStore } from './MessageStore';
// import { ConversationManager } from './ConversationManager';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private monitoringInterval: number | null = null;
  private isMonitoring = false;
  private performanceOptimizer: PerformanceOptimizer;
  private messageStore: MessageStore;

  private constructor() {
    this.performanceOptimizer = PerformanceOptimizer.getInstance();
    this.messageStore = MessageStore.getInstance();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  async startMonitoring(intervalMinutes: number = 30): Promise<void> {
    if (this.isMonitoring) {
      console.log('Performance monitoring already active');
      return;
    }

    const settings = await this.messageStore.getSettings();
    if (!settings.enablePerformanceMonitoring) {
      console.log('Performance monitoring disabled in settings');
      return;
    }

    this.isMonitoring = true;
    const intervalMs = intervalMinutes * 60 * 1000;

    this.monitoringInterval = window.setInterval(async () => {
      try {
        await this.performMonitoringCheck();
      } catch (error) {
        console.error('Performance monitoring check failed:', error);
      }
    }, intervalMs);

    console.log(`Performance monitoring started (interval: ${intervalMinutes} minutes)`);

    // Run initial check
    await this.performMonitoringCheck();
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Performance monitoring stopped');
  }

  private async performMonitoringCheck(): Promise<void> {
    try {
      const metrics = await this.performanceOptimizer.getPerformanceMetrics();
      const settings = await this.messageStore.getSettings();

      console.log('Performance check:', {
        memoryUsage: `${metrics.memoryUsage.toFixed(2)}MB`,
        sessionCount: metrics.sessionCount,
        messageCount: metrics.messageCount,
        cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
        avgLoadTime: `${metrics.averageLoadTime.toFixed(2)}ms`
      });

      // Check if memory usage is too high
      if (metrics.memoryUsage > settings.maxMemoryUsage * 0.9) {
        console.warn(`High memory usage detected: ${metrics.memoryUsage.toFixed(2)}MB`);
        await this.handleHighMemoryUsage();
      }

      // Check if cache hit rate is too low
      if (metrics.cacheHitRate < 0.5 && metrics.sessionCount > 5) {
        console.warn(`Low cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
        await this.handleLowCacheHitRate();
      }

      // Check if load times are too high
      if (metrics.averageLoadTime > 1000) {
        console.warn(`High load times detected: ${metrics.averageLoadTime.toFixed(2)}ms`);
        await this.handleHighLoadTimes();
      }

      // Check if cleanup is needed
      if (this.performanceOptimizer.shouldRunCleanup(settings)) {
        console.log('Running scheduled cleanup...');
        await this.messageStore.cleanup();
      }

    } catch (error) {
      console.error('Performance monitoring check failed:', error);
    }
  }

  private async handleHighMemoryUsage(): Promise<void> {
    try {
      console.log('Handling high memory usage...');

      // Clear memory cache
      this.performanceOptimizer.clearMemoryCache();

      // Run cleanup
      await this.messageStore.cleanup();

      console.log('Memory usage optimization completed');
    } catch (error) {
      console.error('Failed to handle high memory usage:', error);
    }
  }

  private async handleLowCacheHitRate(): Promise<void> {
    try {
      console.log('Handling low cache hit rate...');

      // This could involve adjusting cache policies or preloading frequently accessed sessions
      // For now, just log the issue
      console.log('Consider adjusting lazy loading threshold or cache size');

    } catch (error) {
      console.error('Failed to handle low cache hit rate:', error);
    }
  }

  private async handleHighLoadTimes(): Promise<void> {
    try {
      console.log('Handling high load times...');

      // Enable more aggressive lazy loading
      const settings = await this.messageStore.getSettings();
      if (settings.lazyLoadThreshold > 20) {
        await this.messageStore.updateSettings({
          lazyLoadThreshold: Math.max(20, settings.lazyLoadThreshold - 10)
        });
        console.log(`Reduced lazy load threshold to ${settings.lazyLoadThreshold - 10}`);
      }

      // Enable compression if not already enabled
      if (!settings.enableCompression) {
        await this.messageStore.updateSettings({
          enableCompression: true
        });
        console.log('Enabled message compression to improve load times');
      }

    } catch (error) {
      console.error('Failed to handle high load times:', error);
    }
  }

  async getPerformanceReport(): Promise<{
    metrics: PerformanceMetrics;
    recommendations: string[];
    issues: string[];
    optimizationOpportunities: string[];
  }> {
    const metrics = await this.performanceOptimizer.getPerformanceMetrics();
    const settings = await this.messageStore.getSettings();
    const recommendations: string[] = [];
    const issues: string[] = [];
    const optimizationOpportunities: string[] = [];

    // Analyze memory usage
    if (metrics.memoryUsage > settings.maxMemoryUsage * 0.8) {
      issues.push(`High memory usage: ${metrics.memoryUsage.toFixed(2)}MB (${((metrics.memoryUsage / settings.maxMemoryUsage) * 100).toFixed(1)}% of limit)`);
      recommendations.push('Run cleanup to free memory');
      recommendations.push('Consider reducing maxConcurrentSessions setting');
    }

    // Analyze cache performance
    if (metrics.cacheHitRate < 0.6) {
      issues.push(`Low cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
      recommendations.push('Consider increasing memory allocation for caching');
      optimizationOpportunities.push('Implement smarter cache preloading');
    }

    // Analyze load times
    if (metrics.averageLoadTime > 500) {
      issues.push(`High average load time: ${metrics.averageLoadTime.toFixed(2)}ms`);
      recommendations.push('Enable lazy loading and compression');
      optimizationOpportunities.push('Implement progressive loading for large sessions');
    }

    // Check settings optimization
    if (!settings.enableLazyLoading && metrics.messageCount > 1000) {
      optimizationOpportunities.push('Enable lazy loading for better performance with large message counts');
    }

    if (!settings.enableCompression && metrics.sessionCount > 10) {
      optimizationOpportunities.push('Enable message compression to reduce storage usage');
    }

    // Check cleanup frequency
    const timeSinceLastCleanup = Date.now() - metrics.lastCleanup;
    const cleanupIntervalMs = settings.cleanupFrequency * 60 * 60 * 1000;

    if (timeSinceLastCleanup > cleanupIntervalMs * 2) {
      issues.push('Cleanup overdue - may be affecting performance');
      recommendations.push('Run manual cleanup or check cleanup settings');
    }

    return {
      metrics,
      recommendations,
      issues,
      optimizationOpportunities
    };
  }

  async optimizeSettings(): Promise<{
    settingsChanged: boolean;
    changes: Record<string, any>;
    reasoning: string[];
  }> {
    const metrics = await this.performanceOptimizer.getPerformanceMetrics();
    const currentSettings = await this.messageStore.getSettings();
    const changes: Record<string, any> = {};
    const reasoning: string[] = [];

    // Optimize lazy loading threshold based on performance
    if (metrics.averageLoadTime > 1000 && currentSettings.lazyLoadThreshold > 30) {
      changes.lazyLoadThreshold = 30;
      reasoning.push('Reduced lazy loading threshold due to high load times');
    } else if (metrics.averageLoadTime < 200 && currentSettings.lazyLoadThreshold < 100) {
      changes.lazyLoadThreshold = Math.min(100, currentSettings.lazyLoadThreshold + 20);
      reasoning.push('Increased lazy loading threshold due to good performance');
    }

    // Optimize memory settings based on usage
    if (metrics.memoryUsage > currentSettings.maxMemoryUsage * 0.9) {
      changes.maxConcurrentSessions = Math.max(5, currentSettings.maxConcurrentSessions - 5);
      reasoning.push('Reduced concurrent sessions due to high memory usage');
    }

    // Enable compression if beneficial
    if (!currentSettings.enableCompression && metrics.sessionCount > 5) {
      changes.enableCompression = true;
      reasoning.push('Enabled compression due to multiple sessions');
    }

    // Adjust cleanup frequency based on usage patterns
    if (metrics.sessionCount > 20 && currentSettings.cleanupFrequency > 12) {
      changes.cleanupFrequency = 12; // Every 12 hours
      reasoning.push('Increased cleanup frequency due to high session count');
    }

    const settingsChanged = Object.keys(changes).length > 0;

    if (settingsChanged) {
      await this.messageStore.updateSettings(changes);
      console.log('Performance settings optimized:', changes);
    }

    return {
      settingsChanged,
      changes,
      reasoning
    };
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  async getMonitoringStatus(): Promise<{
    active: boolean;
    intervalMinutes: number;
    lastCheck: number;
    nextCheck: number;
  }> {
    const intervalMinutes = 30; // Default interval

    return {
      active: this.isMonitoring,
      intervalMinutes,
      lastCheck: Date.now(), // Simplified
      nextCheck: Date.now() + (intervalMinutes * 60 * 1000)
    };
  }
}