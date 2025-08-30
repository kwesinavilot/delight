/**
 * Performance Optimizer for Tab Management
 * 
 * Provides caching, batching, and optimization utilities
 * to minimize Chrome API calls and improve performance.
 */

interface TabCache {
  tabs: chrome.tabs.Tab[];
  timestamp: number;
  windowId?: number;
}

interface TabScoreCache {
  [tabId: number]: {
    score: number;
    timestamp: number;
    reasons: string[];
  };
}

export class PerformanceOptimizer {
  private tabCache: Map<string, TabCache> = new Map();
  private scoreCache: TabScoreCache = {};
  private readonly CACHE_TTL = 5000; // 5 seconds
  private readonly SCORE_CACHE_TTL = 10000; // 10 seconds
  private readonly MAX_CACHE_SIZE = 50;

  /**
   * Cached tab query with automatic cache invalidation
   */
  async getCachedTabs(queryInfo: chrome.tabs.QueryInfo = {}): Promise<chrome.tabs.Tab[]> {
    const cacheKey = this.generateCacheKey(queryInfo);
    const cached = this.tabCache.get(cacheKey);
    
    // Check if cache is still valid
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.tabs;
    }

    // Fetch fresh data
    const tabs = await chrome.tabs.query(queryInfo);
    
    // Store in cache
    this.tabCache.set(cacheKey, {
      tabs,
      timestamp: Date.now(),
      windowId: queryInfo.windowId
    });

    // Cleanup old cache entries
    this.cleanupTabCache();

