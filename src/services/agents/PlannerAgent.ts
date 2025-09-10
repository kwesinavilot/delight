import { AIService } from '../ai/AIService';
import { TaskPlan } from '../../types/agents';
import { GeminiProvider } from '../ai/providers/GeminiProvider';

export class PlannerAgent {
  private aiService: AIService;

  constructor() {
    console.log('🧠 [PlannerAgent] Initializing...');
    this.aiService = AIService.getInstance();
  }

  async initialize(): Promise<void> {
    await this.aiService.initialize();
  }

  async createPlan(userInput: string): Promise<TaskPlan> {
    console.log('🧠 [PlannerAgent] Creating plan for:', userInput);
    const prompt = `You are a task planning agent. Break down user requests into executable steps.

Available actions:
- navigate: Go to a URL (automatically waits for page load)
- click: Click an element (provide CSS selector)
- smartClick: Click element by description (e.g., "search button", "first video")
- extract: Extract data from page (provide CSS selector)
- fill: Fill form fields (provide selector and data)
- smartFill: Fill input by description (e.g., "search", "email")
- analyzePage: Analyze page for interactive elements
- wait: Wait for specific duration (milliseconds)
- waitForElement: Wait for element to appear (provide CSS selector)
- waitForLoad: Wait for page to fully load

IMPORTANT RULES:
1. Always add waitForLoad after navigate actions
2. Use smartFill and smartClick instead of fill/click when possible (more reliable)
3. Add analyzePage before complex interactions to understand page structure
4. Use wait for delays between actions when needed

IMPORTANT: Respond ONLY with valid JSON, no explanations or markdown:

{
  "description": "Brief task description",
  "steps": [
    {
      "id": "step_1",
      "type": "navigate",
      "url": "https://example.com",
      "description": "Navigate to example.com"
    }
  ],
  "estimatedDuration": 30000
}

Task: ${userInput}`;

    try {
      console.log('🤖 [PlannerAgent] Sending request to AI...');
      
      // Check if we can use structured output with Gemini
      const currentProvider = this.aiService.getCurrentProvider();
      let plan: any;
      
      if (currentProvider instanceof GeminiProvider && currentProvider.supportsStructuredOutput()) {
        console.log('🎆 [PlannerAgent] Using Gemini structured output...');
        
        const structuredPrompt = `Break down this user request into executable browser automation steps: ${userInput}`;
        const schema = GeminiProvider.createTaskPlanSchema();
        
        plan = await currentProvider.generateStructuredResponse(structuredPrompt, schema);
        console.log('✅ [PlannerAgent] Structured response received:', plan);
      } else {
        console.log('💬 [PlannerAgent] Using fallback text parsing...');
        const response = await this.aiService.generateChatResponse(prompt, undefined);
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
}