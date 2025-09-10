export class PerformanceOptimizer {
  private static domCache = new WeakMap<Element, {
    computedStyle?: CSSStyleDeclaration;
    boundingRect?: DOMRect;
    isVisible?: boolean;
    timestamp: number;
  }>();
  
  private static changeDetector = new Set<string>();
  private static lastDOMHash: string = '';

  static getCachedComputedStyle(element: Element): CSSStyleDeclaration {
    const cached = this.domCache.get(element);
    const now = Date.now();
    
    if (cached?.computedStyle && (now - cached.timestamp) < 5000) {
      return cached.computedStyle;
    }
    
    const style = getComputedStyle(element);
    this.domCache.set(element, {
      ...cached,
      computedStyle: style,
      timestamp: now
    });
    
    return style;
  }

  static getCachedBoundingRect(element: Element): DOMRect {
    const cached = this.domCache.get(element);
    const now = Date.now();
    
    if (cached?.boundingRect && (now - cached.timestamp) < 1000) {
      return cached.boundingRect;
    }
    
    const rect = element.getBoundingClientRect();
    this.domCache.set(element, {
      ...cached,
      boundingRect: rect,
      timestamp: now
    });
    
    return rect;
  }

  static isElementInViewport(element: Element, expansion: number = 0): boolean {
    const cached = this.domCache.get(element);
    const now = Date.now();
    
    if (cached?.isVisible !== undefined && (now - cached.timestamp) < 2000) {
      return cached.isVisible;
    }
    
    const rect = this.getCachedBoundingRect(element);
    const isVisible = !(
      rect.bottom < -expansion ||
      rect.top > window.innerHeight + expansion ||
      rect.right < -expansion ||
      rect.left > window.innerWidth + expansion
    );
    
    this.domCache.set(element, {
      ...cached,
      isVisible,
      timestamp: now
    });
    
    return isVisible;
  }

  static detectDOMChanges(): boolean {
    const currentHash = this.generateDOMHash();
    const hasChanged = currentHash !== this.lastDOMHash;
    
    if (hasChanged) {
      this.lastDOMHash = currentHash;
      this.clearCache();
      console.log('🔄 [PerformanceOptimizer] DOM changes detected, cache cleared');
    }
    
    return hasChanged;
  }

  private static generateDOMHash(): string {
    const elements = document.querySelectorAll('*');
    let hash = elements.length.toString();
    
    // Sample key elements for change detection
    const keyElements = Array.from(elements).slice(0, 100);
    for (const el of keyElements) {
      hash += el.tagName + (el.id || '') + (el.className || '');
    }
    
    return hash;
  }

  static clearCache(): void {
    this.domCache = new WeakMap();
    this.changeDetector.clear();
  }

  static filterVisibleElements<T extends Element>(elements: T[]): T[] {
    return elements.filter(el => this.isElementInViewport(el));
  }

  static optimizeElementTraversal(
    root: Element,
    callback: (element: Element) => void,
    viewportOnly: boolean = true
  ): void {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node: Element) => {
          if (viewportOnly && !this.isElementInViewport(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let currentNode = walker.nextNode() as Element;
    while (currentNode) {
      callback(currentNode);
      currentNode = walker.nextNode() as Element;
    }
  }
}