    return tabs;
  }

  /**
   * Cached tab score calculation
   */
  getCachedTabScore(tabId: number, calculateFn: () => { score: number; reasons: string[] }): { score: number; reasons: string[] } {
    const cached = this.scoreCache[tabId];
    
    // Check if cache is still valid
    if (cached && (Date.now() - cached.timestamp) < this.SCORE_CACHE_TTL) {
      return {
        score: cached.score,
        reasons: cached.reasons
      };
    }

    // Calculate fresh score
    const result = calculateFn();
    
    // Store in cache
    this.scoreCache[tabId] = {
      score: result.score,
      reasons: result.reasons,
      timestamp: Date.now()
    };

    // Cleanup old score cache entries
    this.cleanupScoreCache();

    return result;
  }

  /**
   * Batch tab operations to minimize API calls
   */
  async batchTabOperations<T>(
    tabs: chrome.tabs.Tab[],
    operation: (tab: chrome.tabs.Tab) => Promise<T>,
    batchSize: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < tabs.length; i += batchSize) {
      const batch = tabs.slice(i, i + batchSize);
      const batchPromises = batch.map(operation);
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to prevent overwhelming the API
      if (i + batchSize < tabs.length) {
        await this.delay(10);
      }
    }
    
    return results;
  }

  /**
   * Optimized tab validation with early exit
   */
  async findFirstValidTab(tabs: chrome.tabs.Tab[], validationFn: (tab: chrome.tabs.Tab) => boolean): Promise<chrome.tabs.Tab | null> {
    // Sort tabs by likely validity (HTTPS first, then HTTP, etc.)
    const sortedTabs = [...tabs].sort((a, b) => {
      const aScore = this.getQuickValidityScore(a);
      const bScore = this.getQuickValidityScore(b);
      return bScore - aScore;
    });

    // Check tabs in order, return first valid one
    for (const tab of sortedTabs) {
      if (validationFn(tab)) {
        return tab;
      }
    }

    return null;
  }

  /**
   * Debounced function execution to prevent rapid successive calls
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeoutId: NodeJS.Timeout;
    let resolvePromise: (value: ReturnType<T>) => void;
    let rejectPromise: (reason: any) => void;

    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve, reject) => {
        clearTimeout(timeoutId);
        resolvePromise = resolve;
        rejectPromise = reject;

        timeoutId = setTimeout(async () => {
          try {
            const result = await func(...args);
            resolvePromise(result);
          } catch (error) {
            rejectPromise(error);
          }
        }, delay);
      });
    };
  }

  /**
   * Memory-efficient tab filtering
   */
  filterTabsEfficiently(
    tabs: chrome.tabs.Tab[],
    filters: Array<(tab: chrome.tabs.Tab) => boolean>
  ): chrome.tabs.Tab[] {
    return tabs.filter(tab => {
      // Apply filters in order, short-circuit on first failure
      for (const filter of filters) {
        if (!filter(tab)) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Invalidate caches when tabs change
   */
  invalidateCache(reason: string = 'manual'): void {
    console.log(`[PerformanceOptimizer] Invalidating caches: ${reason}`);
    this.tabCache.clear();
    this.scoreCache = {};
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    tabCacheSize: number;
    scoreCacheSize: number;
    oldestTabCache: number;
    oldestScoreCache: number;
  } {
    const now = Date.now();
    let oldestTabCache = now;
    let oldestScoreCache = now;

    // Find oldest tab cache entry
    for (const cache of this.tabCache.values()) {
      if (cache.timestamp < oldestTabCache) {
        oldestTabCache = cache.timestamp;
      }
    }

    // Find oldest score cache entry
    for (const cache of Object.values(this.scoreCache)) {
      if (cache.timestamp < oldestScoreCache) {
        oldestScoreCache = cache.timestamp;
      }
    }

    return {
      tabCacheSize: this.tabCache.size,
      scoreCacheSize: Object.keys(this.scoreCache).length,
      oldestTabCache: now - oldestTabCache,
      oldestScoreCache: now - oldestScoreCache
    };
  }

  /**
   * Preload commonly needed data
   */
  async preloadCommonData(): Promise<void> {
    try {
      // Preload current window tabs
      await this.getCachedTabs({ currentWindow: true });
      
      // Preload all tabs (for cross-window scenarios)
      await this.getCachedTabs({});
      
      console.log('[PerformanceOptimizer] Preloaded common tab data');
    } catch (error) {
      console.warn('[PerformanceOptimizer] Failed to preload data:', error);
    }
  }

  /**
   * Generate cache key for tab queries
   */
  private generateCacheKey(queryInfo: chrome.tabs.QueryInfo): string {
    return JSON.stringify(queryInfo);
  }

  /**
   * Quick validity score for sorting (doesn't require full validation)
   */
  private getQuickValidityScore(tab: chrome.tabs.Tab): number {
    if (!tab.url) return 0;
    
    if (tab.url.startsWith('https://')) return 100;
    if (tab.url.startsWith('http://')) return 80;
    if (tab.url === 'about:blank') return 60;
    if (tab.url.startsWith('chrome://')) return 0;
    if (tab.url.startsWith('file://')) return 0;
    if (tab.url.startsWith('chrome-extension://')) return 0;
    
    return 40; // Unknown but potentially valid
  }

  /**
   * Cleanup old tab cache entries
   */
  private cleanupTabCache(): void {
    if (this.tabCache.size <= this.MAX_CACHE_SIZE) return;

    const entries = Array.from(this.tabCache.entries());
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest entries
    const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => this.tabCache.delete(key));
  }

  /**
   * Cleanup old score cache entries
   */
  private cleanupScoreCache(): void {
    const entries = Object.entries(this.scoreCache);
    
    if (entries.length <= this.MAX_CACHE_SIZE) return;

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest entries
    const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
    toRemove.forEach(([tabId]) => delete this.scoreCache[parseInt(tabId)]);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// Set up automatic cache invalidation on tab events
if (typeof chrome !== 'undefined' && chrome.tabs) {
  // Invalidate cache when tabs are created, removed, or updated
  chrome.tabs.onCreated?.addListener(() => {
    performanceOptimizer.invalidateCache('tab_created');
  });

  chrome.tabs.onRemoved?.addListener(() => {
    performanceOptimizer.invalidateCache('tab_removed');
  });

  chrome.tabs.onUpdated?.addListener(() => {
    performanceOptimizer.invalidateCache('tab_updated');
  });

  // Preload data when extension starts
  setTimeout(() => {
    performanceOptimizer.preloadCommonData();
  }, 1000);
}