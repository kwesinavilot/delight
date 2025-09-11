export type AgentRole = 'planner' | 'navigator' | 'monitor';

export type MessageType = 
  | 'plan_request'
  | 'plan_response'
  | 'execute_request'
  | 'execute_response'
  | 'validate_request'
  | 'validate_response'
  | 'error'
  | 'status_update';

export interface AgentMessage {
  id: string;
  from: AgentRole;
  to: AgentRole;
  type: MessageType;
  payload: any;
  timestamp: number;
  conversationId?: string;
}

export interface PlanRequest {
  userInput: string;
  context?: any;
  previousResults?: any[];
}

export interface PlanResponse {
  steps: any[];
  reasoning: string;
  estimatedDuration: number;
}

export interface ExecuteRequest {
  step: any;
  context?: any;
}

export interface ExecuteResponse {
  success: boolean;
  result?: any;
  error?: string;
  pageState?: any;
}

export interface ValidateRequest {
  step: any;
  result: any;
  expectedOutcome?: string;
}

export interface ValidateResponse {
  isValid: boolean;
  confidence: number;
  feedback: string;
  suggestions?: string[];
}

export interface StatusUpdate {
  status: 'idle' | 'thinking' | 'executing' | 'validating' | 'error';
  message: string;
  progress?: number;
}