export interface DOMElementNode {
  index: number;
  tagName: string;
  selector: string;
  xpath: string;
  text: string;
  isVisible: boolean;
  isInteractive: boolean;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    left: number;
    bottom: number;
    right: number;
  };
  attributes: Record<string, string>;
  children: DOMElementNode[];
}

export interface BrowserState {
  url: string;
  title: string;
  readyState: string;
  scrollY: number;
  scrollHeight: number;
  viewportHeight: number;
  timestamp: number;
  elementTree?: DOMElementNode;
  selectorMap?: Map<number, DOMElementNode>;
  tabs?: TabInfo[];
}

export interface TabInfo {
  id: number;
  url: string;
  title: string;
  active: boolean;
}

export interface ActionContext {
  browser: any; // CDPBrowser instance
  stateManager: any; // BrowserStateManager instance
  tabId: number;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  retryable?: boolean;
  timestamp?: number;
}

export interface AutomationMetrics {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  averageExecutionTime: number;
  retryCount: number;
  errorTypes: Record<string, number>;
}

export interface ElementHighlight {
  index: number;
  element: DOMElementNode;
  color: string;
  visible: boolean;
}

export interface ViewportInfo {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  devicePixelRatio: number;
}

export interface PageAnalysis {
  elements: DOMElementNode[];
  elementTree: DOMElementNode;
  selectorMap: Record<number, DOMElementNode>;
  interactiveCount: number;
  url: string;
  title: string;
  viewport: ViewportInfo;
  timestamp: number;
  performanceMetrics?: {
    analysisTime: number;
    elementCount: number;
    cacheHitRate: number;
  };
}

export interface BrowserConnection {
  tabId: number;
  connected: boolean;
  debuggerAttached: boolean;
  lastActivity: number;
  capabilities: string[];
}

export interface AutomationSession {
  id: string;
  startTime: number;
  endTime?: number;
  tabId: number;
  actions: ActionResult[];
  metrics: AutomationMetrics;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
}

export type ExecutionMode = 'index' | 'selector' | 'query' | 'xpath';

export interface SmartActionConfig {
  mode: ExecutionMode;
  fallbackModes: ExecutionMode[];
  timeout: number;
  retryAttempts: number;
  fuzzyMatch: boolean;
  highlightElements: boolean;
}

export interface ChangeDetectionResult {
  hasChanges: boolean;
  changedElements: number[];
  newElements: number[];
  removedElements: number[];
  urlChanged: boolean;
  scrollChanged: boolean;
  timestamp: number;
}

export interface ElementSearchOptions {
  fuzzy: boolean;
  caseSensitive: boolean;
  includeHidden: boolean;
  maxResults: number;
  sortBy: 'relevance' | 'position' | 'size';
}

export interface PerformanceOptimization {
  domCaching: boolean;
  viewportFiltering: boolean;
  changeDetection: boolean;
  throttledEvents: boolean;
  networkIdleDetection: boolean;
}

export interface ErrorRecoveryStrategy {
  maxRetries: number;
  backoffMultiplier: number;
  fallbackActions: string[];
  notificationLevel: 'silent' | 'warning' | 'error';
}

export interface MultiFrameSupport {
  traverseIframes: boolean;
  shadowDomSupport: boolean;
  crossOriginHandling: boolean;
  frameTimeout: number;
}

export interface AutomationConfig {
  performance: PerformanceOptimization;
  errorRecovery: ErrorRecoveryStrategy;
  multiFrame: MultiFrameSupport;
  smartActions: SmartActionConfig;
  debugging: {
    verbose: boolean;
    logActions: boolean;
    saveScreenshots: boolean;
    recordMetrics: boolean;
  };
}