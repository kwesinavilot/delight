export interface BrowserState {
  url: string;
  title: string;
  readyState: string;
  scrollY: number;
  scrollHeight: number;
  viewportHeight: number;
  timestamp: number;
}

export class CDPManager {
  private tabId: number;
  private isAttached: boolean = false;
  private currentState: BrowserState | null = null;

  constructor(tabId: number) {
    this.tabId = tabId;
  }

  async connect(): Promise<void> {
    try {
      await chrome.debugger.attach({ tabId: this.tabId }, '1.3');
      this.isAttached = true;
      
      // Setup anti-detection
      await this.setupAntiDetection();
      
      // Initialize state
      await this.updateState();
      
      console.log('✅ [CDPManager] Connected to tab:', this.tabId);
    } catch (error) {
      console.error('❌ [CDPManager] Connection failed:', error);
      throw error;
    }
  }

  private async setupAntiDetection(): Promise<void> {
    if (!this.isAttached) return;

    // Hide webdriver property
    await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      'Runtime.addBinding',
      { name: 'hideWebdriver' }
    );

    await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      'Runtime.evaluate',
      {
        expression: `
          Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
          Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
          Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        `
      }
    );
  }

  async updateState(): Promise<BrowserState> {
    if (!this.isAttached) throw new Error('CDP not connected');

    const result = await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      'Runtime.evaluate',
      {
        expression: `({
          url: window.location.href,
          title: document.title,
          readyState: document.readyState,
          scrollY: window.scrollY,
          scrollHeight: document.documentElement.scrollHeight,
          viewportHeight: window.innerHeight,
          timestamp: Date.now()
        })`
      }
    ) as any;

    this.currentState = result.result.value;
    return this.currentState!;
  }

  async navigate(url: string): Promise<void> {
    if (!this.isAttached) throw new Error('CDP not connected');
    
    await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      'Page.navigate',
      { url }
    );
    
    // Wait for load
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.updateState();
  }

  async click(selector: string): Promise<void> {
    if (!this.isAttached) throw new Error('CDP not connected');
    
    await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      'Runtime.evaluate',
      {
        expression: `
          const element = document.querySelector('${selector}');
          if (element) {
            element.click();
            true;
          } else {
            throw new Error('Element not found: ${selector}');
          }
        `
      }
    );
    
    await this.updateState();
  }

  async fill(selector: string, value: string): Promise<void> {
    if (!this.isAttached) throw new Error('CDP not connected');
    
    await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      'Runtime.evaluate',
      {
        expression: `
          const element = document.querySelector('${selector}');
          if (element) {
            element.focus();
            element.value = '${value.replace(/'/g, "\\'")}';
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            true;
          } else {
            throw new Error('Element not found: ${selector}');
          }
        `
      }
    );
    
    await this.updateState();
  }

  async extract(selector: string): Promise<string> {
    if (!this.isAttached) throw new Error('CDP not connected');
    
    const result = await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      'Runtime.evaluate',
      {
        expression: `
          const element = document.querySelector('${selector}');
          element ? (element.textContent || element.value || '') : '';
        `
      }
    ) as any;
    
    return result.result.value || '';
  }

  getCurrentState(): BrowserState | null {
    return this.currentState;
  }

  async cleanup(): Promise<void> {
    if (this.isAttached) {
      try {
        await chrome.debugger.detach({ tabId: this.tabId });
      } catch (error) {
        console.error('CDP cleanup error:', error);
      }
      this.isAttached = false;
    }
  }
}