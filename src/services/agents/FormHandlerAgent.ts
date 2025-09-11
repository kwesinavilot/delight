import { AIService } from '../ai/AIService';
import { PuppeteerAutomation } from '../automation/PuppeteerAutomation';
import { TaskStep } from '../../types/agents';
import { PageContext } from './PageAnalyzerAgent';

export interface FormField {
  index: number;
  type: string;
  name: string;
  placeholder: string;
  required: boolean;
  purpose: string;
}

export class FormHandlerAgent {
  private aiService: AIService;

  constructor() {
    console.log('📝 [FormHandlerAgent] Initializing...');
    this.aiService = AIService.getInstance();
  }

  async handleFormStep(step: TaskStep, _pageContext: PageContext, automation: PuppeteerAutomation): Promise<any> {
    console.log('📝 [FormHandlerAgent] Handling form step:', step.type);
    
    try {
      if (step.type === 'fill') {
        return await this.intelligentFill(step, automation);
      } else if (step.type === 'click' && this.isSubmitAction(step)) {
        return await this.handleFormSubmit(step, automation);
      }
      
      // Fallback to basic action
      return await this.executeBasicAction(step, automation);
      
    } catch (error) {
      console.error('❌ [FormHandlerAgent] Form handling failed:', error);
      throw error;
    }
  }

  private async intelligentFill(step: TaskStep, automation: PuppeteerAutomation): Promise<any> {
    console.log('📝 [FormHandlerAgent] Intelligent form filling...');
    
    // Get current page state to understand form structure
    const domState = await automation.getState();
    
    // Use AI to understand what field we're filling
    const prompt = `Analyze this form filling task:

Task: ${step.description}
Data to fill: ${step.data}
Element index: ${step.elementIndex}

Available form elements: ${JSON.stringify(domState.selectorMap[step.elementIndex || 0])}

Determine the best way to fill this field. Consider:
- Field type and validation requirements
- Data format needed
- Any preprocessing required

Respond with JSON:
{
  "fillValue": "processed value to fill",
  "fillMethod": "type|select|click",
  "preprocessing": "any data transformation needed"
}`;

    const response = await this.aiService.generateChatResponse(prompt);
    const analysis = this.parseAIResponse(response);
    
    // Execute the intelligent fill
    if (analysis.fillMethod === 'select') {
      await automation.selectDropdownOption(step.elementIndex!, analysis.fillValue);
    } else {
      await automation.fillByIndex(step.elementIndex!, analysis.fillValue);
    }
    
    return {
      success: true,
      action: 'intelligent_fill',
      data: analysis.fillValue
    };
  }

  private async handleFormSubmit(step: TaskStep, automation: PuppeteerAutomation): Promise<any> {
    console.log('📝 [FormHandlerAgent] Handling form submission...');
    
    // Click the submit button
    await automation.clickByIndex(step.elementIndex!);
    
    // Wait for form submission and check for validation errors
    await automation.wait(2000);
    
    // Check for validation errors or success
    const newState = await automation.getState();
    const hasErrors = this.detectValidationErrors(newState);
    
    if (hasErrors) {
      console.warn('⚠️ [FormHandlerAgent] Form validation errors detected');
      return {
        success: false,
        action: 'form_submit',
        error: 'Validation errors found',
        needsRetry: true
      };
    }
    
    return {
      success: true,
      action: 'form_submit',
      data: 'Form submitted successfully'
    };
  }

  private async executeBasicAction(step: TaskStep, automation: PuppeteerAutomation): Promise<any> {
    console.log('📝 [FormHandlerAgent] Executing basic action...');
    
    if (step.type === 'click') {
      await automation.clickByIndex(step.elementIndex!);
    } else if (step.type === 'fill') {
      await automation.fillByIndex(step.elementIndex!, String(step.data));
    }
    
    return {
      success: true,
      action: step.type,
      data: step.data
    };
  }

  private isSubmitAction(step: TaskStep): boolean {
    return step.description.toLowerCase().includes('submit') ||
           step.description.toLowerCase().includes('send') ||
           step.description.toLowerCase().includes('search');
  }

  private detectValidationErrors(domState: any): boolean {
    return domState.elementTree?.some((el: any) => 
      el.textContent?.toLowerCase().includes('error') ||
      el.textContent?.toLowerCase().includes('required') ||
      el.attributes?.class?.includes('error') ||
      el.attributes?.class?.includes('invalid')
    ) || false;
  }

  private parseAIResponse(response: string): any {
    try {
      let jsonStr = response.trim();
      if (jsonStr.includes('```json')) {
        const match = jsonStr.match(/```json\s*([\s\S]*?)```/);
        if (match) jsonStr = match[1].trim();
      }
      return JSON.parse(jsonStr);
    } catch {
      return { fillValue: '', fillMethod: 'type' };
    }
  }
}