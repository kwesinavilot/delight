// Simple test to check if Playwright can connect
export class PlaywrightTest {
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🎭 Testing Playwright connection...');
      
      // Try to import playwright-core
      const { chromium } = await import('playwright-core');
      console.log('✅ Playwright-core imported successfully');
      
      // Try to connect to existing browser
      const browser = await chromium.connectOverCDP('http://localhost:9222');
      console.log('✅ Connected to browser via CDP');
      
      // Get pages
      const contexts = browser.contexts();
      const context = contexts[0] || await browser.newContext();
      const pages = context.pages();
      const page = pages[0] || await context.newPage();
      
      console.log('✅ Got page instance');
      
      // Test basic navigation
      await page.goto('https://example.com');
      const title = await page.title();
      console.log('✅ Navigation test successful, title:', title);
      
      return true;
    } catch (error) {
      console.error('❌ Playwright test failed:', error);
      return false;
    }
  }
}