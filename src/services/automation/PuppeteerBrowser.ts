// Use browser-specific Puppeteer entrypoint
import {
  connect,
  ExtensionTransport,
} from 'puppeteer-core/lib/esm/puppeteer/puppeteer-core-browser.js';

export interface BrowserState {
  url: string;
  title: string;
  readyState: string;
  scrollY: number;
  scrollHeight: number;
  viewportHeight: number;
  timestamp: number;
}

export class PuppeteerBrowser {
  private browser: any = null;
  private page: any = null;
  private tabId: number;
  private currentState: BrowserState | null = null;

  constructor(tabId: number) {
    this.tabId = tabId;
  }

  async connect(): Promise<void> {
    try {
      console.log('🔌 [PuppeteerBrowser] Creating ExtensionTransport for tab:', this.tabId);
      
      // Connect using ExtensionTransport
      const transport = await ExtensionTransport.connectTab(this.tabId);
      console.log('✅ [PuppeteerBrowser] ExtensionTransport created');
      
      this.browser = await connect({ transport });
      console.log('✅ [PuppeteerBrowser] Browser connected');

      // Get the single page corresponding to the tab
      const pages = await this.browser.pages();
      this.page = pages[0];
      console.log('✅ [PuppeteerBrowser] Page acquired:', pages.length, 'pages found');

      // Setup anti-detection
      await this.setupAntiDetection();
      console.log('✅ [PuppeteerBrowser] Anti-detection setup complete');
      
      // Initialize state
      await this.updateState();
      console.log('✅ [PuppeteerBrowser] State initialized');
      
      console.log('✅ [PuppeteerBrowser] Connected to tab:', this.tabId);
    } catch (error) {
      console.error('❌ [PuppeteerBrowser] Connection failed at step:', error);
      console.error('Full error:', error);
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

    // Override plugins and languages
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });
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

  getCurrentState(): BrowserState | null {
    return this.currentState;
  }

  async cleanup(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.disconnect();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}