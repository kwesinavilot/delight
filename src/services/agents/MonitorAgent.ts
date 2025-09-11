import { AIService } from '../ai/AIService';
import { AgentMessenger } from '../messaging/AgentMessenger';
import { AgentMessage, ValidateRequest, ValidateResponse } from '../messaging/MessageTypes';
import { AgentMemory } from './AgentMemory';

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  feedback: string;
  suggestions: string[];
}

export class MonitorAgent {
  private aiService: AIService;
  private messenger: AgentMessenger;
  private memory: AgentMemory;

  constructor() {
    console.log('🔍 [MonitorAgent] Initializing...');
    this.aiService = AIService.getInstance();
    this.messenger = AgentMessenger.getInstance();
    this.memory = new AgentMemory();
    
    this.messenger.registerHandler('monitor', 'validate_request', this.handleValidateRequest.bind(this));
  }

  async initialize(): Promise<void> {
    await this.aiService.initialize();
  }

  private async handleValidateRequest(message: AgentMessage): Promise<void> {
    const request = message.payload as ValidateRequest;
    const validation = await this.validateStep(request.step, request.result, request.expectedOutcome);
    
    this.messenger.sendMessage('monitor', message.from, 'validate_response', validation);
  }

  async validateStep(step: any, result: any, expectedOutcome?: string): Promise<ValidateResponse> {
    console.log('🔍 [MonitorAgent] Validating step:', step.type);
    
    this.memory.remember('lastValidation', { step, result, expectedOutcome }, 'state');
    
    try {
      const prompt = `Validate this automation step:

Step: ${JSON.stringify(step)}
Result: ${JSON.stringify(result)}
Expected: ${expectedOutcome || 'Not specified'}

Check if the step completed successfully and achieved its goal.
Respond with JSON:
{
  "isValid": true/false,
  "confidence": 0.8,
  "feedback": "Detailed assessment",
  "suggestions": ["suggestion1", "suggestion2"]
}`;
      
      const response = await this.aiService.generateChatResponse(prompt);
      
      let validation;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        validation = JSON.parse(jsonMatch?.[0] || '{}');
      } catch {
        validation = {
          isValid: !response.toLowerCase().includes('error'),
          confidence: 0.5,
          feedback: response,
          suggestions: []
        };
      }
      
      return validation;
      
    } catch (error) {
      console.error('❌ [MonitorAgent] Validation failed:', error);
      return {
        isValid: false,
        confidence: 0.1,
        feedback: `Validation error: ${error}`,
        suggestions: ['Retry validation', 'Check system status']
      };
    }
  }

  async validateResult(result: any): Promise<{ isValid: boolean; message?: string }> {
    try {
      if (result === null || result === undefined) {
        return { isValid: false, message: 'No result returned' };
      }

      if (Array.isArray(result) && result.length === 0) {
        return { isValid: false, message: 'Empty result array' };
      }

      if (typeof result === 'object' && result.error) {
        return { isValid: false, message: result.error };
      }

      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async trackProgress(stepId: string, status: string): Promise<void> {
    console.log(`Step ${stepId}: ${status}`);
  }
}