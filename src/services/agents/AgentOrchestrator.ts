import { TaskPlan, TaskStep, AutomationResult } from '../../types/agents';
import { PlannerAgent } from './PlannerAgent';
import { NavigatorAgent } from './NavigatorAgent';
import { MonitorAgent } from './MonitorAgent';
import { AgentMemory } from './AgentMemory';
import { AgentMessenger } from '../messaging/AgentMessenger';
import { PageAnalyzerAgent } from './PageAnalyzerAgent';
import { FormHandlerAgent } from './FormHandlerAgent';
import { DataExtractorAgent } from './DataExtractorAgent';
// import { ErrorRecoveryAgent } from './ErrorRecoveryAgent';
// import { ValidatorAgent } from './ValidatorAgent';
import { SearchAgent } from './SearchAgent';

export class AgentOrchestrator {
  private static instance: AgentOrchestrator;
  private planner: PlannerAgent;
  private navigator: NavigatorAgent;
  private monitor: MonitorAgent;
  private memory: AgentMemory;
  private messenger: AgentMessenger;
  private pageAnalyzer: PageAnalyzerAgent;
  private formHandler: FormHandlerAgent;
  private dataExtractor: DataExtractorAgent;
  // Specialized agents available but not in main flow (kept for future use)
  // private readonly errorRecovery: ErrorRecoveryAgent;
  // private readonly validator: ValidatorAgent;
  private searchAgent: SearchAgent;
  private currentTask: TaskPlan | null = null;
  private progressCallback?: (progress: any) => void;
  private isExecuting: boolean = false;
  private shouldStop: boolean = false;

  private constructor() {
    console.log('🤖 [AgentOrchestrator] Initializing...');
    this.memory = new AgentMemory();
    this.messenger = AgentMessenger.getInstance();
    this.planner = new PlannerAgent();
    this.navigator = new NavigatorAgent();
    this.monitor = new MonitorAgent();
    this.pageAnalyzer = new PageAnalyzerAgent();
    this.formHandler = new FormHandlerAgent();
    this.dataExtractor = new DataExtractorAgent();
    // this.errorRecovery = new ErrorRecoveryAgent();
    // this.validator = new ValidatorAgent();
    this.searchAgent = new SearchAgent();
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
    console.log('🤖 [AgentOrchestrator] Starting task:', userInput);
    
    // Start conversation and store context
    this.messenger.startConversation(taskId);
    this.memory.remember('currentTask', userInput, 'context');
    this.memory.addToConversation('user', userInput);
    
    if (this.isExecuting) {
      throw new Error('Another task is already executing');
    }
    
    this.isExecuting = true;
    this.shouldStop = false;
    
    try {
      // Initialize agents
      await this.initialize();
      
      // Step 1: Create plan
      console.log('🧠 [AgentOrchestrator] Creating plan...');
      this.updateProgress({ stage: 'planning', message: 'Creating execution plan...' });
      callbacks?.onProgress?.('Creating execution plan...');
      
      // Send plan request via messenger
      this.messenger.sendMessage('orchestrator' as any, 'planner', 'plan_request', {
        userInput,
        context: this.memory.getConversationContext(),
        previousResults: this.memory.recallByType('result')
      });
      
      const plan = await this.planner.createPlan(userInput);
      console.log('📋 [AgentOrchestrator] Plan:', plan.steps.map(s => `${s.type}: ${s.description}`));
      
      // Store plan in memory
      this.memory.remember('currentPlan', plan, 'plan');
      this.memory.addToConversation('planner', `Created plan with ${plan.steps.length} steps`);
      
      this.currentTask = { ...plan, id: taskId };
      callbacks?.onPlanCreated?.(plan.steps);

      // Step 2: Execute steps
      console.log('⚡ [AgentOrchestrator] Executing steps...');
      this.updateProgress({ stage: 'executing', message: 'Executing steps...' });
      callbacks?.onProgress?.('Executing steps...');
      
      const results = await this.executeIteratively(userInput, callbacks);

      // Step 3: Validate
      console.log('🔍 [AgentOrchestrator] Validating...');
      this.updateProgress({ stage: 'validating', message: 'Validating results...' });
      callbacks?.onProgress?.('Validating results...');
      
      const validation = await this.monitor.validateResult(results);

      const finalResult = {
        taskId,
        success: validation.isValid,
        data: results,
        executionTime: Date.now() - parseInt(taskId.split('_')[1])
      };
      
      console.log('🎉 [AgentOrchestrator] Task completed:', finalResult.success);
      return finalResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('💥 [AgentOrchestrator] Task failed:', errorMessage);
      return {
        taskId,
        success: false,
        error: errorMessage,
        executionTime: Date.now() - parseInt(taskId.split('_')[1])
      };
    } finally {
      this.isExecuting = false;
      this.shouldStop = false;
      this.currentTask = null;
    }
  }

