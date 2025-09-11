import { z } from 'zod';
import { ActionResult } from '../ActionRegistry';

export const clickActionSchema = z.object({
  selector: z.string().optional(),
  index: z.number().optional(),
  query: z.string().optional()
});

export class ClickAction {
  name(): string {
    return 'click';
  }

  schema(): z.ZodType {
    return clickActionSchema;
  }

  hasIndex(): boolean {
    return true;
  }

  async execute(params: z.infer<typeof clickActionSchema>, context: any): Promise<ActionResult> {
    try {
      const { selector, index, query } = params;
      
      if (index !== undefined) {
        await this.clickByIndex(index, context);
      } else if (selector) {
        await this.clickBySelector(selector, context);
      } else if (query) {
        await this.clickByQuery(query, context);
      } else {
        throw new Error('Click action requires selector, index, or query');
      }

      return {
        success: true,
        data: { clicked: true }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async clickByIndex(index: number, context: any): Promise<void> {
    const { domAnalyzer, tabId } = context;
    const analysis = await domAnalyzer.analyzeTab(tabId, false);
    const element = analysis.elements[index];
    
    if (!element) {
      throw new Error(`Element at index ${index} not found`);
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (xpath: string) => {
        const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement;
        if (element) {
          element.click();
        } else {
          throw new Error('Element not found via XPath');
        }
      },
      args: [element.xpath]
    });
  }

  private async clickBySelector(selector: string, context: any): Promise<void> {
    const { tabId } = context;
    
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (sel: string) => {
        const element = document.querySelector(sel) as HTMLElement;
        if (element) {
          element.click();
        } else {
          throw new Error(`Element not found: ${sel}`);
        }
      },
      args: [selector]
    });
  }

  private async clickByQuery(query: string, context: any): Promise<void> {
    const { domAnalyzer, tabId } = context;
    const analysis = await domAnalyzer.analyzeTab(tabId, false);
    
    const matchingElement = analysis.elements.find((el: any) =>
      el.isInteractive && el.text?.toLowerCase().includes(query.toLowerCase())
    );
    
    if (!matchingElement) {
      throw new Error(`No element found matching query: ${query}`);
    }

    await this.clickByIndex(matchingElement.highlightIndex || 0, context);
  }
}