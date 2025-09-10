// DOM Analysis Script - Injected into web pages
// This script provides interactive element detection and highlighting capabilities

// Performance optimization cache
const DOM_CACHE = {
  boundingRects: new WeakMap(),
  computedStyles: new WeakMap(),
  clearCache: () => {
    DOM_CACHE.boundingRects = new WeakMap();
    DOM_CACHE.computedStyles = new WeakMap();
  }
};

window.delightDOMAnalyzer = {
  highlightContainer: null,
  
  createHighlightContainer() {
    if (this.highlightContainer) return this.highlightContainer;
    
    this.highlightContainer = document.createElement('div');
    this.highlightContainer.id = 'delight-highlight-container';
    this.highlightContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483647;
    `;
    document.body.appendChild(this.highlightContainer);
    return this.highlightContainer;
  },

  clearHighlights() {
    if (this.highlightContainer) {
      this.highlightContainer.remove();
      this.highlightContainer = null;
    }
  },

  isElementVisible(element) {
    // Use cached computed style
    let style = DOM_CACHE.computedStyles.get(element);
    if (!style) {
      style = getComputedStyle(element);
      DOM_CACHE.computedStyles.set(element, style);
    }
    
    // Use cached bounding rect
    let rect = DOM_CACHE.boundingRects.get(element);
    if (!rect) {
      rect = element.getBoundingClientRect();
      DOM_CACHE.boundingRects.set(element, rect);
    }

    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    );
  },

  isInteractiveElement(element) {
    const tagName = element.tagName.toLowerCase();
    const style = getComputedStyle(element);

    // Interactive cursors
    const interactiveCursors = new Set([
      'pointer', 'move', 'text', 'grab', 'grabbing'
    ]);

    // Check cursor style
    if (style?.cursor && interactiveCursors.has(style.cursor)) {
      return true;
    }

    // Interactive tags
    const interactiveElements = new Set([
      'a', 'button', 'input', 'select', 'textarea', 'details', 'summary'
    ]);

    if (interactiveElements.has(tagName)) {
      return true;
    }

    // Check for interactive attributes
    return (
      element.hasAttribute('onclick') ||
      element.hasAttribute('role') ||
      element.hasAttribute('tabindex') ||
      element.getAttribute('role') === 'button' ||
      element.getAttribute('role') === 'link'
    );
  },

  highlightElement(element, index) {
    const container = this.createHighlightContainer();
    const rects = element.getClientRects();
    const colors = ['#FF4444', '#44FF44', '#4444FF', '#FF8844'];
    const baseColor = colors[index % colors.length];

    // Create overlay for each client rect
    for (const rect of rects) {
      const overlay = document.createElement('div');
      overlay.className = 'delight-element-highlight';
      overlay.style.cssText = `
        position: fixed;
        border: 2px solid ${baseColor};
        background: ${baseColor}1A;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        pointer-events: none;
        z-index: 2147483647;
        box-sizing: border-box;
      `;
      container.appendChild(overlay);
    }

    // Create numbered label
    const firstRect = rects[0];
    if (firstRect) {
      const label = document.createElement('div');
      label.className = 'delight-element-label';
      label.textContent = index.toString();
      label.style.cssText = `
        position: fixed;
        background: ${baseColor};
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        font-family: monospace;
        top: ${Math.max(0, firstRect.top - 20)}px;
        left: ${firstRect.left}px;
        z-index: 2147483648;
        pointer-events: none;
      `;
      container.appendChild(label);
    }
  },

  getXPath(element) {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    const parts = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 1;
      let sibling = current.previousElementSibling;

      while (sibling) {
        if (sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousElementSibling;
      }

      const tagName = current.tagName.toLowerCase();
      parts.unshift(`${tagName}[${index}]`);
      current = current.parentElement;
    }

    return '/' + parts.join('/');
  },

  analyzeDOM(highlight = true) {
    const elements = [];
    let highlightIndex = 0;

    // Clear performance cache
    DOM_CACHE.clearCache();

    if (highlight) {
      this.clearHighlights();
      this.createHighlightContainer();
    }

    const traverseElement = (element) => {
      // Skip non-element nodes and excluded tags
      if (!element || element.nodeType !== Node.ELEMENT_NODE) return;
      
      const tagName = element.tagName.toLowerCase();
      const excludedTags = new Set(['script', 'style', 'meta', 'link', 'title', 'head']);
      
      if (excludedTags.has(tagName)) return;

      const isVisible = this.isElementVisible(element);
      const isInteractive = this.isInteractiveElement(element);

      if (isVisible && isInteractive) {
        const elementData = {
          tagName,
          xpath: this.getXPath(element),
          isVisible,
          isInteractive,
          rect: element.getBoundingClientRect(),
          text: element.textContent?.trim().substring(0, 100) || ''
        };

        if (highlight) {
          elementData.highlightIndex = highlightIndex++;
          this.highlightElement(element, elementData.highlightIndex);
        }

        elements.push(elementData);
      }

      // Process children
      for (const child of element.children) {
        traverseElement(child);
      }
    };

    traverseElement(document.body);

    return {
      elements,
      interactiveCount: elements.length,
      url: window.location.href,
      title: document.title,
      timestamp: Date.now()
    };
  }
};

// Make functions available globally for chrome.scripting.executeScript
window.executeDOMAnalysis = function(highlight) {
  return window.delightDOMAnalyzer.analyzeDOM(highlight);
};

window.clearDOMHighlights = function() {
  return window.delightDOMAnalyzer.clearHighlights();
};