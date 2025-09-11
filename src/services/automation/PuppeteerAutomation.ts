import { connect, ExtensionTransport } from 'puppeteer-core/lib/esm/puppeteer/puppeteer-core-browser.js';
import type { Browser, Page } from 'puppeteer-core';

// Extend Window interface for injected scripts
declare global {
  interface Window {
    buildDomTree: (args?: any) => any;
    delightUtils: {
      clickElement: (index: number) => string;
      fillElement: (index: number, value: string) => string;
      extractElement: (index: number) => string;
      removeHighlights: () => void;
    };
  }
}

interface DOMState {
  elementTree: any;
  selectorMap: Record<number, any>;
  url: string;
  title: string;
  scrollY: number;
  scrollHeight: number;
  visualViewportHeight: number;
  elementCount: number;
  timestamp: number;
}

export class PuppeteerAutomation {
  private tabId: number;
  private browser: Browser | null = null;
  private _page: Page | null = null;
  private cachedState: DOMState | null = null;
  private isScriptInjected: boolean = false;
  
  get page(): Page | null {
    return this._page;
  }

  constructor(tabId: number) {
    this.tabId = tabId;
  }

  async connect(): Promise<void> {
    console.log('🔌 [Puppeteer] Connecting to tab:', this.tabId);
    
    try {
      this.browser = await connect({
        transport: await ExtensionTransport.connectTab(this.tabId),
        defaultViewport: null,
        protocol: 'cdp'
      }) as any;
      
      if (!this.browser) throw new Error('Failed to connect to browser');
      
      const pages = await this.browser.pages();
      this._page = pages[0];
      
      // Add comprehensive anti-detection
      await this.addAntiDetectionScripts();
      
      // Inject DOM analysis script
      await this.injectDOMScript();
      
      console.log('✅ [Puppeteer] Connected successfully');
    } catch (error) {
      console.error('❌ [Puppeteer] Connection failed:', error);
      throw new Error(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async addAntiDetectionScripts(): Promise<void> {
    if (!this._page) return;
    
    await this._page.evaluateOnNewDocument(`
      // Webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });

      // Chrome runtime
      window.chrome = { runtime: {} };

      // Permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // Shadow DOM
      (function () {
        const originalAttachShadow = Element.prototype.attachShadow;
        Element.prototype.attachShadow = function attachShadow(options) {
          return originalAttachShadow.call(this, { ...options, mode: "open" });
        };
      })();

      // Plugin array
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });

      // Languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
    `);
  }

  private async injectDOMScript(): Promise<void> {
    if (!this._page || this.isScriptInjected) return;
    
    try {
      // Check current URL to see if injection is possible
      const currentUrl = this._page.url();
      const isRestrictedPage = currentUrl.startsWith('chrome://') || 
                              currentUrl.startsWith('chrome-extension://') || 
                              currentUrl.startsWith('edge://') || 
                              currentUrl.startsWith('about:') ||
                              currentUrl === 'chrome://newtab/' ||
                              currentUrl === '';
      
      if (isRestrictedPage) {
        console.log('🌐 [Puppeteer] Restricted page detected, skipping script injection until navigation');
        return; // Skip injection on restricted pages
      }
      
      // Check if script is already injected
      const isInjected = await this._page.evaluate(() => {
        return typeof (window as any).buildDomTree === 'function';
      });
      
      if (!isInjected) {
        // Inject the buildDomTree script
        await chrome.scripting.executeScript({
          target: { tabId: this.tabId },
          files: ['buildDomTree.js']
        });
      }
      
      this.isScriptInjected = true;
      console.log('✅ [Puppeteer] DOM script injected');
    } catch (error) {
      console.warn('⚠️ [Puppeteer] DOM script injection failed:', error);
      // Don't throw - continue with limited functionality
    }
  }

  async navigate(url: string): Promise<void> {
    if (!this._page) throw new Error('Not connected');
    console.log('🧭 [Puppeteer] Navigating to:', url);
    
    await this._page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
    
    // Always re-inject script after navigation (now on accessible page)
    this.isScriptInjected = false;
    await this.injectDOMScript();
  }

  async getState(useVision = false): Promise<DOMState> {
    if (!this._page) throw new Error('Not connected');
    
    await this.waitForPageLoad();
    await this.injectDOMScript();
    
    console.log('🎨 [Puppeteer] Analyzing DOM...');
    
    const state = await this._page.evaluate((args) => {
      if (typeof (window as any).buildDomTree !== 'function') {
        throw new Error('DOM analysis script not loaded');
      }
      
      return (window as any).buildDomTree(args);
    }, {
      shouldHighlight: true,
      viewportExpansion: 100,
      includeDynamicAttributes: true,
      maxElements: 500
    });
    
    // Take screenshot if needed
    if (useVision) {
      state.screenshot = await this.takeScreenshot();
    }
    
    this.cachedState = state;
    console.log(`✅ [Puppeteer] Found ${state.elementCount} interactive elements`);
    
    return state;
  }

  async highlightElements(): Promise<DOMState> {
    return await this.getState();
  }

  private async waitForPageLoad(): Promise<void> {
    if (!this._page) return;
    
    try {
      // Wait for network idle (Puppeteer equivalent)
      await this._page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
    } catch (error) {
      // Fallback: wait for DOM content loaded
      try {
        await this._page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 3000 });
      } catch (fallbackError) {
        console.warn('⚠️ [Puppeteer] Page load timeout, continuing...');
      }
    }
    
    // Additional wait for dynamic content
    await this.wait(1000);
  }

  private async takeScreenshot(): Promise<string | null> {
    if (!this._page) return null;
    
    try {
      const screenshot = await this._page.screenshot({
        fullPage: false,
        type: 'jpeg',
        quality: 80
      });
      return Buffer.from(screenshot).toString('base64');
    } catch (error) {
      console.warn('⚠️ [Puppeteer] Screenshot failed:', error);
      return null;
    }
  }

  async clickByIndex(index: number): Promise<void> {
    if (!this._page) throw new Error('Not connected');
    console.log(`👆 [Puppeteer] Clicking element ${index}`);
    
    try {
      // First try using the utility function
      await this._page.evaluate((idx) => {
        if (typeof (window as any).delightUtils?.clickElement === 'function') {
          return (window as any).delightUtils.clickElement(idx);
        }
        throw new Error('Utility functions not available');
      }, index);
    } catch (error) {
      // Fallback to direct Puppeteer click
      console.warn('⚠️ [Puppeteer] Utility click failed, trying Puppeteer click:', error);
      
      const element = await this._page.$(`[data-delight-index="${index}"]`);
      if (!element) {
        throw new Error(`Element ${index} not found`);
      }
      
      await element.scrollIntoView();
      await element.click();
    }
    
    await this.waitForPageLoad();
  }

  async fillByIndex(index: number, value: string): Promise<void> {
    if (!this._page) throw new Error('Not connected');
    console.log(`✏️ [Puppeteer] Filling element ${index} with:`, value);
    
    try {
      // First try using the utility function
      await this._page.evaluate((idx, val) => {
        if (typeof (window as any).delightUtils?.fillElement === 'function') {
          return (window as any).delightUtils.fillElement(idx, val);
        }
        throw new Error('Utility functions not available');
      }, index, value);
    } catch (error) {
      // Fallback to direct Puppeteer fill
      console.warn('⚠️ [Puppeteer] Utility fill failed, trying Puppeteer fill:', error);
      
      const element = await this._page.$(`[data-delight-index="${index}"]`);
      if (!element) {
        throw new Error(`Element ${index} not found`);
      }
      
      await element.scrollIntoView();
      await element.focus();
      await element.type(value);
    }
  }

  async extractByIndex(index: number): Promise<string> {
    if (!this._page) throw new Error('Not connected');
    console.log(`📄 [Puppeteer] Extracting from element ${index}`);
    
    try {
      // First try using the utility function
      return await this._page.evaluate((idx) => {
        if (typeof (window as any).delightUtils?.extractElement === 'function') {
          return (window as any).delightUtils.extractElement(idx);
        }
        throw new Error('Utility functions not available');
      }, index);
    } catch (error) {
      // Fallback to direct extraction
      console.warn('⚠️ [Puppeteer] Utility extract failed, trying direct extract:', error);
      
      const element = await this._page.$(`[data-delight-index="${index}"]`);
      if (!element) {
        throw new Error(`Element ${index} not found`);
      }
      
      const text = await element.evaluate(el => el.textContent || (el as any).innerText || '');
      return text || '';
    }
  }

  async wait(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  // Advanced actions
  async scrollToText(text: string, nth: number = 1): Promise<boolean> {
    if (!this._page) throw new Error('Not connected');
    console.log(`🔍 [Puppeteer] Scrolling to text: "${text}" (occurrence ${nth})`);
    
    return await this._page.evaluate((searchText, occurrence) => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT
      );
      
      const matches = [];
      let node;
      
      while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.toLowerCase().includes(searchText.toLowerCase())) {
          if (node.parentElement) {
            matches.push(node.parentElement);
          }
        }
      }
      
      if (matches.length >= occurrence) {
        const target = matches[occurrence - 1];
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return true;
        }
      }
      
