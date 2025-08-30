/**
 * Error Recovery Manager
 * 
 * Handles Chrome API failures and provides graceful degradation
 * strategies for tab management operations.
 */

import { smartTabSelector } from './SmartTabSelector';
import { tabValidationService } from './TabValidationService';

export interface ErrorRecoveryConfig {
  maxRetryAttempts: number;
  retryDelayMs: number;
  enableDetailedLogging: boolean;
  fallbackStrategies: string[];
}

export interface RecoveryResult {
  success: boolean;
  tab?: chrome.tabs.Tab;
  error?: string;
  strategy?: string;
  attempts: number;
}

/**
 * Manages error recovery for tab operations
 */
export class ErrorRecoveryManager {
  private readonly config: ErrorRecoveryConfig = {
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    enableDetailedLogging: true,
    fallbackStrategies: [
      'retry_same_operation',
      'find_alternative_tab',
      'create_new_tab',
      'use_blank_tab'
    ]
  };

  /**
   * Handles tab query errors with multiple recovery strategies
   */
  async handleTabQueryError(): Promise<chrome.tabs.Tab> {
    const logPrefix = '[ErrorRecovery:TabQuery]';

    if (this.config.enableDetailedLogging) {
      console.log(`${logPrefix} Starting error recovery for tab query failure`);
    }

    let lastError: Error | null = null;

    // Strategy 1: Retry tab query with exponential backoff
    for (let attempt = 1; attempt <= this.config.maxRetryAttempts; attempt++) {
      try {
        if (this.config.enableDetailedLogging) {
          console.log(`${logPrefix} Attempt ${attempt}: Retrying tab query`);
        }

        const bestTab = await smartTabSelector.findBestTab();
        if (bestTab) {
          if (this.config.enableDetailedLogging) {
            console.log(`${logPrefix} Successfully recovered with existing tab:`, bestTab.id);
          }
          return bestTab;
        }
      } catch (error) {
        lastError = error as Error;
        if (this.config.enableDetailedLogging) {
          console.warn(`${logPrefix} Attempt ${attempt} failed:`, error);
        }

        if (attempt < this.config.maxRetryAttempts) {
          await this.delay(this.config.retryDelayMs * attempt);
        }
      }
    }

    // Strategy 2: Create fallback tab immediately
    try {
      if (this.config.enableDetailedLogging) {
        console.log(`${logPrefix} Creating fallback tab as recovery strategy`);
      }

      const fallbackTab = await smartTabSelector.createFallbackTab();
      if (this.config.enableDetailedLogging) {
        console.log(`${logPrefix} Successfully created fallback tab:`, fallbackTab.id);
      }
      return fallbackTab;
    } catch (error) {
      if (this.config.enableDetailedLogging) {
        console.error(`${logPrefix} Fallback tab creation failed:`, error);
      }
      lastError = error as Error;
    }

    // Strategy 3: Last resort - throw error with context
    const errorMessage = `Failed to recover from tab query error after all strategies. Last error: ${lastError?.message}`;
    console.error(`${logPrefix} ${errorMessage}`);
    throw new Error(errorMessage);
  }

