// Content script-based automation like Nanobrowser
export class ContentScriptAutomation {
  private tabId: number;

  constructor(tabId: number) {
    this.tabId = tabId;
  }

  async connect(): Promise<void> {
    console.log('🔌 [ContentScript] Connecting to tab:', this.tabId);
    
    try {
      // Inject content script with error handling
      await chrome.scripting.executeScript({
        target: { tabId: this.tabId },
        func: this.injectAutomationScript
      });
      
      console.log('✅ [ContentScript] Connected successfully');
    } catch (error) {
      console.error('❌ [ContentScript] Injection failed:', error);
      throw new Error(`Failed to inject automation script: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private injectAutomationScript() {
    // This runs in the page context
    (window as any).delightAutomation = {
      highlightElements: () => {
        // Clear existing highlights
        const existing = document.getElementById('delight-highlights');
        if (existing) existing.remove();
        
        // Create highlight container
        const container = document.createElement('div');
        container.id = 'delight-highlights';
        container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999999;';
        document.body.appendChild(container);
        
        // Find interactive elements
        const elements: any[] = [];
        let index = 0;
        
        const isVisible = (el: Element) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return rect.width > 0 && rect.height > 0 && 
                 style.display !== 'none' && style.visibility !== 'hidden' &&
                 rect.top < window.innerHeight && rect.bottom > 0;
        };
        
        const isInteractive = (el: Element) => {
          const tag = el.tagName.toLowerCase();
          return ['a', 'button', 'input', 'select', 'textarea'].includes(tag) ||
                 el.hasAttribute('onclick') || el.getAttribute('role') === 'button' ||
                 getComputedStyle(el).cursor === 'pointer';
        };
        
        // Find and highlight elements
        document.querySelectorAll('*').forEach(el => {
          if (isVisible(el) && isInteractive(el)) {
            const rect = el.getBoundingClientRect();
            const color = '#FF0000';
            
            // Create highlight
            const highlight = document.createElement('div');
            highlight.style.cssText = `
              position: fixed;
              border: 2px solid ${color};
              background: ${color}20;
              top: ${rect.top}px;
              left: ${rect.left}px;
              width: ${rect.width}px;
              height: ${rect.height}px;
              pointer-events: none;
              z-index: 999999;
            `;
            container.appendChild(highlight);
            
            // Create number label
            const label = document.createElement('div');
            label.textContent = index.toString();
            label.style.cssText = `
              position: fixed;
              background: ${color};
              color: white;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 12px;
              font-weight: bold;
              top: ${Math.max(0, rect.top - 20)}px;
              left: ${rect.left}px;
              z-index: 1000000;
              pointer-events: none;
            `;
            container.appendChild(label);
            
            // Store element reference
            el.setAttribute('data-delight-index', index.toString());
            
            elements.push({
              index: index,
              tag: el.tagName.toLowerCase(),
              role: el.getAttribute('role'),
              label: el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || '',
              href: el.getAttribute('href'),
              type: el.getAttribute('type'),
              text: (el.textContent || (el as any).value || '').trim().substring(0, 100),
              rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
            });
            
            index++;
          }
        });
        
        console.log('✨ Highlighted', index, 'elements');
        return { elements, count: index, elementCount: index, url: window.location.href, title: document.title };
      },
      
      clickElement: (index: number) => {
        const element = document.querySelector(`[data-delight-index="${index}"]`);
        if (!element) throw new Error(`Element ${index} not found`);
        
        // Multiple click strategies like Nanobrowser
        (element as any).focus();
        (element as any).click();
        
        return `Clicked element ${index}`;
      },
      
      fillElement: (index: number, value: string) => {
        const element = document.querySelector(`[data-delight-index="${index}"]`);
        if (!element) throw new Error(`Element ${index} not found`);
        
        // Multiple fill strategies
        (element as any).focus();
        (element as any).value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        return `Filled element ${index}`;
      },
      
      extractElement: (index: number) => {
        const element = document.querySelector(`[data-delight-index="${index}"]`);
        if (!element) throw new Error(`Element ${index} not found`);
        
        return element.textContent || (element as any).value || '';
      }
    };
  }

  async navigate(url: string): Promise<void> {
    console.log('🧭 [ContentScript] Navigating to:', url);
    await chrome.tabs.update(this.tabId, { url });
    
    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Re-inject script after navigation
    await this.connect();
  }

  async highlightElements(): Promise<any> {
    console.log('🎨 [ContentScript] Highlighting elements...');
    
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: this.tabId },
        func: () => {
          if (!(window as any).delightAutomation) {
            throw new Error('Automation script not loaded');
          }
          return JSON.stringify((window as any).delightAutomation.highlightElements());
        }
      });
      
      if (!results || !results[0]) {
        throw new Error('No results from highlight script');
      }
      
      const raw = results[0]?.result;
      const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!result || !Array.isArray(result.elements) || !result.url) {
        throw new Error('Page observation returned no valid data. Cannot safely choose browser actions.');
      }
      return { ...result, elementCount: result.elements.length };
    } catch (error) {
      console.error('❌ [ContentScript] Highlight failed:', error);
      throw new Error(`Failed to highlight elements: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getState(): Promise<any> {
    return this.highlightElements();
  }

  async getDropdownOptions(index: number): Promise<any[]> {
    const results = await chrome.scripting.executeScript({
      target: { tabId: this.tabId },
      func: (idx) => Array.from(document.querySelectorAll(`[data-delight-index="${idx}"] option`)).map((option: any) => ({ text: option.textContent || '', value: option.value })),
      args: [index]
    });
    return results[0]?.result || [];
  }

  async selectDropdownOption(index: number, option: string): Promise<void> {
    await chrome.scripting.executeScript({
      target: { tabId: this.tabId },
      func: (idx: number, value: string) => {
        const element = document.querySelector(`[data-delight-index="${idx}"]`) as HTMLSelectElement | null;
        if (!element) throw new Error(`Element ${idx} not found`);
        element.value = value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
      },
      args: [index, String(option)]
    });
  }

  async scrollToPercent(percent: number): Promise<void> {
    await chrome.scripting.executeScript({
      target: { tabId: this.tabId },
      func: (value: number) => window.scrollTo({ top: document.body.scrollHeight * value / 100, behavior: 'smooth' }),
      args: [percent]
    });
  }

  async scrollToText(text: string, nth = 1): Promise<boolean> {
    const results = await chrome.scripting.executeScript({
      target: { tabId: this.tabId },
      func: (needle: string, occurrence: number) => {
        const matches = Array.from(document.querySelectorAll('body *')).filter(el => (el.textContent || '').toLowerCase().includes(needle.toLowerCase()));
        const element = matches[occurrence - 1] as HTMLElement | undefined;
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return !!element;
      },
      args: [text, nth]
    });
    return !!results[0]?.result;
  }

  async sendKeys(keys: string): Promise<void> {
    await chrome.scripting.executeScript({
      target: { tabId: this.tabId },
      func: value => { if (value === 'Alt+ArrowLeft') history.back(); },
      args: [keys]
    });
  }

  async clickByIndex(index: number): Promise<void> {
    console.log(`👆 [ContentScript] Clicking element ${index}`);
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: this.tabId },
        func: (idx) => {
          if (!(window as any).delightAutomation) {
            throw new Error('Automation script not loaded');
          }
          return (window as any).delightAutomation.clickElement(idx);
        },
        args: [index]
      });
      
      await this.wait(1000);
    } catch (error) {
      console.error('❌ [ContentScript] Click failed:', error);
      throw new Error(`Failed to click element ${index}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async fillByIndex(index: number, value: string): Promise<void> {
    console.log(`✏️ [ContentScript] Filling element ${index} with:`, value);
    
    await chrome.scripting.executeScript({
      target: { tabId: this.tabId },
      func: (idx, val) => (window as any).delightAutomation.fillElement(idx, val),
      args: [index, value]
    });
  }

  async extractByIndex(index: number): Promise<string> {
    console.log(`📄 [ContentScript] Extracting from element ${index}`);
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: this.tabId },
      func: (idx) => (window as any).delightAutomation.extractElement(idx),
      args: [index]
    });
    
    return results[0].result;
  }

  async wait(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup(): Promise<void> {
    console.log('✅ [ContentScript] Cleanup completed');
  }
}