      return false;
    }, text, nth);
  }

  async scrollToPercent(percent: number): Promise<void> {
    if (!this._page) throw new Error('Not connected');
    console.log(`📜 [Puppeteer] Scrolling to ${percent}%`);
    
    await this._page.evaluate((pct) => {
      const scrollHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollTop = (scrollHeight - viewportHeight) * (pct / 100);
      
      window.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }, percent);
    
    await this.wait(1000);
  }

  async sendKeys(keys: string): Promise<void> {
    if (!this._page) throw new Error('Not connected');
    console.log(`⌨️ [Puppeteer] Sending keys: ${keys}`);
    
    const keyParts = keys.split('+');
    const modifiers = keyParts.slice(0, -1);
    const mainKey = keyParts[keyParts.length - 1];
    
    try {
      // Press modifiers
      for (const modifier of modifiers) {
        await this._page.keyboard.down(modifier as any);
      }
      
      // Press main key
      await this._page.keyboard.press(mainKey as any);
      
    } finally {
      // Release modifiers
      for (const modifier of [...modifiers].reverse()) {
        await this._page.keyboard.up(modifier as any);
      }
    }
  }

  async getDropdownOptions(index: number): Promise<Array<{text: string, value: string}>> {
    if (!this._page) throw new Error('Not connected');
    console.log(`📋 [Puppeteer] Getting dropdown options for element ${index}`);
    
    return await this._page.evaluate((idx) => {
      const element = document.querySelector(`[data-delight-index="${idx}"]`);
      if (!element || element.tagName.toLowerCase() !== 'select') {
        throw new Error(`Element ${idx} is not a select dropdown`);
      }
      
      return Array.from((element as HTMLSelectElement).options).map((option: HTMLOptionElement) => ({
        text: option.text,
        value: option.value
      }));
    }, index);
  }

  async selectDropdownOption(index: number, optionText: string): Promise<void> {
    if (!this._page) throw new Error('Not connected');
    console.log(`📋 [Puppeteer] Selecting "${optionText}" from dropdown ${index}`);
    
    await this._page.evaluate((idx, text) => {
      const element = document.querySelector(`[data-delight-index="${idx}"]`);
      if (!element || element.tagName.toLowerCase() !== 'select') {
        throw new Error(`Element ${idx} is not a select dropdown`);
      }
      
      const selectElement = element as HTMLSelectElement;
      const option = Array.from(selectElement.options).find((opt: HTMLOptionElement) => 
        opt.text.trim() === text || opt.value === text
      );
      
      if (!option) {
        throw new Error(`Option "${text}" not found in dropdown`);
      }
      
      selectElement.value = option.value;
      selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    }, index, optionText);
  }

  async removeHighlights(): Promise<void> {
    if (!this._page) return;
    
    await this._page.evaluate(() => {
      if (typeof (window as any).delightUtils?.removeHighlights === 'function') {
        (window as any).delightUtils.removeHighlights();
      }
    });
  }

  getCachedState(): DOMState | null {
    return this.cachedState;
  }

  async cleanup(): Promise<void> {
    console.log('🧹 [Puppeteer] Cleaning up...');
    
    await this.removeHighlights();
    
    if (this.browser) {
      await this.browser.disconnect();
      this.browser = null;
      this._page = null;
    }
    
    this.cachedState = null;
    this.isScriptInjected = false;
  }
}