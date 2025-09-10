export interface DOMElement {
  tagName: string;
  xpath: string;
  isVisible: boolean;
  isInteractive: boolean;
  highlightIndex?: number;
  rect?: DOMRect;
  text?: string;
}

export interface DOMAnalysisResult {
  elements: DOMElement[];
  interactiveCount: number;
  url: string;
  title: string;
}

export class DOMAnalyzer {
  async analyzeTab(tabId: number, highlight: boolean = true): Promise<DOMAnalysisResult> {
    try {
      console.log('🔍 [DOMAnalyzer] Starting analysis for tab:', tabId);
      
      // Inject the DOM analysis script if not already present
      await this.injectAnalysisScript(tabId);
      console.log('✅ [DOMAnalyzer] Script injected');

      // Execute the analysis
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: this.executeDOMAnalysis,
        args: [highlight]
      });
      
      console.log('📊 [DOMAnalyzer] Raw results:', results);

      if (!results || results.length === 0) {
        throw new Error('No script execution results returned');
      }
      
      if (!results[0]) {
        throw new Error('First result is null or undefined');
      }
      
      if (!results[0].result) {
        console.error('❌ [DOMAnalyzer] Result is empty:', results[0]);
        console.warn('⚠️ [DOMAnalyzer] Returning fallback result');
        
        // Return a basic fallback result
        return {
          elements: [],
          interactiveCount: 0,
          url: 'unknown',
          title: 'Analysis Failed'
        };
      }
      
      console.log('✅ [DOMAnalyzer] Analysis completed:', results[0].result);
      return results[0].result;
    } catch (error) {
      console.error('❌ [DOMAnalyzer] Analysis failed:', error);
      throw error;
    }
  }

  async clearHighlights(tabId: number): Promise<void> {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        if ((window as any).clearDOMHighlights) {
          (window as any).clearDOMHighlights();
        }
      }
    });
  }

  private async injectAnalysisScript(tabId: number): Promise<void> {
    try {
      console.log('📜 [DOMAnalyzer] Checking if script already injected');
      
      // Check if script is already injected
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          console.log('Checking for delightDOMAnalyzer:', window.hasOwnProperty('delightDOMAnalyzer'));
          return window.hasOwnProperty('delightDOMAnalyzer');
        }
      });

      if (!results[0].result) {
        console.log('📜 [DOMAnalyzer] Injecting DOM analyzer script');
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['dom-analyzer.js']
        });
        console.log('✅ [DOMAnalyzer] Script injection completed');
      } else {
        console.log('✅ [DOMAnalyzer] Script already injected');
      }
    } catch (error) {
      console.error('❌ [DOMAnalyzer] Script injection failed:', error);
      throw error;
    }
  }

  private executeDOMAnalysis(highlight: boolean): DOMAnalysisResult {
    // This function runs in the page context via executeScript
    console.log('🔍 [DOMAnalyzer] Executing analysis in page context, highlight:', highlight);
    
    if (!(window as any).executeDOMAnalysis) {
      console.error('❌ [DOMAnalyzer] executeDOMAnalysis function not found on window');
      console.log('Available window properties:', Object.keys(window).filter(k => k.includes('DOM') || k.includes('delight')));
      throw new Error('DOM analysis script not properly injected');
    }
    
    try {
      const result = (window as any).executeDOMAnalysis(highlight);
      console.log('✅ [DOMAnalyzer] Page analysis result:', result);
      
      if (!result) {
        throw new Error('Analysis returned null/undefined');
      }
      
      if (!result.elements) {
        throw new Error('Analysis result missing elements array');
      }
      
      return result;
    } catch (error) {
      console.error('❌ [DOMAnalyzer] Page analysis error:', error);
      throw error;
    }
  }


}