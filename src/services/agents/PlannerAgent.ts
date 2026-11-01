import { AIService } from '../ai/AIService';
import { TaskPlan } from '../../types/agents';
import { GeminiProvider } from '../ai/providers/GeminiProvider';
import { AgentMemory } from './AgentMemory';

export class PlannerAgent {
  private static readonly PLANNER_TIMEOUT_MS = 30000;
  private aiService: AIService;
  private memory: AgentMemory;

  constructor() {
    console.log('🧠 [PlannerAgent] Initializing...');
    this.aiService = AIService.getInstance();
    this.memory = new AgentMemory();
  }

  async initialize(): Promise<void> {
    await this.aiService.initialize();
    if (!this.aiService.isCurrentProviderConfigured()) {
      const provider = this.aiService.getCurrentProviderName() || 'selected provider';
      throw new Error(`Configure an API key for ${provider} before starting an agent task.`);
    }
  }

  async createPlan(userInput: string, context?: any): Promise<TaskPlan> {
    console.log('🧠 [PlannerAgent] Creating plan for:', userInput);
    
    // Store in memory
    this.memory.addToConversation('user', userInput);
    if (context) {
      this.memory.remember('currentContext', context, 'context');
    }
    
    const conversationHistory = this.memory.getConversationContext(5);
    const previousResults = context?.previousResults || this.memory.recallByType('result');
    const latestResult = context?.lastResult;
    
    const prompt = `You are a web automation planner using available tools.

Available Tools:
- navigate(url): Navigate to a website
- analyzePage(): Get numbered interactive elements from current page  
- clickElement(index): Click element by number
- fillElement(index, text): Fill input by number
- wait(seconds): Wait for loading

Conversation History:
${conversationHistory.map(h => `${h.role}: ${h.content}`).join('\n')}

Previous Results:
${JSON.stringify(previousResults.slice(-3))}

Latest browser result:
${JSON.stringify(latestResult || null)}

Task: ${userInput}

Create the next best browser action as JSON. When a latest browser result is present, return exactly ONE step and use the current page state; do not repeat a navigation that already succeeded. Only navigate when the current URL is not the requested destination. Use the element indexes from the latest browser result, never guessed indexes.

JSON format:
{
  "description": "What we're doing",
  "steps": [
    {"id": "step_1", "type": "navigate", "url": "https://example.com", "description": "Navigate to site"}
  ],
  "estimatedDuration": 10000
}`;

    try {
      console.log('🤖 [PlannerAgent] Sending request to AI...');
      
      // Check if we can use structured output with Gemini
      const currentProvider = this.aiService.getCurrentProvider();
      let plan: any;
      
      if (currentProvider instanceof GeminiProvider && currentProvider.supportsStructuredOutput()) {
        console.log('🎆 [PlannerAgent] Using Gemini structured output...');
        
        const structuredPrompt = `Choose the next single browser action for this request. Observe the latest browser result and do not repeat completed actions. Request: ${userInput}\n\nLatest context: ${JSON.stringify(latestResult || null)}\n\nReturn one executable step only.`;
        const schema = GeminiProvider.createTaskPlanSchema();
        
        plan = await this.withTimeout(
          currentProvider.generateStructuredResponse(structuredPrompt, schema),
          'Structured planner request'
        );
        console.log('✅ [PlannerAgent] Structured response received:', plan);
        
        // Store result in memory
        this.memory.remember('lastPlan', plan, 'plan');
        this.memory.addToConversation('planner', JSON.stringify(plan));
      } else {
        console.log('💬 [PlannerAgent] Using fallback text parsing...');
        const response = await this.withTimeout(
          this.aiService.generateChatResponse(prompt, undefined),
          'Planner request'
        );
        console.log('💬 [PlannerAgent] AI response received:', response.substring(0, 200) + '...');
        
        // Extract JSON from response (handle markdown code blocks and text)
        let jsonStr = response.trim();
        
        // Handle markdown code blocks
        if (jsonStr.includes('```json')) {
          const match = jsonStr.match(/```json\s*([\s\S]*?)```/);
          if (match) jsonStr = match[1].trim();
        } else if (jsonStr.includes('```')) {
          const match = jsonStr.match(/```\s*([\s\S]*?)```/);
          if (match) jsonStr = match[1].trim();
        }
        
        // Find JSON object in text
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        
        console.log('🧠 [PlannerAgent] Parsing JSON:', jsonStr);
        plan = JSON.parse(jsonStr);
        
        // Store result in memory
        this.memory.remember('lastPlan', plan, 'plan');
        this.memory.addToConversation('planner', JSON.stringify(plan));
      }


      
      const finalPlan = {
        id: `plan_${Date.now()}`,
        description: plan.description,
        steps: plan.steps.map((step: any, index: number) => ({
          ...step,
          id: step.id || `step_${index + 1}`,
          status: 'pending' as const
        })),
        estimatedDuration: plan.estimatedDuration || 60000,
        status: 'planning' as const
      };
      
      console.log('✅ [PlannerAgent] Plan created successfully:', finalPlan);
      return finalPlan;

    } catch (error) {
      console.error('❌ [PlannerAgent] Planning failed:', error);
      throw new Error(`Planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async withTimeout<T>(promise: Promise<T>, operation: string): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(
        `${operation} timed out after ${PlannerAgent.PLANNER_TIMEOUT_MS / 1000}s. Check the selected AI provider and API key.`
      )), PlannerAgent.PLANNER_TIMEOUT_MS);
    });

    try {
      return await Promise.race([promise, timeout]);
    } finally {
      clearTimeout(timeoutId!);
    }
  }
  
  async replan(userInput: string, currentContext: any, completedSteps: any[]): Promise<TaskPlan> {
    console.log('🔄 [PlannerAgent] Re-planning based on new context...');
    
    // Check if we have page analysis results to work with
    const lastResult = currentContext.lastResult;
    const hasPageElements = lastResult?.result?.elementCount > 0;
    
    let contextualPrompt;
    
    if (hasPageElements) {
      // We have page elements - plan specific interactions
      contextualPrompt = `Original task: ${userInput}

Page Analysis Results:
- Found ${lastResult.result.elementCount} interactive elements
- Current page: ${lastResult.result.url}
- Page title: ${lastResult.result.title}

Now plan specific element interactions using elementIndex numbers (0, 1, 2, etc.).

Available interaction actions:
- click: Click element by number (use "elementIndex": 0)
- fill: Fill input by number (use "elementIndex": 1, "data": "text")
- extract: Extract text from element (use "elementIndex": 2)
- scrollToText: Scroll to find text (use "data": {"text": "search term"})
- wait: Wait between actions

Plan the remaining steps to complete: ${userInput}`;
    } else {
      // No page elements yet - continue with navigation
      contextualPrompt = `Original task: ${userInput}

Current situation:
- Completed steps: ${completedSteps.length}
- Data collected: ${JSON.stringify(currentContext.extractedData || {})}

Continue planning navigation steps to complete: ${userInput}`;
    }
    
    return await this.createPlan(contextualPrompt, currentContext);
  }
}
