import { AIService } from '../ai/AIService';
import { PuppeteerAutomation } from '../automation/PuppeteerAutomation';
import { TaskStep } from '../../types/agents';

export interface ValidationResult {
  success: boolean;
  confidence: number;
  feedback: string;
  issues: string[];
  suggestions: string[];
}

export class ValidatorAgent {
  private aiService: AIService;

  constructor() {
    console.log('✅ [ValidatorAgent] Initializing...');
    this.aiService = AIService.getInstance();
  }

  async validateStep(step: TaskStep, result: any, automation?: PuppeteerAutomation): Promise<ValidationResult> {
    console.log('✅ [ValidatorAgent] Validating step:', step.type);
    
    try {
      // Get current page state for validation
      let currentState = null;
      if (automation) {
        currentState = await automation.getState();
      }
      
      // Use AI to validate step completion
      const prompt = `Validate if this automation step was completed successfully:

Step Details:
- Type: ${step.type}
- Description: ${step.description}
- Expected outcome: ${step.expectedOutcome || 'Not specified'}

Execution Result:
${JSON.stringify(result)}

Current Page State:
- URL: ${currentState?.url || 'Unknown'}
- Title: ${currentState?.title || 'Unknown'}
- Elements: ${currentState?.elementCount || 0}

Validation Criteria:
- Navigation: Check if URL changed appropriately
- Click: Check if expected page change occurred
- Fill: Check if form was filled correctly
- Extract: Check if data was extracted successfully

Respond with validation result:
{
  "success": true/false,
  "confidence": 0.8,
  "feedback": "Detailed feedback",
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`;

      const response = await this.aiService.generateChatResponse(prompt);
      const validation = this.parseAIResponse(response);
      
      console.log('✅ [ValidatorAgent] Validation result:', validation.success ? 'PASS' : 'FAIL');
      return validation;
      
    } catch (error) {
      console.error('❌ [ValidatorAgent] Validation failed:', error);
      return this.getDefaultValidation(false, `Validation error: ${error}`);
    }
  }

  async validateNavigation(expectedUrl: string, actualUrl: string): Promise<ValidationResult> {
    console.log('✅ [ValidatorAgent] Validating navigation...');
    
    const urlMatches = actualUrl.includes(expectedUrl) || expectedUrl.includes(actualUrl);
    
    if (urlMatches) {
      return this.getDefaultValidation(true, 'Navigation successful');
    } else {
      return this.getDefaultValidation(false, `Expected URL containing "${expectedUrl}", got "${actualUrl}"`);
    }
  }

  async validateFormFill(fieldIndex: number, expectedValue: string, automation: PuppeteerAutomation): Promise<ValidationResult> {
    console.log('✅ [ValidatorAgent] Validating form fill...');
    
    try {
      // Extract current value from the field
      const currentValue = await automation.extractByIndex(fieldIndex);
      
      if (currentValue.includes(expectedValue) || expectedValue.includes(currentValue)) {
        return this.getDefaultValidation(true, 'Form field filled correctly');
      } else {
        return this.getDefaultValidation(false, `Expected "${expectedValue}", found "${currentValue}"`);
      }
      
    } catch (error) {
      return this.getDefaultValidation(false, `Could not validate form fill: ${error}`);
    }
  }

  async validateDataExtraction(extractedData: any, expectedType: string): Promise<ValidationResult> {
    console.log('✅ [ValidatorAgent] Validating data extraction...');
    
    if (!extractedData || extractedData.length === 0) {
      return this.getDefaultValidation(false, 'No data was extracted');
    }
    
    if (expectedType === 'table' && Array.isArray(extractedData)) {
      return this.getDefaultValidation(true, `Extracted ${extractedData.length} table rows`);
    }
    
    if (expectedType === 'text' && typeof extractedData === 'string' && extractedData.length > 0) {
      return this.getDefaultValidation(true, `Extracted text: ${extractedData.substring(0, 50)}...`);
    }
    
    return this.getDefaultValidation(true, 'Data extraction completed');
  }

  async validatePageLoad(automation: PuppeteerAutomation, expectedTitle?: string): Promise<ValidationResult> {
    console.log('✅ [ValidatorAgent] Validating page load...');
    
    try {
      const state = await automation.getState();
      
      if (state.elementCount === 0) {
        return this.getDefaultValidation(false, 'Page appears to be empty or not loaded');
      }
      
      if (expectedTitle && !state.title.toLowerCase().includes(expectedTitle.toLowerCase())) {
        return this.getDefaultValidation(false, `Expected title containing "${expectedTitle}", got "${state.title}"`);
      }
      
      return this.getDefaultValidation(true, `Page loaded successfully with ${state.elementCount} elements`);
      
    } catch (error) {
      return this.getDefaultValidation(false, `Page load validation failed: ${error}`);
    }
  }

  private parseAIResponse(response: string): ValidationResult {
    try {
      let jsonStr = response.trim();
      if (jsonStr.includes('```json')) {
        const match = jsonStr.match(/```json\s*([\s\S]*?)```/);
        if (match) jsonStr = match[1].trim();
      }
      const parsed = JSON.parse(jsonStr);
      
      return {
        success: parsed.success || false,
        confidence: parsed.confidence || 0.5,
        feedback: parsed.feedback || 'No feedback provided',
        issues: parsed.issues || [],
        suggestions: parsed.suggestions || []
      };
    } catch {
      return this.getDefaultValidation(false, 'Could not parse validation response');
    }
  }

  private getDefaultValidation(success: boolean, feedback: string): ValidationResult {
    return {
      success,
      confidence: success ? 0.8 : 0.2,
      feedback,
      issues: success ? [] : [feedback],
      suggestions: success ? [] : ['Review step execution and retry']
    };
  }
}