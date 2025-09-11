export class CDPBrowser {
  private tabId: number;
  private debuggeeAttached: boolean = false;

  constructor(tabId: number) {
    this.tabId = tabId;
  }

  async connect(): Promise<void> {
    try {
      console.log('🔌 [CDPBrowser] Connecting to tab:', this.tabId);
      
      // Attach debugger - works on ANY page including chrome:// and settings
      await chrome.debugger.attach({ tabId: this.tabId }, '1.3');
      this.debuggeeAttached = true;
      console.log('✅ [CDPBrowser] Debugger attached');

      // Enable required domains
      await chrome.debugger.sendCommand({ tabId: this.tabId }, 'Runtime.enable');
      console.log('✅ [CDPBrowser] CDP domains enabled');
      
    } catch (error) {
      console.error('❌ [CDPBrowser] Connection failed:', error);
      throw error;
    }
  }

  async navigate(url: string): Promise<void> {
    if (!this.debuggeeAttached) throw new Error('Debugger not attached');
    
    console.log('🧭 [CDPBrowser] Navigating to:', url);
    await chrome.tabs.update(this.tabId, { url });
    
    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ [CDPBrowser] Navigation completed');
  }

  async click(selector: string): Promise<void> {
    if (!this.debuggeeAttached) throw new Error('Debugger not attached');
    
    console.log('👆 [CDPBrowser] Clicking:', selector);
    const result = await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      'Runtime.evaluate',
      {
        expression: `
          const element = document.querySelector('${selector}');
          if (!element) throw new Error('Element not found: ${selector}');
          element.click();
          'clicked';
        `
      }
    );
    
    if ((result as any).exceptionDetails) {
      throw new Error((result as any).exceptionDetails.text);
    }
    
    console.log('✅ [CDPBrowser] Click completed');
  }

  async fill(selector: string, value: string): Promise<void> {
    if (!this.debuggeeAttached) throw new Error('Debugger not attached');
    
    console.log('✏️ [CDPBrowser] Filling:', selector, 'with:', value);
    const result = await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      'Runtime.evaluate',
      {
        expression: `
          const element = document.querySelector('${selector}');
          if (!element) throw new Error('Element not found: ${selector}');
          
          element.focus();
          element.value = '${value.replace(/'/g, "\\'")}';
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          'filled';
        `
      }
    );
    
    if ((result as any).exceptionDetails) {
      throw new Error((result as any).exceptionDetails.text);
    }
    
    console.log('✅ [CDPBrowser] Fill completed');
  }

  async extract(selector: string): Promise<string> {
    if (!this.debuggeeAttached) throw new Error('Debugger not attached');
    
    console.log('📄 [CDPBrowser] Extracting from:', selector);
    const result = await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      'Runtime.evaluate',
      {
        expression: `
          const element = document.querySelector('${selector}');
          if (!element) throw new Error('Element not found: ${selector}');
          element.textContent || element.value || '';
        `
      }
    );
    
    if ((result as any).exceptionDetails) {
      throw new Error((result as any).exceptionDetails.text);
    }
    
    const extracted = (result as any).result.value || '';
    console.log('✅ [CDPBrowser] Extracted:', extracted.substring(0, 100));
    return extracted;
  }

  async wait(ms: number): Promise<void> {
    console.log(`⏳ [CDPBrowser] Waiting ${ms}ms...`);
    await new Promise(resolve => setTimeout(resolve, ms));
    console.log('✅ [CDPBrowser] Wait completed');
  }

  async analyzePage(): Promise<any> {
    if (!this.debuggeeAttached) throw new Error('Debugger not attached');

    try {
      console.log('🔍 [CDPBrowser] Analyzing page...');
      
      const result = await chrome.debugger.sendCommand(
        { tabId: this.tabId },
        'Runtime.evaluate',
        {
          expression: `
            // Clear existing highlights
            const existing = document.getElementById('delight-highlights');
            if (existing) existing.remove();
            
            // Create highlight container
            const container = document.createElement('div');
            container.id = 'delight-highlights';
            container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999999;';
            document.body.appendChild(container);
            
            // Find interactive elements
            const elements = [];
            let index = 0;
            
            const isVisible = (el) => {
              const rect = el.getBoundingClientRect();
              const style = getComputedStyle(el);
              return rect.width > 0 && rect.height > 0 && 
                     style.display !== 'none' && style.visibility !== 'hidden' &&
                     rect.top < window.innerHeight && rect.bottom > 0;
            };
            
            const isInteractive = (el) => {
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
                highlight.style.cssText = \`
                  position: fixed;
                  border: 2px solid \${color};
                  background: \${color}20;
                  top: \${rect.top}px;
                  left: \${rect.left}px;
                  width: \${rect.width}px;
                  height: \${rect.height}px;
                  pointer-events: none;
                  z-index: 999999;
                \`;
                container.appendChild(highlight);
                
                // Create number label
                const label = document.createElement('div');
                label.textContent = index.toString();
                label.style.cssText = \`
                  position: fixed;
                  background: \${color};
                  color: white;
                  padding: 2px 6px;
                  border-radius: 3px;
                  font-size: 12px;
                  font-weight: bold;
                  top: \${Math.max(0, rect.top - 20)}px;
                  left: \${rect.left}px;
                  z-index: 1000000;
                  pointer-events: none;
                \`;
                container.appendChild(label);
                
                elements.push({
                  index: index,
                  tag: el.tagName.toLowerCase(),
                  text: (el.textContent || el.value || '').trim().substring(0, 100),
                  selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ')[0] : ''),
                  rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
                });
                
                index++;
              }
            });
            
            console.log('✨ Highlighted', index, 'elements');
            
            return {
              elements: elements,
              count: index,
              url: window.location.href,
              title: document.title
            };
          `
        }
      );
      
      if ((result as any).exceptionDetails) {
        throw new Error((result as any).exceptionDetails.text);
      }
      
      const analysis = (result as any).result.value;
      console.log(`✅ [CDPBrowser] Found ${analysis.count} interactive elements`);
      return analysis;
      
    } catch (error) {
      console.error('❌ [CDPBrowser] Analysis failed:', error);
      return { elements: [], count: 0, url: '', title: '' };
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.debuggeeAttached) {
        await chrome.debugger.detach({ tabId: this.tabId });
        this.debuggeeAttached = false;
        console.log('✅ [CDPBrowser] Cleanup completed');
      }
    } catch (error) {
      console.error('❌ [CDPBrowser] Cleanup error:', error);
    }
  }
}