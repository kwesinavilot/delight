import { TaskStep } from '../../types/agents';

export class NavigatorAgent {
  private currentTabId: number | null = null;

  async initialize(): Promise<void> {
    console.log('🧭 [NavigatorAgent] Initializing...');
    // Get current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      this.currentTabId = tabs[0].id!;
      console.log('✅ [NavigatorAgent] Initialized with tab ID:', this.currentTabId);
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
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }
      console.log('✅ [NavigatorAgent] Step completed:', result);
      return result;
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
    const result = await this.injectScript(`
      const element = document.querySelector('${selector}');
      if (element) {
        return element.textContent || element.innerText || '';
      }
      throw new Error('Element not found: ${selector}');
    `);
    console.log('✅ [NavigatorAgent] Data extraction completed:', result);
    return result;
  }

  private async fill(selector: string, value: string): Promise<void> {
    console.log('⌨️ [NavigatorAgent] Filling field:', { selector, value });
    await this.injectScript(`
      const element = document.querySelector('${selector}');
      if (element) {
        element.value = '${value}';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      throw new Error('Element not found: ${selector}');
    `);
    console.log('✅ [NavigatorAgent] Fill completed');
  }

  private async wait(duration: number): Promise<void> {
    console.log(`⏳ [NavigatorAgent] Waiting for ${duration}ms...`);
    await new Promise(resolve => setTimeout(resolve, duration));
    console.log('✅ [NavigatorAgent] Wait completed');
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
      const checkComplete = () => {
        if (!this.currentTabId) return resolve();
        
        chrome.tabs.get(this.currentTabId, (tab) => {
          if (tab.status === 'complete') {
            resolve();
          } else {
            setTimeout(checkComplete, 100);
          }
        });
      };
      checkComplete();
    });
  }

  async stop(): Promise<void> {
    // Stop any ongoing operations
    this.currentTabId = null;
  }
}