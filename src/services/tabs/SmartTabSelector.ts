/**
 * Smart Tab Selector Service
 * 
 * Provides intelligent tab selection for sidepanel operations,
 * including fallback tab creation and cross-window search.
 */

import type { TabSelectionOptions, FallbackConfig } from '@/types/tabs';
import { tabValidationService } from './TabValidationService';
import { performanceOptimizer } from './PerformanceOptimizer';

export interface SmartTabSelector {
  findBestTab(options?: TabSelectionOptions): Promise<chrome.tabs.Tab | null>;
  createFallbackTab(): Promise<chrome.tabs.Tab>;
  ensureValidTab(): Promise<chrome.tabs.Tab>;
}

/**
 * Implementation of Smart Tab Selector
 */
export class SmartTabSelectorImpl implements SmartTabSelector {
  private readonly fallbackConfig: FallbackConfig = {
    defaultNewTabUrl: 'https://www.google.com',
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    enableLogging: true
  };

  /**
   * Finds the best available tab for sidepanel attachment
   */
  async findBestTab(options: TabSelectionOptions = {}): Promise<chrome.tabs.Tab | null> {
    try {
      const {
        excludeCurrentTab = false,
        preferRecentlyActive = true,
        windowId
      } = options;

      // Query tabs based on options
      const queryOptions: chrome.tabs.QueryInfo = {};
      if (windowId !== undefined) {
        queryOptions.windowId = windowId;
      } else {
        // Default to current window, but we'll expand search if needed
        queryOptions.currentWindow = true;
      }

      let tabs = await performanceOptimizer.getCachedTabs(queryOptions);

      // If no tabs found in current window, expand search to all windows
      if (tabs.length === 0 && !windowId) {
        if (this.fallbackConfig.enableLogging) {
          console.log('No tabs found in current window, expanding search to all windows');
        }
        tabs = await performanceOptimizer.getCachedTabs({});
      }

      // Filter out current tab if requested
      if (excludeCurrentTab) {
        const currentTabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTabId = currentTabs[0]?.id;
        if (currentTabId) {
          tabs = tabs.filter(tab => tab.id !== currentTabId);
        }
      }

      // Filter to only valid tabs
      const validTabs = tabs.filter(tab => tabValidationService.isValidForSidePanel(tab));

      if (validTabs.length === 0) {
        if (this.fallbackConfig.enableLogging) {
          console.log('No valid tabs found for sidepanel attachment');
        }
        return null;
      }

      // Score and sort tabs with caching
      const scoredTabs = validTabs.map(tab => ({
        tab,
        score: performanceOptimizer.getCachedTabScore(tab.id!, () => 
          tabValidationService.getDetailedTabScore(tab)
        )
      }));

      // Sort by score (highest first)
      scoredTabs.sort((a, b) => b.score.score - a.score.score);

      if (this.fallbackConfig.enableLogging) {
        console.log('Tab selection results:', scoredTabs.map(({ tab, score }) => ({
          id: tab.id,
          url: tab.url,
          title: tab.title,
          score: score.score,
          reasons: score.reasons
        })));
      }

      // Additional filtering for active tabs if preferred
      if (preferRecentlyActive && scoredTabs.length > 1) {
        // Prefer active tabs since we can't reliably get lastAccessed
        const activeTabs = scoredTabs.filter(({ tab }) => tab.active);
        
        if (activeTabs.length > 0) {
          return activeTabs[0].tab;
        }
      }

      return scoredTabs[0].tab;

    } catch (error) {
      console.error('Error finding best tab:', error);
      return null;
    }
  }

