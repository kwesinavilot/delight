// Simple automation system that actually works
export class SimpleAutomation {
  private tabId: number;
  private debuggeeAttached: boolean = false;
  private lastAnalysis: any = null;

  constructor(tabId: number) {
    this.tabId = tabId;
  }

  async connect(): Promise<void> {
    try {
      console.log('🔌 [SimpleAutomation] Connecting to tab:', this.tabId);
      
      // Check if tab is accessible
      const tab = await chrome.tabs.get(this.tabId);
      console.log('📋 [SimpleAutomation] Tab URL:', tab.url);
      
      // Handle chrome:// and edge:// URLs by navigating to a regular page first
      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('edge://')) {
        console.log('🌐 [SimpleAutomation] Chrome/Edge page detected, navigating to YouTube...');
        await chrome.tabs.update(this.tabId, { url: 'https://www.youtube.com' });
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for navigation
      }
      
      // Attach debugger
      await chrome.debugger.attach({ tabId: this.tabId }, '1.3');
      this.debuggeeAttached = true;
      
      // Enable runtime
      await chrome.debugger.sendCommand({ tabId: this.tabId }, 'Runtime.enable');
      
      console.log('✅ [SimpleAutomation] Connected successfully');
    } catch (error) {
      console.error('❌ [SimpleAutomation] Connection failed:', error);
      throw error;
    }
  }

  async navigate(url: string): Promise<void> {
    console.log('🧭 [SimpleAutomation] Navigating to:', url);
    await chrome.tabs.update(this.tabId, { url });
    await this.wait(3000); // Wait for page load
    console.log('✅ [SimpleAutomation] Navigation completed');
  }

  async click(selector: string): Promise<void> {
    console.log('👆 [SimpleAutomation] Clicking:', selector);
    
    const result = await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      'Runtime.evaluate',
      {
        expression: `
          try {
            const element = document.querySelector('${selector}');
            if (!element) throw new Error('Element not found: ${selector}');
            element.click();
            'clicked';
          } catch (error) {
            throw new Error('Click failed: ' + error.message);
          }
        `
      }
    );
    
    if ((result as any).exceptionDetails) {
      const errorMsg = (result as any).exceptionDetails.exception?.description || 
                      (result as any).exceptionDetails.text || 
                      'Unknown click error';
      throw new Error(errorMsg);
    }
    
    await this.wait(1000); // Wait for click effects
    console.log('✅ [SimpleAutomation] Click completed');
  }

  async fill(selector: string, value: string): Promise<void> {
    console.log('✏️ [SimpleAutomation] Filling:', selector, 'with:', value);
    
    const result = await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      'Runtime.evaluate',
      {
        expression: `
          try {
            const element = document.querySelector('${selector}');
            if (!element) throw new Error('Element not found: ${selector}');
            
            element.focus();
            element.value = '${value.replace(/'/g, "\\'")}';
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            'filled';
          } catch (error) {
            throw new Error('Fill failed: ' + error.message);
          }
        `
      }
    );
    
    if ((result as any).exceptionDetails) {
      const errorMsg = (result as any).exceptionDetails.exception?.description || 
                      (result as any).exceptionDetails.text || 
                      'Unknown fill error';
      throw new Error(errorMsg);
    }
    
    console.log('✅ [SimpleAutomation] Fill completed');
  }

  async extract(selector: string): Promise<string> {
    console.log('📄 [SimpleAutomation] Extracting from:', selector);
    
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
    console.log('✅ [SimpleAutomation] Extracted:', extracted.substring(0, 100));
    return extracted;
  }

  async wait(ms: number): Promise<void> {
    console.log(`⏳ [SimpleAutomation] Waiting ${ms}ms...`);
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async highlightElements(): Promise<any> {
    console.log('🎨 [SimpleAutomation] Highlighting elements...');
    
    try {
      const result = await chrome.debugger.sendCommand(
        { tabId: this.tabId },
        'Runtime.evaluate',
        {
          expression: `
            console.log('Starting element highlighting...');
            
            // Check if document is ready
            if (!document.body) {
              throw new Error('Document body not ready');
            }
            
            // Clear existing highlights
            const existing = document.getElementById('delight-highlights');
            if (existing) existing.remove();
            
            // Create highlight container
            const container = document.createElement('div');
            container.id = 'delight-highlights';
            container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999999;';
            document.body.appendChild(container);
            
            console.log('Highlight container created');
            
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
            
            console.log('✨ Highlighted', index, 'elements on', window.location.href);
            
            if (index === 0) {
              console.warn('No interactive elements found! Page might not be loaded.');
            }
            
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
      this.lastAnalysis = analysis; // Store for index-based interactions
      console.log(`✅ [SimpleAutomation] Highlighted ${analysis.count} elements`);
      return analysis;
      
    } catch (error) {
      console.error('❌ [SimpleAutomation] Highlighting failed:', error);
      return { elements: [], count: 0, url: '', title: '' };
    }
  }

  async clickByIndex(index: number): Promise<void> {
    if (!this.lastAnalysis || !this.lastAnalysis.elements[index]) {
      throw new Error(`Element ${index} not found. Run analyzePage first.`);
    }
    
    const element = this.lastAnalysis.elements[index];
    console.log(`👆 [SimpleAutomation] Clicking element ${index}:`, element.text.substring(0, 50));
    

    
    await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      'Runtime.evaluate',
      {
        expression: `
          const elements = document.querySelectorAll('*');
          const targetElement = Array.from(elements)[${index}];
          if (targetElement) {
            targetElement.click();
            'clicked element ${index}';
          } else {
            throw new Error('Element ${index} not found');
          }
        `
      }
    );
    
    await this.wait(1000);
    console.log(`✅ [SimpleAutomation] Clicked element ${index}`);
  }

  async fillByIndex(index: number, value: string): Promise<void> {
    if (!this.lastAnalysis || !this.lastAnalysis.elements[index]) {
      throw new Error(`Element ${index} not found. Run analyzePage first.`);
    }
    
    console.log(`✏️ [SimpleAutomation] Filling element ${index} with:`, value);
    
    await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      'Runtime.evaluate',
      {
        expression: `
          const elements = document.querySelectorAll('input, textarea');
          const targetElement = elements[${index}];
          if (targetElement) {
            targetElement.focus();
            targetElement.value = '${value.replace(/'/g, "\\'")}';
            targetElement.dispatchEvent(new Event('input', { bubbles: true }));
            targetElement.dispatchEvent(new Event('change', { bubbles: true }));
            'filled element ${index}';
          } else {
            throw new Error('Input element ${index} not found');
          }
        `
      }
    );
    
    console.log(`✅ [SimpleAutomation] Filled element ${index}`);
  }

  async extractByIndex(index: number): Promise<string> {
    if (!this.lastAnalysis || !this.lastAnalysis.elements[index]) {
      throw new Error(`Element ${index} not found. Run analyzePage first.`);
    }
    
    console.log(`📄 [SimpleAutomation] Extracting from element ${index}`);
    
    const result = await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      'Runtime.evaluate',
      {
        expression: `
          const elements = document.querySelectorAll('*');
          const targetElement = elements[${index}];
          if (targetElement) {
            targetElement.textContent || targetElement.value || '';
          } else {
            throw new Error('Element ${index} not found');
          }
        `
      }
    );
    
    const extracted = (result as any).result.value || '';
    console.log(`✅ [SimpleAutomation] Extracted from element ${index}:`, extracted.substring(0, 100));
    return extracted;
  }

  async cleanup(): Promise<void> {
    try {
      if (this.debuggeeAttached) {
        await chrome.debugger.detach({ tabId: this.tabId });
        this.debuggeeAttached = false;
        console.log('✅ [SimpleAutomation] Cleanup completed');
      }
    } catch (error) {
      console.error('❌ [SimpleAutomation] Cleanup error:', error);
    }
  }
}