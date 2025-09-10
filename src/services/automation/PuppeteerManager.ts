import { ExtensionTransport } from './ExtensionTransport';

export interface BrowserState {
  url: string;
  title: string;
  readyState: string;
  scrollY: number;
  scrollHeight: number;
  viewportHeight: number;
  timestamp: number;
}

export class PuppeteerManager {
  private browser: any = null;
  private page: any = null;
  private transport: ExtensionTransport | null = null;
  private currentState: BrowserState | null = null;

  async connectToTab(tabId: number): Promise<void> {
    try {
      // Dynamic import to prevent bundle issues
      const puppeteer = await import('puppeteer-core');
      
      // Create transport
      this.transport = await ExtensionTransport.connectTab(tabId);
      
      // Connect via CDP
      this.browser = await puppeteer.connect({
        transport: this.transport as any,
        defaultViewport: null
      });

      // Get the page
      const pages = await this.browser.pages();
      this.page = pages.find((p: any) => p.url() !== 'about:blank') || pages[0];
      
      // Setup anti-detection
      await this.setupAntiDetection();
      
      // Initialize state tracking
      await this.updateState();
      
      console.log('✅ [PuppeteerManager] Connected to tab:', tabId);
    } catch (error) {
      console.error('❌ [PuppeteerManager] Connection failed:', error);
      throw error;
    }
  }

  private async setupAntiDetection(): Promise<void> {
    if (!this.page) return;

    // Hide webdriver property
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
    });

    // Override permissions API
    await this.page.evaluateOnNewDocument(() => {
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission } as any) :
          originalQuery(parameters)
      );
    });

    // Override plugins
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });
    });

    // Override languages
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
    });
  }

  async updateState(): Promise<BrowserState> {
    if (!this.page) throw new Error('No page available');

    const state = await this.page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      readyState: document.readyState,
      scrollY: window.scrollY,
      scrollHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      timestamp: Date.now()
    }));

    this.currentState = state;
    return state;
  }

  async navigate(url: string): Promise<void> {
    if (!this.page) throw new Error('No page available');
    
    await this.page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    await this.updateState();
  }

  async click(selector: string): Promise<void> {
    if (!this.page) throw new Error('No page available');
    
    await this.page.waitForSelector(selector, { timeout: 10000 });
    await this.page.click(selector);
    await this.updateState();
  }

  async fill(selector: string, value: string): Promise<void> {
    if (!this.page) throw new Error('No page available');
    
    await this.page.waitForSelector(selector, { timeout: 10000 });
    await this.page.type(selector, value);
    await this.updateState();
  }

  async extract(selector: string): Promise<string> {
    if (!this.page) throw new Error('No page available');
    
    await this.page.waitForSelector(selector, { timeout: 10000 });
    return await this.page.$eval(selector, (el: any) => el.textContent || el.value || '');
  }

  async screenshot(): Promise<Buffer> {
    if (!this.page) throw new Error('No page available');
    
    return await this.page.screenshot({ type: 'png' });
  }

  getCurrentState(): BrowserState | null {
    return this.currentState;
  }

  async cleanup(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.disconnect();
      }
      if (this.transport) {
        await this.transport.close();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}