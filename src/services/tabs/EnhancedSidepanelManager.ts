/**
 * Enhanced Sidepanel Manager
 * 
 * Orchestrates tab validation, selection, and error recovery
 * to provide robust sidepanel management functionality.
 */

import { tabValidationService } from './TabValidationService';
import { smartTabSelector } from './SmartTabSelector';
import { errorRecoveryManager } from './ErrorRecoveryManager';
import { performanceOptimizer } from './PerformanceOptimizer';

export interface SidepanelTransitionOptions {
  preserveCurrentTab?: boolean;
  preferRecentlyActive?: boolean;
  enableLogging?: boolean;
}

export interface SidepanelTransitionResult {
  success: boolean;
  targetTab?: chrome.tabs.Tab;
  error?: string;
  fallbackUsed: boolean;
  transitionTime: number;
}

/**
 * Enhanced Sidepanel Manager with smart tab management
 */
export class EnhancedSidepanelManager {
  private readonly defaultOptions: SidepanelTransitionOptions = {
    preserveCurrentTab: false,
    preferRecentlyActive: true,
    enableLogging: true
  };

  // Debounced minimize function to prevent rapid successive calls
  private debouncedMinimize = performanceOptimizer.debounce(
    this._minimizeToSidePanel.bind(this),
    300
  );

  /**
   * Enhanced minimize to sidepanel with smart tab management
   * Replaces the existing minimizeToSidePanel function
   */
  async minimizeToSidePanel(options: SidepanelTransitionOptions = {}): Promise<SidepanelTransitionResult> {
    return this.debouncedMinimize(options);
  }