  /**
   * Handles tab access errors (e.g., tab became invalid)
   */
  async handleTabAccessError(tabId: number): Promise<chrome.tabs.Tab> {
    const logPrefix = '[ErrorRecovery:TabAccess]';

    if (this.config.enableDetailedLogging) {
      console.log(`${logPrefix} Handling access error for tab ${tabId}`);
    }

    let lastError: Error | null = null;

    // Strategy 1: Try to get the tab again (might be temporary issue)
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab && tabValidationService.isValidForSidePanel(tab)) {
        const isAccessible = await tabValidationService.isAccessible(tab);
        if (isAccessible) {
          if (this.config.enableDetailedLogging) {
            console.log(`${logPrefix} Tab ${tabId} is now accessible again`);
          }
          return tab;
        }
      }
    } catch (error) {
      lastError = error as Error;
      if (this.config.enableDetailedLogging) {
        console.warn(`${logPrefix} Tab ${tabId} is no longer accessible:`, error);
      }
    }

    // Strategy 2: Find alternative tab
    try {
      if (this.config.enableDetailedLogging) {
        console.log(`${logPrefix} Finding alternative tab to replace ${tabId}`);
      }

      const alternativeTab = await smartTabSelector.findBestAlternativeTab();
      if (alternativeTab) {
        if (this.config.enableDetailedLogging) {
          console.log(`${logPrefix} Found alternative tab:`, alternativeTab.id);
        }
        return alternativeTab;
      }
    } catch (error) {
      lastError = error as Error;
      if (this.config.enableDetailedLogging) {
        console.warn(`${logPrefix} Failed to find alternative tab:`, error);
      }
    }

    // Strategy 3: Create new tab
    try {
      if (this.config.enableDetailedLogging) {
        console.log(`${logPrefix} Creating new tab to replace inaccessible tab ${tabId}`);
      }

      const newTab = await smartTabSelector.createFallbackTab();
      if (this.config.enableDetailedLogging) {
        console.log(`${logPrefix} Created new tab:`, newTab.id);
      }
      return newTab;
    } catch (error) {
      lastError = error as Error;
      if (this.config.enableDetailedLogging) {
        console.error(`${logPrefix} Failed to create new tab:`, error);
      }
    }

    // Strategy 4: Last resort error
    const errorMessage = `Failed to recover from tab access error for tab ${tabId}. Last error: ${lastError?.message}`;
    console.error(`${logPrefix} ${errorMessage}`);
    throw new Error(errorMessage);
  }

  /**
   * Handles sidepanel API errors
   */
  async handleSidepanelError(tabId: number, operation: string): Promise<RecoveryResult> {
    const logPrefix = '[ErrorRecovery:Sidepanel]';

    if (this.config.enableDetailedLogging) {
      console.log(`${logPrefix} Handling sidepanel error for operation '${operation}' on tab ${tabId}`);
    }

    let attempts = 0;
    let lastError: Error | null = null;

    // Strategy 1: Retry the operation with delay
    for (let attempt = 1; attempt <= this.config.maxRetryAttempts; attempt++) {
      attempts++;
      try {
        if (this.config.enableDetailedLogging) {
          console.log(`${logPrefix} Attempt ${attempt}: Retrying ${operation} on tab ${tabId}`);
        }

        // Verify tab is still valid
        const tab = await chrome.tabs.get(tabId);
        if (!tab || !tabValidationService.isValidForSidePanel(tab)) {
          throw new Error('Tab is no longer valid for sidepanel');
        }

        // Try the sidepanel operation based on the operation type
        if (operation === 'open') {
          await chrome.sidePanel.open({ tabId });
        } else if (operation === 'setOptions') {
          await chrome.sidePanel.setOptions({
            tabId,
            path: 'sidepanel.html',
            enabled: true
          });
        }

        if (this.config.enableDetailedLogging) {
          console.log(`${logPrefix} Successfully recovered ${operation} operation on tab ${tabId}`);
        }

        return {
          success: true,
          tab,
          strategy: 'retry_same_operation',
          attempts
        };

      } catch (error) {
        lastError = error as Error;
        if (this.config.enableDetailedLogging) {
          console.warn(`${logPrefix} Attempt ${attempt} failed:`, error);
        }

        if (attempt < this.config.maxRetryAttempts) {
          await this.delay(this.config.retryDelayMs * attempt);
        }
      }
    }

    // Strategy 2: Try with a different tab
    try {
      if (this.config.enableDetailedLogging) {
        console.log(`${logPrefix} Trying ${operation} with alternative tab`);
      }

      const alternativeTab = await this.handleTabAccessError(tabId);

      if (operation === 'open') {
        await chrome.sidePanel.open({ tabId: alternativeTab.id! });
      } else if (operation === 'setOptions') {
        await chrome.sidePanel.setOptions({
          tabId: alternativeTab.id!,
          path: 'sidepanel.html',
          enabled: true
        });
      }

      if (this.config.enableDetailedLogging) {
        console.log(`${logPrefix} Successfully recovered with alternative tab:`, alternativeTab.id);
      }

      return {
        success: true,
        tab: alternativeTab,
        strategy: 'find_alternative_tab',
        attempts: attempts + 1
      };

    } catch (error) {
      lastError = error as Error;
      if (this.config.enableDetailedLogging) {
        console.error(`${logPrefix} Alternative tab strategy failed:`, error);
      }
    }

    // Final failure
    return {
      success: false,
      error: `Failed to recover sidepanel ${operation} operation. Last error: ${lastError?.message}`,
      strategy: 'all_strategies_failed',
      attempts: attempts + 1
    };
  }

  /**
   * Comprehensive recovery for the minimize to sidepanel operation
   */
  async recoverMinimizeToSidepanel(): Promise<chrome.tabs.Tab> {
    const logPrefix = '[ErrorRecovery:MinimizeToSidepanel]';

    if (this.config.enableDetailedLogging) {
      console.log(`${logPrefix} Starting comprehensive recovery for minimize to sidepanel`);
    }

    try {
      // Step 1: Ensure we have a valid tab
      const validTab = await smartTabSelector.ensureValidTab();

      if (this.config.enableDetailedLogging) {
        console.log(`${logPrefix} Ensured valid tab:`, validTab.id, validTab.url);
      }

      // Step 2: Try to open sidepanel on the valid tab
      const sidepanelResult = await this.handleSidepanelError(validTab.id!, 'open');

      if (!sidepanelResult.success) {
        throw new Error(sidepanelResult.error);
      }

      // Step 3: Set sidepanel options
      const optionsResult = await this.handleSidepanelError(validTab.id!, 'setOptions');

      if (!optionsResult.success) {
        // Sidepanel opened but options failed - still usable
        if (this.config.enableDetailedLogging) {
          console.warn(`${logPrefix} Sidepanel options failed but panel is open:`, optionsResult.error);
        }
      }

      return validTab;

    } catch (error) {
      const errorMessage = `Complete recovery failure for minimize to sidepanel: ${(error as Error).message}`;
      console.error(`${logPrefix} ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  /**
   * Updates error recovery configuration
   */
  updateConfig(config: Partial<ErrorRecoveryConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Gets current configuration
   */
  getConfig(): ErrorRecoveryConfig {
    return { ...this.config };
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


}

// Export singleton instance
export const errorRecoveryManager = new ErrorRecoveryManager();