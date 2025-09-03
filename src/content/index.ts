import { Readability } from '@mozilla/readability';

interface ExtractedContent {
  title: string;
  url: string;
  content: string;
  excerpt: string;
  metadata: {
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
  };
  rawText: string;
  cleanedText: string;
}

class IntelligentContentExtractor {
  private static readonly CONTENT_SELECTORS = [
    'article', 'main', '[role="main"]', '.content', '.post-content',
    '.entry-content', '.article-content', '.story-body', '.post-body',
    '.content-body', '.article-body', '.text-content', '.page-content'
  ];

  private static readonly NOISE_SELECTORS = [
    'nav', 'header', 'footer', 'aside', '.sidebar', '.navigation',
    '.menu', '.ads', '.advertisement', '.social-share', '.comments',
    '.related-posts', '.popup', '.modal', '.cookie-notice', '.newsletter',
    'script', 'style', 'noscript', '.hidden', '[style*="display: none"]'
  ];

  static extractContent(): ExtractedContent {
    const url = window.location.href;
    const title = this.extractTitle();
    
    // Multi-strategy content extraction
    const strategies = [
      () => this.extractWithReadability(),
      () => this.extractWithSemanticAnalysis(),
      () => this.extractWithHeuristics(),
      () => this.extractFallback()
    ];

    let bestContent = null;
    let bestScore = 0;

    for (const strategy of strategies) {
      try {
        const result = strategy();
        const score = this.scoreContent(result.content);
        if (score > bestScore) {
          bestContent = result;
          bestScore = score;
        }
      } catch (error) {
        console.warn('Content extraction strategy failed:', error);
      }
    }

    if (!bestContent) {
      bestContent = { content: document.body.innerText, excerpt: '' };
    }

    const cleanedText = this.cleanText(bestContent.content);
    const metadata = this.extractMetadata(cleanedText);

    return {
      title,
      url,
      content: bestContent.content,
      excerpt: bestContent.excerpt || this.generateExcerpt(cleanedText),
      metadata,
      rawText: document.body.innerText,
      cleanedText
    };
  }

  private static extractTitle(): string {
    // Multiple title extraction strategies
    const strategies = [
      () => document.querySelector('h1')?.textContent?.trim(),
      () => document.querySelector('[property="og:title"]')?.getAttribute('content'),
      () => document.querySelector('[name="twitter:title"]')?.getAttribute('content'),
      () => document.querySelector('.title, .headline, .post-title')?.textContent?.trim(),
      () => document.title
    ];

    for (const strategy of strategies) {
      const title = strategy();
      if (title && title.length > 3) return title;
    }

    return document.title || 'Untitled Page';
  }

  private static extractWithReadability() {
    const documentClone = document.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    const article = reader.parse();
    
    if (!article) throw new Error('Readability failed');
    
    return {
      content: article.textContent || '',
      excerpt: article.excerpt || ''
    };
  }

  private static extractWithSemanticAnalysis() {
    // Find main content using semantic HTML and ARIA
    const candidates = [
      document.querySelector('main'),
      document.querySelector('[role="main"]'),
      document.querySelector('article'),
      document.querySelector('[role="article"]'),
      ...Array.from(document.querySelectorAll(this.CONTENT_SELECTORS.join(',')))
    ].filter(Boolean);

    if (candidates.length === 0) throw new Error('No semantic content found');

    const bestCandidate = candidates.reduce((best, current) => {
      const currentScore = this.scoreElement(current as Element);
      const bestScore = this.scoreElement(best as Element);
      return currentScore > bestScore ? current : best;
    });

    const content = this.extractTextFromElement(bestCandidate as Element);
    return {
      content,
      excerpt: content.substring(0, 200) + '...'
    };
  }

  private static extractWithHeuristics() {
    // Score all paragraphs and find content clusters
    const paragraphs = Array.from(document.querySelectorAll('p'));
    const scoredParagraphs = paragraphs.map(p => ({
      element: p,
      score: this.scoreParagraph(p),
      text: p.textContent || ''
    })).filter(p => p.score > 0 && p.text.length > 50);

    if (scoredParagraphs.length === 0) throw new Error('No quality paragraphs found');

    // Sort by score and take top content
    scoredParagraphs.sort((a, b) => b.score - a.score);
    const topParagraphs = scoredParagraphs.slice(0, Math.max(5, scoredParagraphs.length * 0.3));
    
    const content = topParagraphs.map(p => p.text).join('\n\n');
    return {
      content,
      excerpt: topParagraphs[0]?.text.substring(0, 200) + '...' || ''
    };
  }

  private static extractFallback() {
    // Remove noise elements and extract remaining text
    const clone = document.body.cloneNode(true) as Element;
    
    // Remove noise
    this.NOISE_SELECTORS.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    const content = this.extractTextFromElement(clone);
    return {
      content,
      excerpt: content.substring(0, 200) + '...'
    };
  }

