export interface PageMetadata {
  wordCount: number;
  readingTime: number;
  language: string;
  contentType: string;
  structure: {
    headings: string[];
    links: number;
    images: number;
    videos: number;
    forms: number;
  };
  seo: {
    description: string;
    keywords: string[];
    author: string;
    publishDate: string;
  };
}

export interface PageContext {
  title: string;
  url: string;
  content: string;
  excerpt: string;
  metadata: PageMetadata;
  rawText: string;
  cleanedText: string;
}

export interface ContextOptions {
  includeMetadata?: boolean;
  includeStructure?: boolean;
  maxContentLength?: number;
  format?: 'detailed' | 'summary' | 'minimal';
}

export class PageContextService {
  static async getCurrentPageContext(): Promise<PageContext | null> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return null;

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' });
      return response?.success ? response.data : null;
    } catch (error) {
      console.error('Failed to get page context:', error);
      return null;
    }
  }

  static formatPageContext(context: PageContext, options: ContextOptions = {}): string {
    const {
      includeMetadata = true,
      includeStructure = true,
      maxContentLength = 3000,
      format = 'detailed'
    } = options;

    let formatted = '';

    formatted += `**📄 Page Analysis**\n`;
    formatted += `**Title:** ${context.title}\n`;
    formatted += `**URL:** ${context.url}\n`;

    if (includeMetadata && context.metadata) {
      formatted += `\n**📊 Content Metrics:**\n`;
      formatted += `- **Type:** ${this.formatContentType(context.metadata.contentType)}\n`;
      formatted += `- **Word Count:** ${context.metadata.wordCount.toLocaleString()} words\n`;
      formatted += `- **Reading Time:** ~${context.metadata.readingTime} min\n`;
      formatted += `- **Language:** ${context.metadata.language.toUpperCase()}\n`;

      if (context.metadata.seo.description) {
        formatted += `\n**📝 Description:** ${context.metadata.seo.description}\n`;
      }

      if (context.metadata.seo.author) {
        formatted += `**👤 Author:** ${context.metadata.seo.author}\n`;
      }

      if (context.metadata.seo.publishDate) {
        formatted += `**📅 Published:** ${new Date(context.metadata.seo.publishDate).toLocaleDateString()}\n`;
      }
    }

    if (includeStructure && context.metadata?.structure) {
      const { structure } = context.metadata;
      formatted += `\n**🏗️ Page Structure:**\n`;
      
      if (structure.headings.length > 0) {
        formatted += `- **Headings:** ${structure.headings.slice(0, 5).join(', ')}${structure.headings.length > 5 ? ` (+${structure.headings.length - 5} more)` : ''}\n`;
      }
      
      formatted += `- **Links:** ${structure.links}, **Images:** ${structure.images}`;
      if (structure.videos > 0) formatted += `, **Videos:** ${structure.videos}`;
      if (structure.forms > 0) formatted += `, **Forms:** ${structure.forms}`;
      formatted += `\n`;
    }

    formatted += `\n**📖 Content:**\n`;
    
    if (format === 'summary' && context.excerpt) {
      formatted += context.excerpt;
    } else if (format === 'minimal') {
      formatted += context.cleanedText.slice(0, 500) + (context.cleanedText.length > 500 ? '...' : '');
    } else {
      const contentToShow = context.cleanedText.slice(0, maxContentLength);
      formatted += contentToShow;
      if (context.cleanedText.length > maxContentLength) {
        formatted += `\n\n*[Content truncated - ${context.metadata.wordCount - contentToShow.split(' ').length} more words available]*`;
      }
    }

    return formatted;
  }

  static formatContentType(type: string): string {
    const typeMap: Record<string, string> = {
      'blog-post': '📝 Blog Post',
      'news-article': '📰 News Article',
      'product-page': '🛍️ Product Page',
      'documentation': '📚 Documentation',
      'article': '📄 Article',
      'form-page': '📋 Form Page',
      'gallery': '🖼️ Image Gallery',
      'webpage': '🌐 Web Page'
    };
    
    return typeMap[type] || `🌐 ${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}`;
  }

  static async getContextSummary(context: PageContext): Promise<string> {
    return this.formatPageContext(context, {
      format: 'summary',
      includeMetadata: true,
      includeStructure: false,
      maxContentLength: 500
    });
  }

  static async analyzePageForAI(context: PageContext): Promise<string> {
    let analysis = `WEBPAGE ANALYSIS:\n`;
    analysis += `Title: ${context.title}\n`;
    analysis += `Type: ${context.metadata.contentType}\n`;
    analysis += `Length: ${context.metadata.wordCount} words (${context.metadata.readingTime} min read)\n`;
    
    if (context.metadata.structure.headings.length > 0) {
      analysis += `\nKey Sections: ${context.metadata.structure.headings.slice(0, 8).join(' | ')}\n`;
    }
    
    analysis += `\nCONTENT:\n${context.cleanedText}`;
    
    return analysis;
  }
}