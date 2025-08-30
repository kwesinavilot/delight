/**
 * Tab Management Services
 */

export { TabValidationServiceImpl, tabValidationService } from './TabValidationService';
export { SmartTabSelectorImpl, smartTabSelector } from './SmartTabSelector';
export { ErrorRecoveryManager, errorRecoveryManager } from './ErrorRecoveryManager';
export { EnhancedSidepanelManager, enhancedSidepanelManager } from './EnhancedSidepanelManager';
export { PerformanceOptimizer, performanceOptimizer } from './PerformanceOptimizer';
export type { 
  TabValidationService, 
  TabScore, 
  TabSelectionOptions, 
  FallbackConfig,
  ErrorRecoveryConfig,
  RecoveryResult,
  SidepanelTransitionOptions,
  SidepanelTransitionResult
} from '@/types/tabs';