  private async executeIteratively(userInput: string, callbacks?: {
    onStepStart?: (stepIndex: number, step: TaskStep) => void;
    onStepComplete?: (stepIndex: number, step: TaskStep, result: any) => void;
    onStepError?: (stepIndex: number, step: TaskStep, error: string) => void;
  }): Promise<any> {
    const maxIterations = 20;
    let iteration = 0;
    const results: any[] = [];
    
    while (iteration < maxIterations) {
      iteration++;
      
      if (this.shouldStop) {
        throw new Error('Task stopped by user');
      }
      
      console.log(`🔄 [AgentOrchestrator] Iteration ${iteration}: Planning next step...`);
      
      // Get next plan from Planner (using memory context)
      const plan = await this.planner.createPlan(userInput, {
        iteration,
        previousResults: results,
        conversationHistory: this.memory.getConversationContext()
      });
      
      if (!plan.steps || plan.steps.length === 0) {
        console.log('🎉 [AgentOrchestrator] No more steps - task complete!');
        break;
      }
      
      // Execute first step from plan
      const step = plan.steps[0];
      console.log(`⚡ [AgentOrchestrator] Iteration ${iteration}: ${step.description}`);
      
      callbacks?.onStepStart?.(iteration - 1, step);
      
      try {
        // Simple execution - no complex routing
        const result = await this.navigator.executeStep(step);
        
        console.log(`✅ [AgentOrchestrator] Iteration ${iteration} completed`);
        results.push(result);
        
        // Store result in shared memory
        this.memory.remember(`iteration_${iteration}_result`, result, 'result');
        this.memory.addToConversation('orchestrator', `Completed: ${step.type}`);
        
        callbacks?.onStepComplete?.(iteration - 1, step, result);
        
        // Check if task is complete
        if (this.isTaskComplete(step, result)) {
          console.log('🎉 [AgentOrchestrator] Task completed successfully!');
          break;
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ [AgentOrchestrator] Iteration ${iteration} failed:`, errorMessage);
        
        // Store error in memory for next planning
        this.memory.remember(`iteration_${iteration}_error`, errorMessage, 'result');
        this.memory.addToConversation('orchestrator', `Error: ${errorMessage}`);
        
        callbacks?.onStepError?.(iteration - 1, step, errorMessage);
        
        // Continue to next iteration - let Planner handle the error
      }
    }
    
    return results;
  }
  
  private isTaskComplete(step: TaskStep, result: any): boolean {
    // Task is complete if we extracted final data or reached a completion state
    if (step.type === 'extract' && result.success) {
      return true;
    }
    
    // Task is complete if we successfully submitted a form or completed a search
    if ((step.type === 'click' || step.type === 'fill') && 
        step.description.toLowerCase().includes('submit') && 
        result.success) {
      return true;
    }
    
    return false;
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
    console.log('🛑 [AgentOrchestrator] Stopping task...');
    this.shouldStop = true;
    if (this.currentTask) {
      this.currentTask.status = 'failed';
    }
    await this.navigator.stop();
  }
  
  // Specialized agents available but not in main flow
  // Can be used for specific tasks when needed
  async useFormHandler(step: TaskStep): Promise<any> {
    const pageContext = await this.pageAnalyzer.analyzePage((this.navigator as any).automation);
    return await this.formHandler.handleFormStep(step, pageContext, (this.navigator as any).automation);
  }
  
  async useDataExtractor(step: TaskStep): Promise<any> {
    const pageContext = await this.pageAnalyzer.analyzePage((this.navigator as any).automation);
    return await this.dataExtractor.extractData(step, pageContext, (this.navigator as any).automation);
  }
  
  async useSearchAgent(step: TaskStep): Promise<any> {
    const pageContext = await this.pageAnalyzer.analyzePage((this.navigator as any).automation);
    return await this.searchAgent.executeSearch(step, pageContext, (this.navigator as any).automation);
  }
  
  isTaskExecuting(): boolean {
    return this.isExecuting;
  }
}