/**
 * Types for Tab Management Services
 */

export interface TabScore {
  tabId: number;
  score: number;
  reasons: string[];
  lastActive: number;
  isValid: boolean;
}

export interface TabValidationService {
  isValidForSidePanel(tab: chrome.tabs.Tab): boolean;
  isAccessible(tab: chrome.tabs.Tab): Promise<boolean>;
  getTabScore(tab: chrome.tabs.Tab): number;
  getDetailedTabScore(tab: chrome.tabs.Tab): TabScore;
}

export interface SmartTabSelector {
  findBestTab(options?: TabSelectionOptions): Promise<chrome.tabs.Tab | null>;
  createFallbackTab(): Promise<chrome.tabs.Tab>;
  ensureValidTab(): Promise<chrome.tabs.Tab>;
}

export interface TabSelectionOptions {
  excludeCurrentTab?: boolean;
  preferRecentlyActive?: boolean;
  windowId?: number;
}

export interface FallbackConfig {
  defaultNewTabUrl: string;
  maxRetryAttempts: number;
  retryDelayMs: number;
  enableLogging: boolean;
}

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