  private static scoreElement(element: Element): number {
    if (!element) return 0;
    
    let score = 0;
    const text = element.textContent || '';
    
    // Length scoring
    score += Math.min(text.length / 100, 50);
    
    // Semantic scoring
    const tagName = element.tagName.toLowerCase();
    if (['article', 'main'].includes(tagName)) score += 30;
    if (['section', 'div'].includes(tagName)) score += 10;
    
    // Class/ID scoring
    const className = element.className.toLowerCase();
    const id = element.id.toLowerCase();
    if (/content|article|post|story|text/.test(className + id)) score += 20;
    if (/sidebar|nav|menu|ad|comment/.test(className + id)) score -= 20;
    
    // Paragraph density
    const paragraphs = element.querySelectorAll('p').length;
    score += paragraphs * 5;
    
    return Math.max(0, score);
  }

  private static scoreParagraph(p: Element): number {
    const text = p.textContent || '';
    let score = 0;
    
    // Length scoring
    if (text.length < 30) return 0;
    score += Math.min(text.length / 50, 20);
    
    // Sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    score += sentences.length * 2;
    
    // Word diversity
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);
    score += (uniqueWords.size / words.length) * 10;
    
    // Avoid navigation/UI text
    if (/^(home|about|contact|menu|login|register|search)$/i.test(text.trim())) score = 0;
    
    return score;
  }

  private static scoreContent(content: string): number {
    if (!content) return 0;
    
    let score = 0;
    
    // Length scoring
    score += Math.min(content.length / 1000, 50);
    
    // Sentence structure
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    score += Math.min(sentences.length, 30);
    
    // Paragraph structure
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    score += Math.min(paragraphs.length * 2, 20);
    
    return score;
  }

  private static extractTextFromElement(element: Element): string {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          // Skip hidden elements
          const style = window.getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip script/style content
          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes: string[] = [];
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent?.trim();
      if (text && text.length > 2) {
        textNodes.push(text);
      }
    }

    return textNodes.join(' ').replace(/\s+/g, ' ').trim();
  }

  private static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/[\u200B-\u200D\uFEFF]/g, '')  // Remove zero-width characters
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')  // Remove control characters
      .trim();
  }

  private static generateExcerpt(text: string, maxLength: number = 300): string {
    if (text.length <= maxLength) return text;
    
    const sentences = text.split(/[.!?]+/);
    let excerpt = '';
    
    for (const sentence of sentences) {
      if (excerpt.length + sentence.length > maxLength) break;
      excerpt += sentence + '. ';
    }
    
    return excerpt.trim() || text.substring(0, maxLength) + '...';
  }

  private static extractMetadata(content: string) {
    const words = content.match(/\b\w+\b/g) || [];
    const wordCount = words.length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    
    // Language detection (basic)
    const language = document.documentElement.lang || 
                    document.querySelector('[property="og:locale"]')?.getAttribute('content') || 
                    'en';
    
    // Content type detection
    const contentType = this.detectContentType();
    
    // Structure analysis
    const structure = {
      headings: Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
                     .map(h => h.textContent?.trim() || '')
                     .filter(h => h.length > 0),
      links: document.querySelectorAll('a[href]').length,
      images: document.querySelectorAll('img').length,
      videos: document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length,
      forms: document.querySelectorAll('form').length
    };
    
    // SEO metadata
    const seo = {
      description: document.querySelector('[name="description"]')?.getAttribute('content') || 
                  document.querySelector('[property="og:description"]')?.getAttribute('content') || '',
      keywords: (document.querySelector('[name="keywords"]')?.getAttribute('content') || '')
                .split(',').map(k => k.trim()).filter(k => k.length > 0),
      author: document.querySelector('[name="author"]')?.getAttribute('content') || 
             document.querySelector('[property="article:author"]')?.getAttribute('content') || '',
      publishDate: document.querySelector('[property="article:published_time"]')?.getAttribute('content') || 
                  document.querySelector('[name="date"]')?.getAttribute('content') || ''
    };
    
    return {
      wordCount,
      readingTime,
      language,
      contentType,
      structure,
      seo
    };
  }

  private static detectContentType(): string {
    const url = window.location.href.toLowerCase();
    const content = document.body.textContent?.toLowerCase() || '';
    
    // URL-based detection
    if (url.includes('/blog/') || url.includes('/post/')) return 'blog-post';
    if (url.includes('/news/') || url.includes('/article/')) return 'news-article';
    if (url.includes('/product/') || url.includes('/shop/')) return 'product-page';
    if (url.includes('/docs/') || url.includes('/documentation/')) return 'documentation';
    
    // Content-based detection
    if (document.querySelector('article')) return 'article';
    if (document.querySelectorAll('form').length > 2) return 'form-page';
    if (document.querySelectorAll('img').length > 10) return 'gallery';
    if (content.includes('price') && content.includes('buy')) return 'product-page';
    
    return 'webpage';
  }
}

// Enhanced message listener with comprehensive extraction
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'getPageContent') {
    try {
      const pageData = IntelligentContentExtractor.extractContent();
      sendResponse({ success: true, data: pageData });
    } catch (error) {
      console.error('Content extraction failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({ success: false, error: errorMessage });
    }
  }
  return true;
});

console.log('Delight intelligent content extractor loaded');