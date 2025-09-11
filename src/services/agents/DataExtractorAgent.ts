import { AIService } from '../ai/AIService';
import { PuppeteerAutomation } from '../automation/PuppeteerAutomation';
import { TaskStep } from '../../types/agents';
import { PageContext } from './PageAnalyzerAgent';

export interface ExtractedData {
  type: 'table' | 'list' | 'product' | 'search_results' | 'text';
  data: any;
  count: number;
  source: string;
}

export class DataExtractorAgent {
  private aiService: AIService;

  constructor() {
    console.log('📊 [DataExtractorAgent] Initializing...');
    this.aiService = AIService.getInstance();
  }

  async extractData(step: TaskStep, pageContext: PageContext, automation: PuppeteerAutomation): Promise<ExtractedData> {
    console.log('📊 [DataExtractorAgent] Extracting data:', step.description);
    
    try {
      const domState = await automation.getState();
      
      // Determine extraction strategy based on page context
      if (pageContext.hasTable) {
        return await this.extractTableData(domState);
      } else if (pageContext.pageType === 'search' || pageContext.pageType === 'listing') {
        return await this.extractSearchResults(domState);
      } else if (pageContext.pageType === 'product') {
        return await this.extractProductInfo(domState);
      } else {
        return await this.extractGenericData(step, domState, automation);
      }
      
    } catch (error) {
      console.error('❌ [DataExtractorAgent] Extraction failed:', error);
      throw error;
    }
  }

  private async extractTableData(domState: any): Promise<ExtractedData> {
    console.log('📊 [DataExtractorAgent] Extracting table data...');
    
    // Use AI to understand table structure and extract data
    const prompt = `Extract structured data from this table:

Page elements: ${JSON.stringify(domState.elementTree?.slice(0, 20))}

Identify table headers and rows. Extract as structured JSON:
{
  "headers": ["col1", "col2", "col3"],
  "rows": [
    ["val1", "val2", "val3"],
    ["val4", "val5", "val6"]
  ]
}`;

    const response = await this.aiService.generateChatResponse(prompt);
    const tableData = this.parseAIResponse(response);
    
    return {
      type: 'table',
      data: tableData,
      count: tableData.rows?.length || 0,
      source: domState.url
    };
  }

  private async extractSearchResults(domState: any): Promise<ExtractedData> {
    console.log('📊 [DataExtractorAgent] Extracting search results...');
    
    const prompt = `Extract search results from this page:

Elements: ${JSON.stringify(domState.elementTree?.slice(0, 30))}

Extract each result with title, description, and link if available:
{
  "results": [
    {
      "title": "Result title",
      "description": "Result description", 
      "link": "Result URL",
      "price": "Price if available"
    }
  ]
}`;

    const response = await this.aiService.generateChatResponse(prompt);
    const results = this.parseAIResponse(response);
    
    return {
      type: 'search_results',
      data: results.results || [],
      count: results.results?.length || 0,
      source: domState.url
    };
  }

  private async extractProductInfo(domState: any): Promise<ExtractedData> {
    console.log('📊 [DataExtractorAgent] Extracting product info...');
    
    const prompt = `Extract product information from this page:

Elements: ${JSON.stringify(domState.elementTree?.slice(0, 20))}

Extract product details:
{
  "name": "Product name",
  "price": "Product price",
  "description": "Product description",
  "availability": "In stock/Out of stock",
  "rating": "Product rating",
  "features": ["feature1", "feature2"]
}`;

    const response = await this.aiService.generateChatResponse(prompt);
    const product = this.parseAIResponse(response);
    
    return {
      type: 'product',
      data: product,
      count: 1,
      source: domState.url
    };
  }

  private async extractGenericData(step: TaskStep, domState: any, automation: PuppeteerAutomation): Promise<ExtractedData> {
    console.log('📊 [DataExtractorAgent] Extracting generic data...');
    
    if (step.elementIndex !== undefined) {
      // Extract from specific element
      const text = await automation.extractByIndex(step.elementIndex);
      return {
        type: 'text',
        data: text,
        count: 1,
        source: domState.url
      };
    }
    
    // Extract general page content
    const prompt = `Extract relevant data from this page based on the task: ${step.description}

Page content: ${JSON.stringify(domState.elementTree?.slice(0, 15))}

Extract the most relevant information as structured data.`;

    const response = await this.aiService.generateChatResponse(prompt);
    const data = this.parseAIResponse(response);
    
    return {
      type: 'text',
      data: data,
      count: Array.isArray(data) ? data.length : 1,
      source: domState.url
    };
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
      return { data: response };
    }
  }
}