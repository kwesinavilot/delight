import { TaskStep } from '../../types/agents';
import { BrowserAutomator } from '../automation/BrowserAutomator';

export class NavigatorAgent {
  private currentTabId: number | null = null;
  private automator: BrowserAutomator;
  private usePlaywright: boolean = false;

  constructor() {
    this.automator = new BrowserAutomator();
  }

  async initialize(): Promise<void> {
    console.log('🧭 [NavigatorAgent] Initializing...');
    
    // Test Playwright first
    try {
      const { PlaywrightTest } = await import('../automation/PlaywrightTest');
      const playwrightWorks = await PlaywrightTest.testConnection();
      if (playwrightWorks) {
        await this.automator.initialize();
        this.usePlaywright = true;
        console.log('✅ [NavigatorAgent] Initialized with Playwright automation');
        return;
      }
    } catch (error) {
      console.warn('⚠️ [NavigatorAgent] Playwright test failed:', error);
    }
    
    // Fallback to Chrome Extension APIs
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      this.currentTabId = tabs[0].id!;
      console.log('✅ [NavigatorAgent] Initialized with Chrome APIs, tab ID:', this.currentTabId);
    } else {
      console.warn('⚠️ [NavigatorAgent] No active tab found during initialization');
    }
  }

  async executeStep(step: TaskStep): Promise<any> {
    console.log('⚡ [NavigatorAgent] Executing step:', step);
    
    try {
      let result;
      switch (step.type) {
        case 'navigate':
          result = await this.navigate(step.url!);
          break;
        case 'click':
          result = await this.click(step.selector!);
          break;
        case 'extract':
          result = await this.extract(step.selector!);
          break;
        case 'fill':
          result = await this.fill(step.selector!, step.data);
          break;
        case 'wait':
          result = await this.wait(step.data?.duration || 1000);
          break;
        case 'waitForElement':
          result = await this.waitForElement(step.selector!, step.timeout || 5000);
          break;
        case 'waitForLoad':
          result = await this.waitForPageLoad();
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }
      console.log('✅ [NavigatorAgent] Step completed:', result);
      return { result, mode: 'chrome-api' };
    } catch (error) {
      console.error('❌ [NavigatorAgent] Step failed:', error);
      throw error;
    }
  }

  private async navigate(url: string): Promise<void> {
    console.log('🧭 [NavigatorAgent] Navigating to:', url);
    if (!this.currentTabId) {
      console.log('🆆 [NavigatorAgent] Creating new tab...');
      const tab = await chrome.tabs.create({ url });
      this.currentTabId = tab.id!;
    } else {
      console.log('🔄 [NavigatorAgent] Updating current tab...');
      await chrome.tabs.update(this.currentTabId, { url });
    }
    
    console.log('⏳ [NavigatorAgent] Waiting for page to load...');
    await this.waitForPageLoad();
    console.log('✅ [NavigatorAgent] Navigation completed');
  }

  private async click(selector: string): Promise<void> {
    console.log('🖘 [NavigatorAgent] Clicking element:', selector);
    await this.injectScript(`
      const element = document.querySelector('${selector}');
      if (element) {
        element.click();
        return true;
      }
      throw new Error('Element not found: ${selector}');
    `);
    console.log('✅ [NavigatorAgent] Click completed');
  }

  private async extract(selector: string): Promise<string> {
    console.log('📊 [NavigatorAgent] Extracting data from:', selector);
    
    // Wait for element first
    await this.waitForElement(selector, 3000);
    
    const result = await this.injectScript(`
      const element = document.querySelector('${selector}');
      if (element) {
        const text = element.textContent || element.innerText || element.value || '';
        console.log('Extracted text:', text);
        return text.trim();
      }
      // Try broader selectors if specific one fails
      const allText = document.body.innerText || '';
      console.log('Fallback: extracted page text length:', allText.length);
      return allText.substring(0, 500); // Return first 500 chars as fallback
    `);
    console.log('✅ [NavigatorAgent] Data extraction completed:', result?.substring(0, 100) + '...');
    return result || 'No data extracted';
  }

  private async fill(selector: string, value: string): Promise<void> {
    console.log('⌨️ [NavigatorAgent] Filling field:', { selector, value });
    
    // Wait for element first
    await this.waitForElement(selector, 3000);
    
    await this.injectScript(`
      const element = document.querySelector('${selector}');
      if (element) {
        // Clear existing content first
        element.value = '';
        element.focus();
        
        // Set the value
        element.value = '${value.replace(/'/g, "\\'")}';
        
        // Trigger events
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        // For contenteditable elements
        if (element.contentEditable === 'true') {
          element.innerHTML = '${value.replace(/'/g, "\\'")}';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        return true;
      }
      
      // Try finding any input/textarea as fallback
      const inputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
      if (inputs.length > 0) {
        const input = inputs[inputs.length - 1]; // Use last input as likely target
        input.focus();
        if (input.contentEditable === 'true') {
          input.innerHTML = '${value.replace(/'/g, "\\'")}';
        } else {
          input.value = '${value.replace(/'/g, "\\'")}';
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      
      throw new Error('No suitable input element found');
    `);
    console.log('✅ [NavigatorAgent] Fill completed');
  }

  private async wait(duration: number): Promise<void> {
    console.log(`⏳ [NavigatorAgent] Waiting for ${duration}ms...`);
    await new Promise(resolve => setTimeout(resolve, duration));
    console.log('✅ [NavigatorAgent] Wait completed');
  }

  private async waitForElement(selector: string, timeout: number = 5000): Promise<boolean> {
    console.log(`🔍 [NavigatorAgent] Waiting for element: ${selector}`);
    if (!this.currentTabId) {
      throw new Error('No active tab');
    }

    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: this.currentTabId },
          func: (sel: string) => {
            return document.querySelector(sel) !== null;
          },
          args: [selector]
        });

        if (results[0]?.result) {
          console.log('✅ [NavigatorAgent] Element found');
          return true;
        }
      } catch (error) {
        console.warn('Element check failed:', error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.warn('⚠️ [NavigatorAgent] Element not found within timeout');
    return false;
  }

  private async injectScript(code: string): Promise<any> {
    if (!this.currentTabId) {
      console.error('❌ [NavigatorAgent] No active tab for script injection');
      throw new Error('No active tab');
    }

    console.log('📜 [NavigatorAgent] Injecting script into tab:', this.currentTabId);
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: this.currentTabId },
        func: (codeToExecute: string) => {
          return eval(codeToExecute);
        },
        args: [code]
      });

      const result = results[0]?.result;
      console.log('✅ [NavigatorAgent] Script injection completed:', result);
      return result;
    } catch (error) {
      console.error('❌ [NavigatorAgent] Script injection failed:', error);
      throw error;
    }
  }

  private async waitForPageLoad(): Promise<void> {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds max
      
      const checkComplete = () => {
        if (!this.currentTabId || attempts >= maxAttempts) {
          return resolve();
        }
        
        attempts++;
        chrome.tabs.get(this.currentTabId, (tab) => {
          if (chrome.runtime.lastError) {
            console.warn('Tab check error:', chrome.runtime.lastError);
            return resolve();
          }
          
          if (tab.status === 'complete') {
            // Additional wait for dynamic content
            setTimeout(resolve, 1000);
          } else {
            setTimeout(checkComplete, 100);
          }
        });
      };
      checkComplete();
    });
  }

  async stop(): Promise<void> {
    if (this.usePlaywright) {
      await this.automator.cleanup();
    }
    this.currentTabId = null;
    console.log('✅ [NavigatorAgent] Stopped');
  }
}