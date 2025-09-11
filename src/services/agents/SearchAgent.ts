import { AIService } from '../ai/AIService';
import { PuppeteerAutomation } from '../automation/PuppeteerAutomation';
import { TaskStep } from '../../types/agents';
import { PageContext } from './PageAnalyzerAgent';

export interface SearchResult {
  success: boolean;
  query: string;
  resultsCount: number;
  results: any[];
  searchMethod: 'form' | 'url' | 'api';
}

export class SearchAgent {
  private aiService: AIService;

  constructor() {
    console.log('🔍 [SearchAgent] Initializing...');
    this.aiService = AIService.getInstance();
  }

  async executeSearch(step: TaskStep, _pageContext: PageContext, automation: PuppeteerAutomation): Promise<SearchResult> {
    console.log('🔍 [SearchAgent] Executing search:', step.description);
    
    try {
      const domState = await automation.getState();
      
      // Find search interface
      const searchInterface = await this.findSearchInterface(domState);
      
      if (!searchInterface) {
        throw new Error('No search interface found on page');
      }
      
      // Execute search based on interface type
      await this.performSearch(step, searchInterface, automation);
      
      // Wait for results to load
      await automation.wait(3000);
      
      // Analyze results
      const resultsAnalysis = await this.analyzeSearchResults(automation);
      
      return {
        success: true,
        query: String(step.data),
        resultsCount: resultsAnalysis.count,
        results: resultsAnalysis.results,
        searchMethod: searchInterface.method
      };
      
    } catch (error) {
      console.error('❌ [SearchAgent] Search failed:', error);
      return {
        success: false,
        query: String(step.data),
        resultsCount: 0,
        results: [],
        searchMethod: 'form'
      };
    }
  }

  private async findSearchInterface(domState: any): Promise<{method: 'form' | 'url', elementIndex?: number, inputIndex?: number} | null> {
    console.log('🔍 [SearchAgent] Finding search interface...');
    
    // Look for search input fields
    const searchInputs = domState.elementTree?.filter((el: any) => 
      el.tagName?.toLowerCase() === 'input' && (
        el.attributes?.type === 'search' ||
        el.attributes?.placeholder?.toLowerCase().includes('search') ||
        el.attributes?.name?.toLowerCase().includes('search') ||
        el.attributes?.id?.toLowerCase().includes('search')
      )
    );
    
    if (searchInputs && searchInputs.length > 0) {
      // Find the index of the first search input
      const inputIndex = domState.elementTree?.findIndex((el: any) => el === searchInputs[0]);
      
      return {
        method: 'form',
        inputIndex: inputIndex
      };
    }
    
    // Look for search buttons or links
    const searchButtons = domState.elementTree?.filter((el: any) => 
      (el.tagName?.toLowerCase() === 'button' || el.tagName?.toLowerCase() === 'a') &&
      el.textContent?.toLowerCase().includes('search')
    );
    
    if (searchButtons && searchButtons.length > 0) {
      const buttonIndex = domState.elementTree?.findIndex((el: any) => el === searchButtons[0]);
      
      return {
        method: 'form',
        elementIndex: buttonIndex
      };
    }
    
    return null;
  }

  private async performSearch(step: TaskStep, searchInterface: any, automation: PuppeteerAutomation): Promise<void> {
    console.log('🔍 [SearchAgent] Performing search...');
    
    if (searchInterface.method === 'form') {
      if (searchInterface.inputIndex !== undefined) {
        // Fill search input
        await automation.fillByIndex(searchInterface.inputIndex, String(step.data));
        
        // Press Enter or find submit button
        await automation.sendKeys('Enter');
      } else if (searchInterface.elementIndex !== undefined) {
        // Click search button
        await automation.clickByIndex(searchInterface.elementIndex);
      }
    }
  }

  private async analyzeSearchResults(automation: PuppeteerAutomation): Promise<{count: number, results: any[]}> {
    console.log('🔍 [SearchAgent] Analyzing search results...');
    
    try {
      const domState = await automation.getState();
      
      // Use AI to identify and extract search results
      const prompt = `Analyze this page for search results:

Page elements: ${JSON.stringify(domState.elementTree?.slice(0, 30))}

Identify search result items and extract:
{
  "count": 5,
  "results": [
    {
      "title": "Result title",
      "description": "Result description",
      "link": "Result URL if available",
      "metadata": "Any additional info"
    }
  ]
}`;

      const response = await this.aiService.generateChatResponse(prompt);
      const analysis = this.parseAIResponse(response);
      
      return {
        count: analysis.count || 0,
        results: analysis.results || []
      };
      
    } catch (error) {
      console.error('❌ [SearchAgent] Results analysis failed:', error);
      return { count: 0, results: [] };
    }
  }

  async handleSearchFilters(filters: any, automation: PuppeteerAutomation): Promise<boolean> {
    console.log('🔍 [SearchAgent] Applying search filters...');
    
    try {
      const domState = await automation.getState();
      
      // Find filter elements
      const filterElements = domState.elementTree?.filter((el: any) => 
        el.attributes?.class?.includes('filter') ||
        el.attributes?.class?.includes('facet') ||
        el.textContent?.toLowerCase().includes('filter')
      );
      
      if (filterElements && filterElements.length > 0) {
        // Apply filters based on provided criteria
        for (const [filterType, filterValue] of Object.entries(filters)) {
          await this.applyFilter(filterType, filterValue, filterElements, automation);
        }
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ [SearchAgent] Filter application failed:', error);
      return false;
    }
  }

  private async applyFilter(filterType: string, _filterValue: any, filterElements: any[], automation: PuppeteerAutomation): Promise<void> {
    // Find relevant filter element
    const relevantFilter = filterElements.find(el => 
      el.textContent?.toLowerCase().includes(filterType.toLowerCase())
    );
    
    if (relevantFilter) {
      const elementIndex = filterElements.indexOf(relevantFilter);
      await automation.clickByIndex(elementIndex);
      await automation.wait(1000);
    }
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
      return { count: 0, results: [] };
    }
  }
}