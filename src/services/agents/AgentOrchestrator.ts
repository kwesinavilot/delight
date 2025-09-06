import { TaskPlan, TaskStep, AutomationResult } from '../../types/agents';
import { PlannerAgent } from './PlannerAgent';
import { NavigatorAgent } from './NavigatorAgent';
import { MonitorAgent } from './MonitorAgent';

export class AgentOrchestrator {
  private static instance: AgentOrchestrator;
  private planner: PlannerAgent;
  private navigator: NavigatorAgent;
  private monitor: MonitorAgent;
  private currentTask: TaskPlan | null = null;
  private progressCallback?: (progress: any) => void;

  private constructor() {
    console.log('🤖 [AgentOrchestrator] Initializing agent system...');
    this.planner = new PlannerAgent();
    this.navigator = new NavigatorAgent();
    this.monitor = new MonitorAgent();
    console.log('✅ [AgentOrchestrator] Agent system initialized');
  }

  static getInstance(): AgentOrchestrator {
    if (!AgentOrchestrator.instance) {
      AgentOrchestrator.instance = new AgentOrchestrator();
    }
    return AgentOrchestrator.instance;
  }

  async initialize(): Promise<void> {
    await this.planner.initialize();
    await this.navigator.initialize();
    await this.monitor.initialize();
  }

  setProgressCallback(callback: (progress: any) => void): void {
    this.progressCallback = callback;
  }

  async executeTask(userInput: string, callbacks?: {
    onPlanCreated?: (plan: TaskStep[]) => void;
    onStepStart?: (stepIndex: number, step: TaskStep) => void;
    onStepComplete?: (stepIndex: number, step: TaskStep, result: any) => void;
    onStepError?: (stepIndex: number, step: TaskStep, error: string) => void;
    onProgress?: (message: string) => void;
  }): Promise<AutomationResult> {
    const taskId = `task_${Date.now()}`;
    console.log('🤖 [AgentOrchestrator] Starting task execution:', userInput);
    
    try {
      // Step 1: Planning
      console.log('🧠 [AgentOrchestrator] Creating execution plan...');
      this.updateProgress({ stage: 'planning', message: 'Creating execution plan...' });
      callbacks?.onProgress?.('Creating execution plan...');
      
      const plan = await this.planner.createPlan(userInput);
      console.log('📋 [AgentOrchestrator] Plan created:', plan);
      this.currentTask = { ...plan, id: taskId };
      callbacks?.onPlanCreated?.(plan.steps);

      // Step 2: Execution
      console.log('⚡ [AgentOrchestrator] Starting task execution...');
      this.updateProgress({ stage: 'executing', message: 'Starting task execution...' });
      callbacks?.onProgress?.('Starting task execution...');
      
      const result = await this.executeSteps(plan.steps, callbacks);

      // Step 3: Validation
      console.log('🔍 [AgentOrchestrator] Validating results...');
      this.updateProgress({ stage: 'validating', message: 'Validating results...' });
      callbacks?.onProgress?.('Validating results...');
      
      const validation = await this.monitor.validateResult(result);
      console.log('📊 [AgentOrchestrator] Validation complete:', validation);

      const finalResult = {
        taskId,
        success: validation.isValid,
        data: result,
        executionTime: Date.now() - parseInt(taskId.split('_')[1])
      };
      
      console.log('🎉 [AgentOrchestrator] Task execution completed:', finalResult);
      return finalResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('💥 [AgentOrchestrator] Task execution failed:', errorMessage, error);
      return {
        taskId,
        success: false,
        error: errorMessage,
        executionTime: Date.now() - parseInt(taskId.split('_')[1])
      };
    }
  }

  private async executeSteps(steps: TaskStep[], callbacks?: {
    onStepStart?: (stepIndex: number, step: TaskStep) => void;
    onStepComplete?: (stepIndex: number, step: TaskStep, result: any) => void;
    onStepError?: (stepIndex: number, step: TaskStep, error: string) => void;
  }): Promise<any> {
    const results: any[] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`⚡ [AgentOrchestrator] Executing step ${i + 1}/${steps.length}:`, step);
      
      this.updateProgress({ 
        stage: 'executing', 
        message: `Executing: ${step.description}`,
        currentStep: step.id
      });
      
      callbacks?.onStepStart?.(i, step);

      try {
        const result = await this.navigator.executeStep(step);
        console.log(`✅ [AgentOrchestrator] Step ${i + 1} completed:`, result);
        results.push(result);
        step.status = 'completed';
        callbacks?.onStepComplete?.(i, step, result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ [AgentOrchestrator] Step ${i + 1} failed:`, errorMessage, error);
        step.status = 'failed';
        callbacks?.onStepError?.(i, step, errorMessage);
        throw error;
      }
    }

    return results;
  }

  private updateProgress(progress: any): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  getCurrentTask(): TaskPlan | null {
    return this.currentTask;
  }

  async stopCurrentTask(): Promise<void> {
    if (this.currentTask) {
      this.currentTask.status = 'failed';
      await this.navigator.stop();
    }
  }
}