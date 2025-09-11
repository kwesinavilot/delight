import { AIService } from '../ai/AIService';
import { PuppeteerAutomation } from '../automation/PuppeteerAutomation';
import { TaskStep } from '../../types/agents';

export interface RecoveryStrategy {
  canRecover: boolean;
  strategy: 'retry' | 'alternative' | 'skip' | 'replan';
  suggestion: string;
  alternativeAction?: TaskStep;
}

export class ErrorRecoveryAgent {
  private aiService: AIService;

  constructor() {
    console.log('🚨 [ErrorRecoveryAgent] Initializing...');
    this.aiService = AIService.getInstance();
  }

  async handleFailure(step: TaskStep, result: any, validation: any): Promise<RecoveryStrategy> {
    console.log('🚨 [ErrorRecoveryAgent] Handling failure for step:', step.type);

    try {
      // Analyze the failure and suggest recovery
      const prompt = `Analyze this automation failure and suggest recovery:

Failed Step: ${JSON.stringify(step)}
Result: ${JSON.stringify(result)}
Validation: ${JSON.stringify(validation)}

Common failure types:
- Element not found: Suggest alternative selector or wait
- Page not loaded: Suggest wait or reload
- Form validation: Suggest field correction
- Popup/modal: Suggest dismissal
- Network error: Suggest retry

Respond with recovery strategy:
{
  "canRecover": true/false,
  "strategy": "retry|alternative|skip|replan",
  "suggestion": "What to do next",
  "confidence": 0.8
}`;

      const response = await this.aiService.generateChatResponse(prompt);
      const recovery = this.parseAIResponse(response);

      console.log('🚨 [ErrorRecoveryAgent] Recovery strategy:', recovery.strategy);
      return recovery;

    } catch (error) {
      console.error('❌ [ErrorRecoveryAgent] Recovery analysis failed:', error);
      return this.getDefaultRecovery();
    }
  }

  async handleError(error: Error): Promise<RecoveryStrategy> {
    console.log('🚨 [ErrorRecoveryAgent] Handling error:', error.message);

    // Detect common error patterns
    if (error.message.includes('Element') && error.message.includes('not found')) {
      return {
        canRecover: true,
        strategy: 'retry',
        suggestion: 'Element not found, will retry with wait'
      };
    }

    if (error.message.includes('timeout') || error.message.includes('loading')) {
      return {
        canRecover: true,
        strategy: 'retry',
        suggestion: 'Page loading timeout, will retry'
      };
    }

    if (error.message.includes('Not connected')) {
      return {
        canRecover: true,
        strategy: 'retry',
        suggestion: 'Connection lost, will reconnect and retry'
      };
    }

    return {
      canRecover: false,
      strategy: 'replan',
      suggestion: `Unrecoverable error: ${error.message}`
    };
  }

  async detectErrorState(automation: PuppeteerAutomation): Promise<{ hasError: boolean, errorType: string, suggestion: string }> {
    console.log('🚨 [ErrorRecoveryAgent] Detecting error state...');

    try {
      const domState = await automation.getState();

      // Check for common error indicators
      const hasPopup = this.detectPopup(domState);
      const hasError = this.detectErrorPage(domState);
      const hasCaptcha = this.detectCaptcha(domState);

      if (hasPopup) {
        return {
          hasError: true,
          errorType: 'popup',
          suggestion: 'Dismiss popup or modal'
        };
      }

      if (hasError) {
        return {
          hasError: true,
          errorType: 'error_page',
          suggestion: 'Navigate back or reload page'
        };
      }

      if (hasCaptcha) {
        return {
          hasError: true,
          errorType: 'captcha',
          suggestion: 'Manual captcha solving required'
        };
      }

      return {
        hasError: false,
        errorType: 'none',
        suggestion: 'Page state is normal'
      };

    } catch (error) {
      return {
        hasError: true,
        errorType: 'detection_failed',
        suggestion: 'Could not analyze page state'
      };
    }
  }

  async handlePopup(automation: PuppeteerAutomation): Promise<boolean> {
    console.log('🚨 [ErrorRecoveryAgent] Handling popup...');

    try {
      const domState = await automation.getState();

      // Look for common popup dismissal elements
      const dismissElements = domState.elementTree?.filter((el: any) =>
        el.textContent?.toLowerCase().includes('close') ||
        el.textContent?.toLowerCase().includes('dismiss') ||
        el.textContent?.toLowerCase().includes('accept') ||
        el.attributes?.class?.includes('close') ||
        el.attributes?.['aria-label']?.toLowerCase().includes('close')
      );

      if (dismissElements && dismissElements.length > 0) {
        // Click the first dismiss element
        const elementIndex = domState.selectorMap ?
          Object.keys(domState.selectorMap).find((key: string) =>
            (domState.selectorMap as any)[key] === dismissElements[0]
          ) : null;


        if (elementIndex) {
          await automation.clickByIndex(parseInt(elementIndex));
          await automation.wait(1000);
          return true;
        }
      }

      // Try pressing Escape key
      await automation.sendKeys('Escape');
      await automation.wait(1000);
      return true;

    } catch (error) {
      console.error('❌ [ErrorRecoveryAgent] Popup handling failed:', error);
      return false;
    }
  }

  private detectPopup(domState: any): boolean {
    return domState.elementTree?.some((el: any) =>
      el.attributes?.class?.includes('modal') ||
      el.attributes?.class?.includes('popup') ||
      el.attributes?.class?.includes('overlay') ||
      el.attributes?.role === 'dialog'
    ) || false;
  }

  private detectErrorPage(domState: any): boolean {
    return domState.title?.toLowerCase().includes('error') ||
      domState.title?.includes('404') ||
      domState.elementTree?.some((el: any) =>
        el.textContent?.toLowerCase().includes('page not found') ||
        el.textContent?.toLowerCase().includes('server error')
      ) || false;
  }

  private detectCaptcha(domState: any): boolean {
    return domState.elementTree?.some((el: any) =>
      el.textContent?.toLowerCase().includes('captcha') ||
      el.textContent?.toLowerCase().includes('verify') ||
      el.attributes?.class?.includes('captcha')
    ) || false;
  }

  private parseAIResponse(response: string): RecoveryStrategy {
    try {
      let jsonStr = response.trim();
      if (jsonStr.includes('```json')) {
        const match = jsonStr.match(/```json\s*([\s\S]*?)```/);
        if (match) jsonStr = match[1].trim();
      }
      return JSON.parse(jsonStr);
    } catch {
      return this.getDefaultRecovery();
    }
  }

  private getDefaultRecovery(): RecoveryStrategy {
    return {
      canRecover: false,
      strategy: 'replan',
      suggestion: 'Unable to determine recovery strategy'
    };
  }
}