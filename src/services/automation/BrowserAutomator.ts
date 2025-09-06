// Dynamic imports to prevent bundle issues
type Browser = any;
type Page = any;
import { TaskStep } from '../../types/agents';

export class BrowserAutomator {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private pages: Map<number, Page> = new Map();

  async initialize(): Promise<void> {
    try {
      // Try to connect to existing browser instance
      this.browser = await this.connectToExistingBrowser();
      
      if (!this.browser) {
        throw new Error('Could not connect to browser');
      }

      // Get or create a page
      const context = this.browser.contexts()[0] || await this.browser.newContext();
      const pages = context.pages();
      this.page = pages.length > 0 ? pages[0] : await context.newPage();
      
      console.log('✅ [BrowserAutomator] Connected to browser');
    } catch (error) {
      console.error('❌ [BrowserAutomator] Failed to initialize:', error);
      throw error;
    }
  }

  private async connectToExistingBrowser(): Promise<Browser | null> {
    try {
      // Dynamic import to prevent bundle issues
      const { chromium } = await import('playwright-core');
      return await chromium.connectOverCDP('http://localhost:9222');
    } catch (error) {
      console.warn('Playwright connection failed:', error);
      return null;
    }
  }

  async executeStep(step: TaskStep): Promise<any> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    console.log(`🤖 [BrowserAutomator] Executing: ${step.type} - ${step.description}`);

    try {
      switch (step.type) {
        // Navigation Actions
        case 'navigate':
          return await this.navigate(step.url!);
        case 'back':
          return await this.page.goBack();
        case 'forward':
          return await this.page.goForward();
        case 'refresh':
          return await this.page.reload();
        case 'newTab':
          return await this.newTab();
        case 'closeTab':
          return await this.closeTab(step.tabId);
        case 'switchTab':
          return await this.switchTab(step.tabId!);

        // Element Interaction
        case 'click':
          return await this.click(step.selector!);
        case 'doubleClick':
          return await this.page.dblclick(step.selector!);
        case 'rightClick':
          return await this.page.click(step.selector!, { button: 'right' });
        case 'hover':
          return await this.page.hover(step.selector!);
        case 'scroll':
          return await this.scroll(step.selector, step.data);
        case 'focus':
          return await this.page.focus(step.selector!);

        // Form & Input
        case 'fill':
          return await this.fill(step.selector!, step.data);
        case 'clear':
          return await this.page.fill(step.selector!, '');
        case 'select':
          return await this.page.selectOption(step.selector!, step.data);
        case 'check':
          return await this.page.check(step.selector!);
        case 'uncheck':
          return await this.page.uncheck(step.selector!);
        case 'upload':
          return await this.page.setInputFiles(step.selector!, step.data);
        case 'submit':
          return await this.submit(step.selector!);

        // Data Extraction
        case 'extract':
          return await this.extract(step.selector!, step.data);
        case 'screenshot':
          return await this.screenshot(step.data);
        case 'getUrl':
          return this.page.url();
        case 'getTitle':
          return await this.page.title();
        case 'getCookies':
          return await this.page.context().cookies();

        // Waiting & Timing
        case 'wait':
          return await this.page.waitForTimeout(step.data || 1000);
        case 'waitForElement':
          return await this.page.waitForSelector(step.selector!, { timeout: step.timeout });
        case 'waitForText':
          return await this.page.waitForFunction(
            (text: string) => document.body.innerText.includes(text),
            step.data,
            { timeout: step.timeout }
          );
        case 'waitForUrl':
          return await this.page.waitForURL(step.data, { timeout: step.timeout });
        case 'waitForLoad':
          return await this.page.waitForLoadState('load');

        // Advanced Actions
        case 'executeScript':
          return await this.page.evaluate(step.data);
        case 'setViewport':
          return await this.page.setViewportSize(step.data);
        case 'handleAlert':
          return await this.handleAlert(step.data);

        // Validation
        case 'verify':
          return await this.verify(step.selector!, step.expected);
        case 'verifyText':
          return await this.verifyText(step.selector!, step.expected);
        case 'verifyUrl':
          return this.page.url() === step.expected;

        default:
          throw new Error(`Unknown action type: ${step.type}`);
      }
    } catch (error) {
      console.error(`❌ [BrowserAutomator] Step failed:`, error);
      throw error;
    }
  }

  private async navigate(url: string): Promise<void> {
    await this.page!.goto(url, { waitUntil: 'load' });
  }

  private async click(selector: string): Promise<void> {
    await this.page!.waitForSelector(selector, { timeout: 5000 });
    await this.page!.click(selector);
  }

  private async fill(selector: string, text: string): Promise<void> {
    await this.page!.waitForSelector(selector, { timeout: 5000 });
    await this.page!.fill(selector, text);
  }

  private async extract(selector: string, attribute?: string): Promise<string | null> {
    if (attribute) {
      return await this.page!.getAttribute(selector, attribute);
    }
    return await this.page!.textContent(selector);
  }

  private async scroll(selector?: string, options?: any): Promise<void> {
    if (selector) {
      await this.page!.locator(selector).scrollIntoViewIfNeeded();
    } else {
      await this.page!.evaluate((opts: any) => {
        window.scrollBy(opts.x || 0, opts.y || 0);
      }, options || { x: 0, y: 100 });
    }
  }

  private async submit(selector: string): Promise<void> {
    await this.page!.locator(selector).press('Enter');
  }

  private async screenshot(options?: any): Promise<Buffer> {
    return await this.page!.screenshot(options || { type: 'png' });
  }

  private async newTab(): Promise<number> {
    const newPage = await this.browser!.newPage();
    const tabId = this.pages.size;
    this.pages.set(tabId, newPage);
    return tabId;
  }

  private async closeTab(tabId?: number): Promise<void> {
    if (tabId !== undefined && this.pages.has(tabId)) {
      await this.pages.get(tabId)!.close();
      this.pages.delete(tabId);
    } else {
      await this.page!.close();
    }
  }

  private async switchTab(tabId: number): Promise<void> {
    const targetPage = this.pages.get(tabId);
    if (targetPage) {
      this.page = targetPage;
      await this.page.bringToFront();
    }
  }

  private async verify(selector: string, _expected: any): Promise<boolean> {
    try {
      const element = await this.page!.waitForSelector(selector, { timeout: 5000 });
      return element !== null;
    } catch {
      return false;
    }
  }

  private async verifyText(selector: string, expectedText: string): Promise<boolean> {
    try {
      const text = await this.page!.textContent(selector);
      return text?.includes(expectedText) || false;
    } catch {
      return false;
    }
  }

  private async handleAlert(action: 'accept' | 'dismiss' | 'text'): Promise<string | void> {
    return new Promise((resolve) => {
      this.page!.once('dialog', async (dialog: any) => {
        const text = dialog.message();
        if (action === 'accept') {
          await dialog.accept();
        } else if (action === 'dismiss') {
          await dialog.dismiss();
        }
        resolve(action === 'text' ? text : undefined);
      });
    });
  }

  async cleanup(): Promise<void> {
    try {
      // Close all managed pages
      for (const page of this.pages.values()) {
        await page.close();
      }
      this.pages.clear();

      // Don't close the main browser as it's the user's browser
      this.browser = null;
      this.page = null;
      
      console.log('✅ [BrowserAutomator] Cleaned up');
    } catch (error) {
      console.error('❌ [BrowserAutomator] Cleanup failed:', error);
    }
  }
}