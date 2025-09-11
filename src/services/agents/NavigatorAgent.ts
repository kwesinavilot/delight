import { TaskStep } from '../../types/agents';
import { PuppeteerAutomation } from '../automation/PuppeteerAutomation';
import { ActionRegistry, ActionContext } from '../automation/ActionRegistry';
import { AgentMemory } from './AgentMemory';

export class NavigatorAgent {
  private currentTabId: number | null = null;
  private automation: PuppeteerAutomation | null = null;
  private actionRegistry: ActionRegistry;
  private memory: AgentMemory;
  private isConnected: boolean = false;

  constructor() {
    this.actionRegistry = new ActionRegistry();
    this.memory = new AgentMemory();
  }

  async initialize(): Promise<void> {
    console.log('🧝 [NavigatorAgent] Initializing...');
    
    try {
      // Get current tab - works on ANY page including chrome:// and settings
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        throw new Error('No active tab found');
      }
      
      this.currentTabId = tabs[0].id!;
      console.log('📋 [NavigatorAgent] Using tab:', this.currentTabId, tabs[0].url);
      
      // Check if tab URL is accessible for script injection
      const tabUrl = tabs[0].url || '';
      const isRestrictedPage = tabUrl.startsWith('chrome://') || 
                              tabUrl.startsWith('chrome-extension://') || 
                              tabUrl.startsWith('edge://') || 
                              tabUrl.startsWith('about:') ||
                              tabUrl === 'chrome://newtab/' ||
                              tabUrl === '';
      
      if (isRestrictedPage) {
        console.log('🌐 [NavigatorAgent] Restricted page detected, will handle during first navigation');
        // Don't navigate yet - let the user's first task determine where to go
      }
      
      // Create automation connection
      this.automation = new PuppeteerAutomation(this.currentTabId);
      await this.automation.connect();
      
      // Analyze current page elements
      const analysis = await this.automation.getState();
      console.log(`✅ [NavigatorAgent] Ready! Found ${analysis.elementCount} interactive elements`);
      
      this.isConnected = true;
      
    } catch (error) {
      console.error('❌ [NavigatorAgent] Initialization failed:', error);
      console.error('Automation initialization failed. Trying fallback navigation...');
      
      // For restricted pages, we'll handle this during the first navigation step
      try {
        const fallbackTabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (fallbackTabs[0]) {
          const tabUrl = fallbackTabs[0].url || '';
          const isRestrictedPageFallback = tabUrl.startsWith('chrome://') || 
                                          tabUrl.startsWith('chrome-extension://') || 
                                          tabUrl.startsWith('edge://') || 
                                          tabUrl.startsWith('about:') ||
                                          tabUrl === 'chrome://newtab/' ||
                                          tabUrl === '';
          
          if (isRestrictedPageFallback) {
            console.log('🌐 [NavigatorAgent] Restricted page - automation will start with first navigation');
            this.isConnected = true; // Mark as connected, will work on first navigate
            return;
          }
        }
      } catch (fallbackError) {
        console.error('❌ [NavigatorAgent] Fallback check failed:', fallbackError);
      }
      
      throw error;
    }
  }

  async executeStep(step: TaskStep): Promise<any> {
    console.log('⚡ [NavigatorAgent] Executing:', step.type, step.description);
    
    // Store step in memory
    this.memory.remember('currentStep', step, 'context');
    this.memory.addToConversation('navigator', `Executing: ${step.type} - ${step.description}`);
    
    if (!this.isConnected) {
      throw new Error('Navigator not initialized');
    }
    
    // Lazy initialize automation on first navigation if needed
    if (!this.automation && step.type === 'navigate') {
      console.log('🔄 [NavigatorAgent] Lazy initializing automation for navigation...');
      this.automation = new PuppeteerAutomation(this.currentTabId!);
      await this.automation.connect();
    }
    
    if (!this.automation) {
      throw new Error('Automation not available');
    }
    
    try {
      step.status = 'running';
      
      // Create action context
      const context: ActionContext = {
        automation: this.automation,
        maxRetries: 3,
        retryDelay: 1000
      };
      
      // Map step types to action names and parameters
      const { actionName, params } = this.mapStepToAction(step);
      
      // Execute action through registry
      const actionResult = await this.actionRegistry.executeAction(actionName, params, context);
      
      if (!actionResult.success) {
        throw new Error(actionResult.error || 'Action failed');
      }
      
      step.status = 'completed';
      console.log('✅ [NavigatorAgent] Step completed');
      
      const result = {
        result: actionResult.data || actionResult.extractedContent,
        success: true,
        mode: 'puppeteer',
        extractedContent: actionResult.extractedContent,
        stepType: step.type,
        timestamp: Date.now()
      };
      
      // Store result in memory
      this.memory.remember(`step_${step.id}_result`, result, 'result');
      this.memory.addToConversation('navigator', `Completed: ${step.type} - Success`);
      
      return result;
      
    } catch (error) {
      step.status = 'failed';
      console.error('❌ [NavigatorAgent] Step failed:', error);
      throw error;
    }
  }
  
  private mapStepToAction(step: TaskStep): { actionName: string; params: any } {
    switch (step.type) {
      case 'navigate':
        return {
          actionName: 'navigate',
          params: { url: step.url }
        };
        
      case 'click':
        return {
          actionName: 'clickElement',
          params: { index: step.elementIndex }
        };
        
      case 'fill':
        return {
          actionName: 'inputText',
          params: { index: step.elementIndex, text: String(step.data) }
        };
        
      case 'extract':
        return {
          actionName: 'extractText',
          params: { index: step.elementIndex }
        };
        
      case 'wait':
        return {
          actionName: 'wait',
          params: { seconds: (step.data?.duration || step.timeout || 2000) / 1000 }
        };
        
      case 'analyzePage':
        return {
          actionName: 'analyzePage',
          params: {}
        };
        
      case 'scrollToText':
        return {
          actionName: 'scrollToText',
          params: { text: step.data?.text, nth: step.data?.nth }
        };
        
      case 'scrollToPercent':
        return {
          actionName: 'scrollToPercent',
          params: { percent: step.data?.percent }
        };
        
      case 'selectDropdownOption':
        return {
          actionName: 'selectDropdownOption',
          params: { index: step.elementIndex, option: step.data?.option }
        };
        
      case 'sendKeys':
        return {
          actionName: 'sendKeys',
          params: { keys: step.data?.keys }
        };
        
      default:
        throw new Error(`Unknown action type: ${step.type}`);
    }
  }

  async stop(): Promise<void> {
    console.log('🛑 [NavigatorAgent] Stopping...');
    await this.cleanup();
  }

  async cleanup(): Promise<void> {
    console.log('🧹 [NavigatorAgent] Cleaning up...');
    
    if (this.automation) {
      await this.automation.cleanup();
      this.automation = null;
    }
    
    this.currentTabId = null;
    this.isConnected = false;
    console.log('✅ [NavigatorAgent] Cleanup completed');
  }
}