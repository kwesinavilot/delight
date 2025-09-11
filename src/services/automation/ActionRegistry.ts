import { PuppeteerAutomation } from './PuppeteerAutomation';

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  extractedContent?: string;
  includeInMemory?: boolean;
}

export interface ActionContext {
  automation: PuppeteerAutomation;
  maxRetries: number;
  retryDelay: number;
}

export abstract class BaseAction {
  abstract name(): string;
  abstract description(): string;
  abstract execute(params: any, context: ActionContext): Promise<ActionResult>;
  
  protected async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw lastError!;
  }
}

// Navigation Actions
export class NavigateAction extends BaseAction {
  name(): string { return 'navigate'; }
  description(): string { return 'Navigate to a URL'; }
  
  async execute(params: { url: string }, context: ActionContext): Promise<ActionResult> {
    try {
      await this.retry(async () => {
        await context.automation.navigate(params.url);
      }, context.maxRetries, context.retryDelay);
      
      // Get page state after navigation
      const state = await context.automation.getState();
      
      return {
        success: true,
        data: state,
        extractedContent: `Navigated to ${params.url}. Found ${state.elementCount} interactive elements.`,
        includeInMemory: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Navigation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export class GoBackAction extends BaseAction {
  name(): string { return 'goBack'; }
  description(): string { return 'Go back in browser history'; }
  
  async execute(_params: {}, context: ActionContext): Promise<ActionResult> {
    try {
      await context.automation.sendKeys('Alt+ArrowLeft');
      await context.automation.wait(2000);
      
      const state = await context.automation.getState();
      
      return {
        success: true,
        data: state,
        extractedContent: `Went back. Now on ${state.url}`,
        includeInMemory: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Go back failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Element Interaction Actions
export class ClickElementAction extends BaseAction {
  name(): string { return 'clickElement'; }
  description(): string { return 'Click an element by its index'; }
  
  async execute(params: { index: number }, context: ActionContext): Promise<ActionResult> {
    try {
      await this.retry(async () => {
        await context.automation.clickByIndex(params.index);
      }, context.maxRetries, context.retryDelay);
      
      // Get updated state after click
      const state = await context.automation.getState();
      
      return {
        success: true,
        data: state,
        extractedContent: `Clicked element ${params.index}. Page now has ${state.elementCount} interactive elements.`,
        includeInMemory: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Click failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export class InputTextAction extends BaseAction {
  name(): string { return 'inputText'; }
  description(): string { return 'Input text into an element'; }
  
  async execute(params: { index: number; text: string }, context: ActionContext): Promise<ActionResult> {
    try {
      await this.retry(async () => {
        await context.automation.fillByIndex(params.index, params.text);
      }, context.maxRetries, context.retryDelay);
      
      return {
        success: true,
        extractedContent: `Entered "${params.text}" into element ${params.index}`,
        includeInMemory: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Input failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export class ExtractTextAction extends BaseAction {
  name(): string { return 'extractText'; }
  description(): string { return 'Extract text from an element'; }
  
  async execute(params: { index: number }, context: ActionContext): Promise<ActionResult> {
    try {
      const text = await this.retry(async () => {
        return await context.automation.extractByIndex(params.index);
      }, context.maxRetries, context.retryDelay);
      
      return {
        success: true,
        data: text,
        extractedContent: `Extracted from element ${params.index}: "${text.substring(0, 200)}${text.length > 200 ? '...' : ''}"`,
        includeInMemory: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Extract failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Dropdown Actions
export class GetDropdownOptionsAction extends BaseAction {
  name(): string { return 'getDropdownOptions'; }
  description(): string { return 'Get all options from a dropdown'; }
  
  async execute(params: { index: number }, context: ActionContext): Promise<ActionResult> {
    try {
      const options = await this.retry(async () => {
        return await context.automation.getDropdownOptions(params.index);
      }, context.maxRetries, context.retryDelay);
      
      const optionTexts = options.map(opt => opt.text).join(', ');
      
      return {
        success: true,
        data: options,
        extractedContent: `Dropdown ${params.index} options: ${optionTexts}`,
        includeInMemory: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Get dropdown options failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export class SelectDropdownOptionAction extends BaseAction {
  name(): string { return 'selectDropdownOption'; }
  description(): string { return 'Select an option from a dropdown'; }
  
  async execute(params: { index: number; option: string }, context: ActionContext): Promise<ActionResult> {
    try {
      await this.retry(async () => {
        await context.automation.selectDropdownOption(params.index, params.option);
      }, context.maxRetries, context.retryDelay);
      
      return {
        success: true,
        extractedContent: `Selected "${params.option}" from dropdown ${params.index}`,
        includeInMemory: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Dropdown selection failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Scrolling Actions
export class ScrollToPercentAction extends BaseAction {
  name(): string { return 'scrollToPercent'; }
  description(): string { return 'Scroll to a percentage of the page'; }
  
  async execute(params: { percent: number }, context: ActionContext): Promise<ActionResult> {
    try {
      await context.automation.scrollToPercent(params.percent);
      
      const state = await context.automation.getState();
      
      return {
        success: true,
        data: state,
        extractedContent: `Scrolled to ${params.percent}%. Page now shows ${state.elementCount} interactive elements.`,
        includeInMemory: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Scroll failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export class ScrollToTextAction extends BaseAction {
  name(): string { return 'scrollToText'; }
  description(): string { return 'Scroll to find specific text on the page'; }
  
  async execute(params: { text: string; nth?: number }, context: ActionContext): Promise<ActionResult> {
    try {
      const found = await context.automation.scrollToText(params.text, params.nth || 1);
      
      if (found) {
        const state = await context.automation.getState();
        return {
          success: true,
          data: state,
          extractedContent: `Found and scrolled to "${params.text}". Page now shows ${state.elementCount} interactive elements.`,
          includeInMemory: true
        };
      } else {
        return {
          success: false,
          error: `Text "${params.text}" not found on page`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Scroll to text failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export class ScrollToTopAction extends BaseAction {
  name(): string { return 'scrollToTop'; }
  description(): string { return 'Scroll to the top of the page'; }
  
  async execute(_params: {}, context: ActionContext): Promise<ActionResult> {
    try {
      await context.automation.scrollToPercent(0);
      
      return {
        success: true,
        extractedContent: 'Scrolled to top of page',
        includeInMemory: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Scroll to top failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export class ScrollToBottomAction extends BaseAction {
  name(): string { return 'scrollToBottom'; }
  description(): string { return 'Scroll to the bottom of the page'; }
  
  async execute(_params: {}, context: ActionContext): Promise<ActionResult> {
    try {
      await context.automation.scrollToPercent(100);
      
      return {
        success: true,
        extractedContent: 'Scrolled to bottom of page',
        includeInMemory: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Scroll to bottom failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Keyboard Actions
export class SendKeysAction extends BaseAction {
  name(): string { return 'sendKeys'; }
  description(): string { return 'Send keyboard shortcuts'; }
  
  async execute(params: { keys: string }, context: ActionContext): Promise<ActionResult> {
    try {
      await context.automation.sendKeys(params.keys);
      
      return {
        success: true,
        extractedContent: `Sent keyboard shortcut: ${params.keys}`,
        includeInMemory: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Send keys failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Utility Actions
export class WaitAction extends BaseAction {
  name(): string { return 'wait'; }
  description(): string { return 'Wait for a specified duration'; }
  
  async execute(params: { seconds: number }, context: ActionContext): Promise<ActionResult> {
    try {
      await context.automation.wait(params.seconds * 1000);
      
      return {
        success: true,
        extractedContent: `Waited for ${params.seconds} seconds`,
        includeInMemory: false
      };
    } catch (error) {
      return {
        success: false,
        error: `Wait failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export class AnalyzePageAction extends BaseAction {
  name(): string { return 'analyzePage'; }
  description(): string { return 'Analyze the current page and highlight interactive elements'; }
  
  async execute(_params: {}, context: ActionContext): Promise<ActionResult> {
    try {
      const state = await context.automation.getState();
      
      return {
        success: true,
        data: state,
        extractedContent: `Analyzed page: ${state.title} (${state.url}). Found ${state.elementCount} interactive elements.`,
        includeInMemory: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Page analysis failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export class CacheContentAction extends BaseAction {
  name(): string { return 'cacheContent'; }
  description(): string { return 'Cache content for later use'; }
  
  async execute(params: { key: string; content: string }, context: ActionContext): Promise<ActionResult> {
    try {
      // Store in session storage for persistence
      if (context.automation.page) {
        await context.automation.page.evaluate((key, content) => {
          sessionStorage.setItem(`delight_cache_${key}`, content);
        }, params.key, params.content);
      }
      
      return {
        success: true,
        extractedContent: `Cached content with key: ${params.key}`,
        includeInMemory: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Cache content failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Action Registry
export class ActionRegistry {
  private actions: Map<string, BaseAction> = new Map();
  
  constructor() {
    this.registerDefaultActions();
  }
  
  private registerDefaultActions(): void {
    const actions = [
      // Navigation
      new NavigateAction(),
      new GoBackAction(),
      
      // Element Interaction
      new ClickElementAction(),
      new InputTextAction(),
      new ExtractTextAction(),
      
      // Dropdown
      new GetDropdownOptionsAction(),
      new SelectDropdownOptionAction(),
      
      // Scrolling
      new ScrollToPercentAction(),
      new ScrollToTextAction(),
      new ScrollToTopAction(),
      new ScrollToBottomAction(),
      
      // Keyboard
      new SendKeysAction(),
      
      // Utility
      new WaitAction(),
      new AnalyzePageAction(),
      new CacheContentAction()
    ];
    
    for (const action of actions) {
      this.actions.set(action.name(), action);
    }
    
    console.log(`🎯 [ActionRegistry] Registered ${this.actions.size} actions`);
  }
  
  getAction(name: string): BaseAction | undefined {
    return this.actions.get(name);
  }
  
  getAllActions(): BaseAction[] {
    return Array.from(this.actions.values());
  }
  
  getActionNames(): string[] {
    return Array.from(this.actions.keys());
  }
  
  async executeAction(
    actionName: string, 
    params: any, 
    context: ActionContext
  ): Promise<ActionResult> {
    const action = this.getAction(actionName);
    
    if (!action) {
      return {
        success: false,
        error: `Unknown action: ${actionName}`
      };
    }
    
    console.log(`⚡ [ActionRegistry] Executing ${actionName} with params:`, params);
    
    try {
      const result = await action.execute(params, context);
      
      if (result.success) {
        console.log(`✅ [ActionRegistry] ${actionName} completed successfully`);
      } else {
        console.error(`❌ [ActionRegistry] ${actionName} failed:`, result.error);
      }
      
      return result;
    } catch (error) {
      console.error(`💥 [ActionRegistry] ${actionName} threw error:`, error);
      return {
        success: false,
        error: `Action execution failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}