  /**
   * Creates a fallback tab when no suitable tabs are available
   */
  async createFallbackTab(): Promise<chrome.tabs.Tab> {
    try {
      if (this.fallbackConfig.enableLogging) {
        console.log('Creating fallback tab with URL:', this.fallbackConfig.defaultNewTabUrl);
      }

      const newTab = await chrome.tabs.create({
        url: this.fallbackConfig.defaultNewTabUrl,
        active: false // Don't steal focus from current tab
      });

      // Wait a moment for the tab to initialize
      await this.delay(this.fallbackConfig.retryDelayMs);

      return newTab;

    } catch (error) {
      console.error('Error creating fallback tab:', error);
      
      // Try creating a blank tab as last resort
      try {
        const blankTab = await chrome.tabs.create({
          url: 'about:blank',
          active: false
        });
        
        if (this.fallbackConfig.enableLogging) {
          console.log('Created blank fallback tab as last resort');
        }
        
        return blankTab;
      } catch (blankError) {
        console.error('Failed to create even a blank tab:', blankError);
        throw new Error('Unable to create any fallback tab');
      }
    }
  }

  /**
   * Ensures a valid tab is available, creating one if necessary
   */
  async ensureValidTab(): Promise<chrome.tabs.Tab> {
    let attempts = 0;
    const maxAttempts = this.fallbackConfig.maxRetryAttempts;

    while (attempts < maxAttempts) {
      try {
        // First, try to find an existing valid tab
        const bestTab = await this.findBestTab();
        
        if (bestTab) {
          // Verify the tab is still accessible
          const isAccessible = await tabValidationService.isAccessible(bestTab);
          if (isAccessible) {
            if (this.fallbackConfig.enableLogging) {
              console.log('Found valid existing tab:', bestTab.id, bestTab.url);
            }
            return bestTab;
          }
        }

        // No valid tab found, create a fallback
        if (this.fallbackConfig.enableLogging) {
          console.log(`Attempt ${attempts + 1}: No valid tab found, creating fallback`);
        }
        
        const fallbackTab = await this.createFallbackTab();
        
        // Verify the new tab is valid
        const isValid = tabValidationService.isValidForSidePanel(fallbackTab);
        if (isValid) {
          return fallbackTab;
        }

        if (this.fallbackConfig.enableLogging) {
          console.warn('Created fallback tab is not valid, retrying...');
        }

      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error);
      }

      attempts++;
      if (attempts < maxAttempts) {
        await this.delay(this.fallbackConfig.retryDelayMs * attempts); // Exponential backoff
      }
    }

    throw new Error(`Failed to ensure valid tab after ${maxAttempts} attempts`);
  }

  /**
   * Finds the best tab in a specific window
   */
  async findBestTabInWindow(windowId: number): Promise<chrome.tabs.Tab | null> {
    return this.findBestTab({ windowId });
  }

  /**
   * Finds the best tab excluding the current active tab
   */
  async findBestAlternativeTab(): Promise<chrome.tabs.Tab | null> {
    return this.findBestTab({ excludeCurrentTab: true });
  }

  /**
   * Gets all valid tabs across all windows with their scores
   */
  async getAllValidTabsWithScores(): Promise<Array<{ tab: chrome.tabs.Tab; score: number; reasons: string[] }>> {
    try {
      const allTabs = await performanceOptimizer.getCachedTabs({});
      const validTabs = performanceOptimizer.filterTabsEfficiently(allTabs, [
        tab => tabValidationService.isValidForSidePanel(tab)
      ]);
      
      return validTabs.map(tab => {
        const cachedScore = performanceOptimizer.getCachedTabScore(tab.id!, () => 
          tabValidationService.getDetailedTabScore(tab)
        );
        return {
          tab,
          score: cachedScore.score,
          reasons: cachedScore.reasons
        };
      }).sort((a, b) => b.score - a.score);

    } catch (error) {
      console.error('Error getting all valid tabs:', error);
      return [];
    }
  }

  /**
   * Updates fallback configuration
   */
  updateFallbackConfig(config: Partial<FallbackConfig>): void {
    Object.assign(this.fallbackConfig, config);
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const smartTabSelector = new SmartTabSelectorImpl();