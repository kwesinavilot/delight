/**
 * Tab Validation Service
 * 
 * Provides validation, accessibility checking, and scoring for Chrome tabs
 * to support smart tab management in sidepanel operations.
 */

import type { TabScore, TabValidationService } from '@/types/tabs';

/**
 * Implementation of Tab Validation Service
 */
export class TabValidationServiceImpl implements TabValidationService {
  // Restricted URL patterns that cannot be used with sidepanel
  private readonly restrictedPatterns = [
    /^chrome:\/\//,           // Chrome internal pages
    /^chrome-extension:\/\//, // Extension pages
    /^file:\/\//,            // Local file URLs (main cause of ERR_FILE_NOT_FOUND)
    /^about:/,               // Browser about pages
    /^moz-extension:\/\//,   // Firefox extension pages (future compatibility)
    /^edge-extension:\/\//,  // Edge extension pages (future compatibility)
    /^safari-extension:\/\//, // Safari extension pages (future compatibility)
  ];

  // Valid URL patterns that work well with sidepanel
  private readonly validPatterns = [
    /^https?:\/\//,          // HTTP/HTTPS pages
  ];

  /**
   * Validates if a tab is suitable for sidepanel attachment
   */
  isValidForSidePanel(tab: chrome.tabs.Tab): boolean {
    if (!tab.url) {
      return false;
    }

    // Check against restricted patterns
    for (const pattern of this.restrictedPatterns) {
      if (pattern.test(tab.url)) {
        return false;
      }
    }

    // Check against valid patterns
    for (const pattern of this.validPatterns) {
      if (pattern.test(tab.url)) {
        return true;
      }
    }

    // Special case: allow blank pages and new tab pages
    if (tab.url === 'about:blank' || 
        tab.url === 'chrome://newtab/' || 
        tab.url.includes('newtab')) {
      return true;
    }

    // Default to false for unknown patterns
    return false;
  }

  /**
   * Checks if a tab is accessible and not in an error state
   */
  async isAccessible(tab: chrome.tabs.Tab): Promise<boolean> {
    if (!tab.id || !tab.url) {
      return false;
    }

    try {
      // Basic validation first
      if (!this.isValidForSidePanel(tab)) {
        return false;
      }

      // Check tab status
      if (tab.status === 'loading') {
        // Tab is still loading, might be accessible soon
        return true;
      }

      // Check if tab is discarded (memory optimization)
      if (tab.discarded) {
        // Discarded tabs can be reactivated
        return true;
      }

      // For HTTP/HTTPS URLs, we assume they're accessible if they pass basic validation
      // We can't easily check for 404s or other errors without injecting content scripts
      if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
        return true;
      }

      // For other valid URLs (like about:blank), they should be accessible
      return true;

    } catch (error) {
      console.warn('Error checking tab accessibility:', error);
      return false;
    }
  }

  /**
   * Calculates a priority score for tab selection
   * Higher scores indicate better candidates for sidepanel attachment
   */
  getTabScore(tab: chrome.tabs.Tab): number {
    const detailedScore = this.getDetailedTabScore(tab);
    return detailedScore.score;
  }

  /**
   * Calculates a detailed priority score with reasoning
   */
  getDetailedTabScore(tab: chrome.tabs.Tab): TabScore {
    const reasons: string[] = [];
    let score = 0;
    // const now = Date.now();
    const lastActive = 0; // Chrome tabs API doesn't reliably provide lastAccessed

    // Basic validation check
    const isValid = this.isValidForSidePanel(tab);
    if (!isValid) {
      score -= 100;
      reasons.push('Invalid URL pattern');
    }

    // Active tab bonus (since we can't reliably get lastAccessed)
    if (tab.active) {
      score += 100;
      reasons.push('Currently active tab');
    }

    // URL type scoring
    if (tab.url) {
      if (tab.url.startsWith('https://')) {
        score += 50;
        reasons.push('Secure HTTPS page');
      } else if (tab.url.startsWith('http://')) {
        score += 30;
        reasons.push('HTTP page');
      } else if (tab.url === 'about:blank' || tab.url.includes('newtab')) {
        score += 20;
        reasons.push('Blank/new tab page');
      }

      // Penalize restricted URLs
      for (const pattern of this.restrictedPatterns) {
        if (pattern.test(tab.url)) {
          score -= 50;
          reasons.push('Restricted URL pattern');
          break;
        }
      }
    }

    // Tab state scoring (active tab already handled above)

    if (tab.status === 'complete') {
      score += 20;
      reasons.push('Page fully loaded');
    } else if (tab.status === 'loading') {
      score += 10;
      reasons.push('Page loading');
    }

    // Window context scoring
    if (tab.windowId === chrome.windows.WINDOW_ID_CURRENT) {
      score += 20;
      reasons.push('In current window');
    }

    // Penalize pinned tabs (they're usually important and shouldn't be modified)
    if (tab.pinned) {
      score -= 10;
      reasons.push('Pinned tab (less suitable)');
    }

    // Penalize discarded tabs slightly
    if (tab.discarded) {
      score -= 5;
      reasons.push('Discarded tab');
    }

    // Has title and favicon (indicates content)
    if (tab.title && tab.title !== 'New Tab' && tab.title.trim() !== '') {
      score += 10;
      reasons.push('Has meaningful title');
    }

    if (tab.favIconUrl) {
      score += 5;
      reasons.push('Has favicon');
    }

    return {
      tabId: tab.id || -1,
      score,
      reasons,
      lastActive,
      isValid
    };
  }
}

// Export singleton instance
export const tabValidationService = new TabValidationServiceImpl();