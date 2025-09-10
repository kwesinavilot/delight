import { TaskStep } from '../../types/agents';
import { PuppeteerBrowser } from '../automation/PuppeteerBrowser';

export class NavigatorAgent {
  private currentTabId: number | null = null;
  private puppeteerBrowser: PuppeteerBrowser | null = null;
  private usePuppeteer: boolean = false;

  constructor() {
    // Constructor now only handles basic initialization
  }

  async initialize(): Promise<void> {
    console.log('🧭 [NavigatorAgent] Initializing...');
    
    // Get current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      this.currentTabId = tabs[0].id!;
    }
    
    // Try Puppeteer first
    try {
      if (this.currentTabId) {
        console.log('🔌 [NavigatorAgent] Attempting Puppeteer connection to tab:', this.currentTabId);
        console.log('🔌 [NavigatorAgent] Checking Puppeteer import...');
        
        // Test if Puppeteer can be imported
        const puppeteerModule = await import('../automation/PuppeteerBrowser');
        console.log('✅ [NavigatorAgent] Puppeteer module imported successfully');
        
        this.puppeteerBrowser = new puppeteerModule.PuppeteerBrowser(this.currentTabId);
        console.log('🔌 [NavigatorAgent] PuppeteerBrowser instance created, attempting connection...');
        
        await this.puppeteerBrowser.connect();
        this.usePuppeteer = true;
        console.log('✅ [NavigatorAgent] Initialized with Puppeteer');
        return;
      }
    } catch (error) {
      console.error('❌ [NavigatorAgent] Puppeteer connection failed:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    }
    
    // Fallback to Chrome Extension APIs
    if (this.currentTabId) {
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
        case 'analyzePage':
          result = await this.analyzePage(step.data?.highlight !== false);
          break;
        case 'smartFill':
          result = await this.smartFill(step.data?.query, step.data?.value);
          break;
        case 'smartClick':
          result = await this.smartClick(step.data?.query || step.description || 'button');
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
    
    if (this.usePuppeteer && this.puppeteerBrowser) {
      await this.puppeteerBrowser.navigate(url);
      return;
    }
    
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
    
    if (this.usePuppeteer && this.puppeteerBrowser) {
      await this.puppeteerBrowser.click(selector);
      return;
    }
    
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

  private async analyzePage(highlight: boolean = true): Promise<any> {
    if (!this.currentTabId) {
      throw new Error('No active tab');
    }
    
    // Use DOM analyzer directly instead of BrowserAutomator
    const { DOMAnalyzer } = await import('../automation/DOMAnalyzer');
    const analyzer = new DOMAnalyzer();
    return await analyzer.analyzeTab(this.currentTabId, highlight);
  }

  private async smartFill(query: string, value: string): Promise<void> {
    console.log('🧠 [NavigatorAgent] Smart fill:', { query, value });
    
    // First analyze the page to find interactive elements
    const analysis = await this.analyzePage(false);
    const elements = analysis.result?.elements || [];
    
    // Find input elements that match the query
    const inputElements = elements.filter((el: any) => 
      el.tagName === 'input' || el.tagName === 'textarea' ||
      (el.text && el.text.toLowerCase().includes(query.toLowerCase()))
    );
    
    if (inputElements.length === 0) {
      throw new Error(`No input elements found for query: ${query}`);
    }
    
    // Use the first matching element
    const targetElement = inputElements[0];
    console.log('🎯 [NavigatorAgent] Found target element:', targetElement);
    
    // Fill using XPath
    await this.injectScript(`
      const element = document.evaluate('${targetElement.xpath}', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (element) {
        element.focus();
        element.value = '${value.replace(/'/g, "\\'")}';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      throw new Error('Element not found via XPath');
    `);
  }

  private async smartClick(query: string): Promise<void> {
    console.log('🧠 [NavigatorAgent] Smart click:', query);
    
    if (!query) {
      throw new Error('Smart click requires a query parameter');
    }
    
    // Try DOM analysis first
    try {
      const analysis = await this.analyzePage(false);
      const elements = analysis.elements || [];
      
      if (elements.length > 0) {
        // Find clickable elements that match the query
        const clickableElements = elements.filter((el: any) => 
          el.isInteractive && (
            (el.text && el.text.toLowerCase().includes(query.toLowerCase())) ||
            el.tagName === 'button' ||
            (el.tagName === 'a' && query.toLowerCase().includes('link'))
          )
        );
        
        if (clickableElements.length > 0) {
          const targetElement = clickableElements[0];
          console.log('🎯 [NavigatorAgent] Found target element:', targetElement);
          
          // Click using XPath
          await this.injectScript(`
            const element = document.evaluate('${targetElement.xpath}', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (element) {
              element.click();
              return true;
            }
            throw new Error('Element not found via XPath');
          `);
          return;
        }
      }
    } catch (error) {
      console.warn('⚠️ [NavigatorAgent] DOM analysis failed, using fallback:', error);
    }
    
    // Fallback: Use common selectors based on query
    const fallbackSelectors = this.getFallbackSelectors(query);
    
    for (const selector of fallbackSelectors) {
      try {
        console.log('🔄 [NavigatorAgent] Trying fallback selector:', selector);
        await this.click(selector);
        return;
      } catch (error) {
        console.warn('⚠️ [NavigatorAgent] Fallback selector failed:', selector, error);
      }
    }
    
    throw new Error(`No clickable elements found for query: ${query}`);
  }
  
  private getFallbackSelectors(query: string): string[] {
    const q = query.toLowerCase();
    
    if (q.includes('search')) {
      return [
        'input[type="search"]',
        'input[placeholder*="search" i]',
        '[data-testid*="search"]',
        '.search-input',
        '#search'
      ];
    }
    
    if (q.includes('send')) {
      return [
        'button[type="submit"]',
        '[data-testid*="send"]',
        'button[aria-label*="send" i]',
        '.send-button'
      ];
    }
    
    return [
      'button',
      'a',
      '[role="button"]',
      'input[type="button"]'
    ];
  }

  async stop(): Promise<void> {
    if (this.usePuppeteer && this.puppeteerBrowser) {
      await this.puppeteerBrowser.cleanup();
    }
    this.currentTabId = null;
    console.log('✅ [NavigatorAgent] Stopped');
  }
}