  /**
   * Internal minimize implementation (called by debounced function)
   */
  private async _minimizeToSidePanel(options: SidepanelTransitionOptions = {}): Promise<SidepanelTransitionResult> {
    const startTime = Date.now();
    const config = { ...this.defaultOptions, ...options };
    const logPrefix = '[EnhancedSidepanelManager]';

    if (config.enableLogging) {
      console.log(`${logPrefix} Starting enhanced minimize to sidepanel operation`);
    }

    try {
      // Step 1: Find or ensure a valid tab for sidepanel attachment
      let targetTab: chrome.tabs.Tab;
      let fallbackUsed = false;

      try {
        if (config.enableLogging) {
          console.log(`${logPrefix} Finding best available tab for sidepanel`);
        }

        const bestTab = await smartTabSelector.findBestTab({
          excludeCurrentTab: !config.preserveCurrentTab,
          preferRecentlyActive: config.preferRecentlyActive
        });

        if (bestTab) {
          // Verify the tab is still accessible
          const isAccessible = await tabValidationService.isAccessible(bestTab);
          if (isAccessible) {
            targetTab = bestTab;
            if (config.enableLogging) {
              console.log(`${logPrefix} Selected existing tab:`, targetTab.id, targetTab.url);
            }
          } else {
            throw new Error('Best tab is not accessible');
          }
        } else {
          throw new Error('No suitable existing tab found');
        }
      } catch (error) {
        if (config.enableLogging) {
          console.log(`${logPrefix} No suitable existing tab, using error recovery`);
        }
        
        // Use error recovery to get a valid tab
        targetTab = await errorRecoveryManager.recoverMinimizeToSidepanel();
        fallbackUsed = true;
      }

      // Step 2: Open sidepanel on the target tab
      if (config.enableLogging) {
        console.log(`${logPrefix} Opening sidepanel on tab:`, targetTab.id);
      }

      try {
        await chrome.sidePanel.open({ tabId: targetTab.id! });
        
        // Set sidepanel options
        await chrome.sidePanel.setOptions({
          tabId: targetTab.id!,
          path: 'sidepanel.html',
          enabled: true
        });

      } catch (sidepanelError) {
        if (config.enableLogging) {
          console.warn(`${logPrefix} Sidepanel operation failed, using error recovery`);
        }
        
        // Use error recovery for sidepanel operations
        const recoveryResult = await errorRecoveryManager.handleSidepanelError(targetTab.id!, 'open');
        
        if (!recoveryResult.success) {
          throw new Error(recoveryResult.error);
        }
        
        if (recoveryResult.tab) {
          targetTab = recoveryResult.tab;
        }
        fallbackUsed = true;
      }

      // Step 3: Focus on the target tab
      if (config.enableLogging) {
        console.log(`${logPrefix} Focusing on target tab:`, targetTab.id);
      }

      try {
        await chrome.tabs.update(targetTab.id!, { active: true });
      } catch (focusError) {
        // Focus failure is not critical, log but continue
        if (config.enableLogging) {
          console.warn(`${logPrefix} Failed to focus target tab:`, focusError);
        }
      }

      // Step 4: Close current fullscreen tab if it exists
      try {
        const currentTab = await chrome.tabs.getCurrent();
        if (currentTab?.id && currentTab.id !== targetTab.id) {
          if (config.enableLogging) {
            console.log(`${logPrefix} Closing current fullscreen tab:`, currentTab.id);
          }
          await chrome.tabs.remove(currentTab.id);
        }
      } catch (closeError) {
        // Closing current tab failure is not critical
        if (config.enableLogging) {
          console.warn(`${logPrefix} Failed to close current tab:`, closeError);
        }
      }

      const transitionTime = Date.now() - startTime;
      
      if (config.enableLogging) {
        console.log(`${logPrefix} Successfully completed minimize to sidepanel in ${transitionTime}ms`);
      }

      return {
        success: true,
        targetTab,
        fallbackUsed,
        transitionTime
      };

    } catch (error) {
      const transitionTime = Date.now() - startTime;
      const errorMessage = `Enhanced minimize to sidepanel failed: ${(error as Error).message}`;
      
      console.error(`${logPrefix} ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        fallbackUsed: true,
        transitionTime
      };
    }
  }

  /**
   * Validates current sidepanel state and ensures it's on a valid tab
   */
  async validateSidepanelState(): Promise<{ isValid: boolean; currentTab?: chrome.tabs.Tab; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Get current active tab using cached query
      const currentTabs = await performanceOptimizer.getCachedTabs({ active: true, currentWindow: true });
      const currentTab = currentTabs[0];
      
      if (!currentTab) {
        issues.push('No active tab found');
        return { isValid: false, issues };
      }

      // Check if current tab is valid for sidepanel
      const isValidForSidepanel = tabValidationService.isValidForSidePanel(currentTab);
      if (!isValidForSidepanel) {
        issues.push('Current tab has invalid URL for sidepanel');
      }

      // Check if tab is accessible
      const isAccessible = await tabValidationService.isAccessible(currentTab);
      if (!isAccessible) {
        issues.push('Current tab is not accessible');
      }

      return {
        isValid: issues.length === 0,
        currentTab,
        issues
      };

    } catch (error) {
      issues.push(`Error validating sidepanel state: ${(error as Error).message}`);
      return { isValid: false, issues };
    }
  }

  /**
   * Gets diagnostic information about available tabs
   */
  async getDiagnosticInfo(): Promise<{
    totalTabs: number;
    validTabs: number;
    accessibleTabs: number;
    topScoredTabs: Array<{ id: number; url: string; score: number; reasons: string[] }>;
  }> {
    try {
      const allTabs = await performanceOptimizer.getCachedTabs({});
      const validTabs = performanceOptimizer.filterTabsEfficiently(allTabs, [
        tab => tabValidationService.isValidForSidePanel(tab)
      ]);
      
      const accessibilityChecks = await Promise.all(
        validTabs.map(async tab => ({
          tab,
          isAccessible: await tabValidationService.isAccessible(tab)
        }))
      );
      
      const accessibleTabs = accessibilityChecks.filter(check => check.isAccessible);
      
      const scoredTabs = await smartTabSelector.getAllValidTabsWithScores();
      const topScoredTabs = scoredTabs.slice(0, 5).map(({ tab, score, reasons }) => ({
        id: tab.id!,
        url: tab.url || 'unknown',
        score,
        reasons
      }));

      return {
        totalTabs: allTabs.length,
        validTabs: validTabs.length,
        accessibleTabs: accessibleTabs.length,
        topScoredTabs
      };

    } catch (error) {
      console.error('Error getting diagnostic info:', error);
      return {
        totalTabs: 0,
        validTabs: 0,
        accessibleTabs: 0,
        topScoredTabs: []
      };
    }
  }

  /**
   * Performs a health check of the tab management system
   */
  async performHealthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check if we can query tabs
      const allTabs = await chrome.tabs.query({});
      if (allTabs.length === 0) {
        issues.push('No tabs found in browser');
        recommendations.push('Open at least one tab with a valid URL');
      }

      // Check for valid tabs
      const validTabs = allTabs.filter(tab => tabValidationService.isValidForSidePanel(tab));
      if (validTabs.length === 0) {
        issues.push('No valid tabs found for sidepanel attachment');
        recommendations.push('Open a tab with an HTTP/HTTPS URL');
      }

      // Check Chrome APIs availability
      if (!chrome.sidePanel) {
        issues.push('Chrome sidePanel API not available');
        recommendations.push('Ensure extension has sidePanel permission');
      }

      if (!chrome.tabs) {
        issues.push('Chrome tabs API not available');
        recommendations.push('Ensure extension has tabs permission');
      }

      // Test tab creation capability
      try {
        const testTab = await chrome.tabs.create({ url: 'about:blank', active: false });
        await chrome.tabs.remove(testTab.id!);
      } catch (error) {
        issues.push('Cannot create new tabs');
        recommendations.push('Check browser permissions and policies');
      }

    } catch (error) {
      issues.push(`Health check failed: ${(error as Error).message}`);
      recommendations.push('Check extension permissions and browser state');
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations
    };
  }
}

// Export singleton instance
export const enhancedSidepanelManager = new EnhancedSidepanelManager();