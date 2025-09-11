export type AgentType = 'planner' | 'navigator' | 'monitor';

export interface AgentMessage {
  from: AgentType;
  to: AgentType;
  type: 'plan' | 'execute' | 'validate' | 'error' | 'progress';
  payload: any;
  timestamp: number;
}

export type ActionType = 
  // Core Navigation
  | 'navigate' | 'goBack' | 'forward' | 'refresh' | 'newTab' | 'closeTab' | 'switchTab'
  // Element Interaction  
  | 'click' | 'clickElement' | 'doubleClick' | 'rightClick' | 'hover' | 'drag' | 'focus'
  // Form & Input
  | 'fill' | 'inputText' | 'clear' | 'select' | 'selectDropdownOption' | 'getDropdownOptions'
  | 'check' | 'uncheck' | 'radio' | 'upload' | 'submit'
  // Data Extraction
  | 'extract' | 'extractText' | 'screenshot' | 'getUrl' | 'getTitle' | 'getCookies' | 'getLocalStorage'
  // DOM Analysis
  | 'analyzePage' | 'clearHighlights'
  // Scrolling Actions
  | 'scroll' | 'scrollToPercent' | 'scrollToText' | 'scrollToTop' | 'scrollToBottom'
  // Keyboard Actions
  | 'sendKeys' | 'type'
  // Waiting & Timing
  | 'wait' | 'waitForElement' | 'waitForText' | 'waitForUrl' | 'waitForLoad'
  // Utility Actions
  | 'cacheContent' | 'executeScript' | 'setViewport' | 'authenticate' | 'handleAlert' | 'switchFrame'
  // Validation
  | 'verify' | 'verifyText' | 'verifyUrl' | 'verifyAttribute'
  // Multi-Page
  | 'openInNewTab' | 'comparePages' | 'aggregateData' | 'parallelExecution'
  // Specialized Actions
  | 'search' | 'handleForm' | 'extractData' | 'recoverError';

export interface TaskStep {
  id: string;
  type: ActionType;
  selector?: string;
  elementIndex?: number;
  url?: string;
  data?: any;
  tabId?: number;
  timeout?: number;
  expected?: any;
  expectedOutcome?: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface TaskPlan {
  id: string;
  description: string;
  steps: TaskStep[];
  estimatedDuration: number;
  status: 'planning' | 'executing' | 'completed' | 'failed';
}

export interface AgentConfig {
  type: AgentType;
  provider: string;
  model: string;
  systemPrompt: string;
}

export interface AutomationResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}