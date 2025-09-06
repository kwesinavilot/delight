export type AgentType = 'planner' | 'navigator' | 'monitor';

export interface AgentMessage {
  from: AgentType;
  to: AgentType;
  type: 'plan' | 'execute' | 'validate' | 'error' | 'progress';
  payload: any;
  timestamp: number;
}

export interface TaskStep {
  id: string;
  type: 'navigate' | 'click' | 'extract' | 'fill' | 'wait';
  selector?: string;
  url?: string;
  data?: any;
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