import { AIService } from '../ai/AIService';
import { PuppeteerAutomation } from '../automation/PuppeteerAutomation';

export interface PageContext {
  pageType: 'form' | 'search' | 'product' | 'listing' | 'article' | 'unknown';
  hasForm: boolean;
  hasSearch: boolean;
  hasTable: boolean;
  hasPagination: boolean;
  interactiveElements: number;
  loadingState: 'loading' | 'loaded' | 'error';
  url: string;
  title: string;
}

export class PageAnalyzerAgent {
  private aiService: AIService;

  constructor() {
    console.log('🔍 [PageAnalyzerAgent] Initializing...');
    this.aiService = AIService.getInstance();
  }

  async analyzePage(automation: PuppeteerAutomation): Promise<PageContext> {
    console.log('🔍 [PageAnalyzerAgent] Analyzing page...');
    
    try {
      const domState = await automation.getState();
      
      // Use AI to analyze page structure
      const prompt = `Analyze this page structure and classify it:

URL: ${domState.url}
Title: ${domState.title}
Interactive Elements: ${domState.elementCount}

Page contains:
- Forms: ${this.hasFormElements(domState)}
- Search interfaces: ${this.hasSearchElements(domState)}
- Tables: ${this.hasTableElements(domState)}
- Pagination: ${this.hasPaginationElements(domState)}

Classify the page type as: form, search, product, listing, article, or unknown.
Respond with JSON only:
{
  "pageType": "form|search|product|listing|article|unknown",
  "confidence": 0.8,
  "reasoning": "brief explanation"
}`;

      const response = await this.aiService.generateChatResponse(prompt);
      const analysis = this.parseAIResponse(response);
      
      const context: PageContext = {
        pageType: analysis.pageType || 'unknown',
        hasForm: this.hasFormElements(domState),
        hasSearch: this.hasSearchElements(domState),
        hasTable: this.hasTableElements(domState),
        hasPagination: this.hasPaginationElements(domState),
        interactiveElements: domState.elementCount,
        loadingState: 'loaded',
        url: domState.url,
        title: domState.title
      };
      
      console.log('✅ [PageAnalyzerAgent] Page analyzed:', context.pageType);
      return context;
      
    } catch (error) {
      console.error('❌ [PageAnalyzerAgent] Analysis failed:', error);
      return this.getDefaultContext();
    }
  }

  private hasFormElements(domState: any): boolean {
    return domState.elementTree?.some((el: any) => 
      ['input', 'textarea', 'select', 'button[type="submit"]'].includes(el.tagName?.toLowerCase())
    ) || false;
  }

  private hasSearchElements(domState: any): boolean {
    return domState.elementTree?.some((el: any) => 
      el.attributes?.type === 'search' || 
      el.attributes?.placeholder?.toLowerCase().includes('search') ||
      el.attributes?.name?.toLowerCase().includes('search')
    ) || false;
  }

  private hasTableElements(domState: any): boolean {
    return domState.elementTree?.some((el: any) => 
      el.tagName?.toLowerCase() === 'table'
    ) || false;
  }

  private hasPaginationElements(domState: any): boolean {
    return domState.elementTree?.some((el: any) => 
      el.textContent?.toLowerCase().includes('next') ||
      el.textContent?.toLowerCase().includes('previous') ||
      el.attributes?.class?.includes('pagination')
    ) || false;
  }

  private parseAIResponse(response: string): any {
    try {
      let jsonStr = response.trim();
      if (jsonStr.includes('```json')) {
        const match = jsonStr.match(/```json\s*([\s\S]*?)```/);
        if (match) jsonStr = match[1].trim();
      }
      return JSON.parse(jsonStr);
    } catch {
      return { pageType: 'unknown' };
    }
  }

  private getDefaultContext(): PageContext {
    return {
      pageType: 'unknown',
      hasForm: false,
      hasSearch: false,
      hasTable: false,
      hasPagination: false,
      interactiveElements: 0,
      loadingState: 'error',
      url: '',
      title: ''
    };
  }
}