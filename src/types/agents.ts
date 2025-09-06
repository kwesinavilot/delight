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
  | 'navigate' | 'back' | 'forward' | 'refresh' | 'newTab' | 'closeTab' | 'switchTab'
  // Element Interaction  
  | 'click' | 'doubleClick' | 'rightClick' | 'hover' | 'drag' | 'scroll' | 'focus'
  // Form & Input
  | 'fill' | 'clear' | 'select' | 'check' | 'uncheck' | 'radio' | 'upload' | 'submit'
  // Data Extraction
  | 'extract' | 'screenshot' | 'getUrl' | 'getTitle' | 'getCookies' | 'getLocalStorage'
  // Waiting & Timing
  | 'wait' | 'waitForElement' | 'waitForText' | 'waitForUrl' | 'waitForLoad'
  // Advanced Actions
  | 'executeScript' | 'setViewport' | 'authenticate' | 'handleAlert' | 'switchFrame' | 'downloadFile'
  // Validation
  | 'verify' | 'verifyText' | 'verifyUrl' | 'verifyAttribute'
  // Multi-Page
  | 'openInNewTab' | 'comparePages' | 'aggregateData' | 'parallelExecution';

export interface TaskStep {
  id: string;
  type: ActionType;
  selector?: string;
  url?: string;
  data?: any;
  tabId?: number;
  timeout?: number;
  expected?: any;
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