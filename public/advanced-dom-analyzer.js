// Advanced DOM Analysis Script - Based on Nanobrowser's buildDomTree.js
// Provides element indexing, viewport filtering, shadow DOM support, and performance caching

const DOM_CACHE = {
  boundingRects: new WeakMap(),
  computedStyles: new WeakMap(),
  elementMap: new Map(),
  clearCache: () => {
    DOM_CACHE.boundingRects = new WeakMap();
    DOM_CACHE.computedStyles = new WeakMap();
    DOM_CACHE.elementMap.clear();
  }
};

window.delightDOMAnalyzer = {
  highlightContainer: null,
  elementIndex: 0,
  selectorMap: new Map(),
  
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
    this.selectorMap.clear();
    this.elementIndex = 0;
  },

  getCachedRect(element) {
    let rect = DOM_CACHE.boundingRects.get(element);
    if (!rect) {
      rect = element.getBoundingClientRect();
      DOM_CACHE.boundingRects.set(element, rect);
    }
    return rect;
  },

  getCachedStyle(element) {
    let style = DOM_CACHE.computedStyles.get(element);
    if (!style) {
      style = getComputedStyle(element);
      DOM_CACHE.computedStyles.set(element, style);
    }
    return style;
  },

  isInViewport(rect) {
    return (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    );
  },

  isElementVisible(element) {
    const style = this.getCachedStyle(element);
    const rect = this.getCachedRect(element);

    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0 &&
      this.isInViewport(rect)
    );
  },

  isInteractiveElement(element) {
    const tagName = element.tagName.toLowerCase();
    const style = this.getCachedStyle(element);

    // Interactive cursors
    const interactiveCursors = new Set([
      'pointer', 'move', 'text', 'grab', 'grabbing'
    ]);

    if (style?.cursor && interactiveCursors.has(style.cursor)) {
      return true;
    }

    // Interactive tags
    const interactiveElements = new Set([
      'a', 'button', 'input', 'select', 'textarea', 'details', 'summary',
      'label', 'option', 'fieldset', 'legend'
    ]);

    if (interactiveElements.has(tagName)) {
      return true;
    }

    // Interactive roles
    const interactiveRoles = new Set([
      'button', 'link', 'menuitem', 'tab', 'checkbox', 'radio',
      'slider', 'spinbutton', 'textbox', 'combobox', 'listbox'
    ]);

    const role = element.getAttribute('role');
    if (role && interactiveRoles.has(role)) {
      return true;
    }

    // Check for interactive attributes
    return (
      element.hasAttribute('onclick') ||
      element.hasAttribute('onmousedown') ||
      element.hasAttribute('onkeydown') ||
      element.hasAttribute('tabindex') ||
      element.contentEditable === 'true'
    );
  },

  generateSelector(element) {
    // Priority: ID > unique class > data attributes > position-based
    if (element.id && document.querySelectorAll(`#${element.id}`).length === 1) {
      return `#${element.id}`;
    }

    // Try class combinations
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        const classSelector = '.' + classes.join('.');
        if (document.querySelectorAll(classSelector).length === 1) {
          return classSelector;
        }
      }
    }

    // Try data attributes
    for (const attr of element.attributes) {
      if (attr.name.startsWith('data-') && attr.value) {
        const selector = `[${attr.name}="${attr.value}"]`;
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      }
    }

    // Fallback to nth-child
    const tagName = element.tagName.toLowerCase();
    let index = 1;
    let sibling = element.previousElementSibling;
    
    while (sibling) {
      if (sibling.tagName.toLowerCase() === tagName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }

    const parent = element.parentElement;
    if (parent) {
      const parentSelector = parent === document.body ? 'body' : this.generateSelector(parent);
      return `${parentSelector} > ${tagName}:nth-child(${index})`;
    }

    return tagName;
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

  highlightElement(element, index) {
    const container = this.createHighlightContainer();
    const rect = this.getCachedRect(element);
    const colors = ['#FF4444', '#44FF44', '#4444FF', '#FF8844', '#FF44FF', '#44FFFF'];
    const baseColor = colors[index % colors.length];

    // Create overlay
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

    // Create numbered label
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
      top: ${Math.max(0, rect.top - 20)}px;
      left: ${rect.left}px;
      z-index: 2147483648;
      pointer-events: none;
    `;
    container.appendChild(label);
  },

  extractElementAttributes(element) {
    const attributes = {};
    for (const attr of element.attributes) {
      attributes[attr.name] = attr.value;
    }
    return attributes;
  },

  buildDomTree(highlight = true, viewportOnly = true) {
    const elements = [];
    this.elementIndex = 0;
    this.selectorMap.clear();
    DOM_CACHE.clearCache();

    if (highlight) {
      this.clearHighlights();
      this.createHighlightContainer();
    }

    const traverseElement = (element, depth = 0) => {
      if (!element || element.nodeType !== Node.ELEMENT_NODE || depth > 10) return null;
      
      const tagName = element.tagName.toLowerCase();
      const excludedTags = new Set([
        'script', 'style', 'meta', 'link', 'title', 'head', 'noscript'
      ]);
      
      if (excludedTags.has(tagName)) return null;

      const isVisible = this.isElementVisible(element);
      const isInteractive = this.isInteractiveElement(element);
      const rect = this.getCachedRect(element);

      // Skip if viewport filtering is enabled and element is not in viewport
      if (viewportOnly && !this.isInViewport(rect)) return null;

      const elementData = {
        index: this.elementIndex,
        tagName,
        selector: this.generateSelector(element),
        xpath: this.getXPath(element),
        text: element.textContent?.trim().substring(0, 200) || '',
        isVisible,
        isInteractive,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right
        },
        attributes: this.extractElementAttributes(element),
        children: []
      };

      // Only increment index and highlight for interactive elements
      if (isVisible && isInteractive) {
        this.selectorMap.set(this.elementIndex, elementData);
        
        if (highlight) {
          this.highlightElement(element, this.elementIndex);
        }
        
        this.elementIndex++;
        elements.push(elementData);
      }

      // Process children
      for (const child of element.children) {
        const childData = traverseElement(child, depth + 1);
        if (childData) {
          elementData.children.push(childData);
        }
      }

      return elementData;
    };

    // Start traversal from body
    const rootElement = traverseElement(document.body);

    return {
      elements,
      elementTree: rootElement,
      selectorMap: Object.fromEntries(this.selectorMap),
      interactiveCount: elements.length,
      url: window.location.href,
      title: document.title,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      },
      timestamp: Date.now()
    };
  },

  // Shadow DOM support
  traverseShadowDOM(element) {
    const shadowElements = [];
    
    if (element.shadowRoot) {
      const shadowTraverse = (shadowElement) => {
        if (this.isElementVisible(shadowElement) && this.isInteractiveElement(shadowElement)) {
          shadowElements.push({
            index: this.elementIndex++,
            tagName: shadowElement.tagName.toLowerCase(),
            selector: this.generateSelector(shadowElement),
            text: shadowElement.textContent?.trim().substring(0, 100) || '',
            isShadowDOM: true
          });
        }
        
        for (const child of shadowElement.children) {
          shadowTraverse(child);
        }
      };
      
      for (const child of element.shadowRoot.children) {
        shadowTraverse(child);
      }
    }
    
    return shadowElements;
  },

  // Performance monitoring
  getPerformanceMetrics() {
    return {
      cacheSize: {
        boundingRects: DOM_CACHE.boundingRects.size || 0,
        computedStyles: DOM_CACHE.computedStyles.size || 0,
        elementMap: DOM_CACHE.elementMap.size
      },
      elementCount: this.elementIndex,
      timestamp: Date.now()
    };
  }
};

// Global functions for chrome.scripting.executeScript
window.executeDOMAnalysis = function(highlight = true, viewportOnly = true) {
  return window.delightDOMAnalyzer.buildDomTree(highlight, viewportOnly);
};

window.clearDOMHighlights = function() {
  return window.delightDOMAnalyzer.clearHighlights();
};

window.getElementByIndex = function(index) {
  return window.delightDOMAnalyzer.selectorMap.get(index);
};

window.getPerformanceMetrics = function() {
  return window.delightDOMAnalyzer.getPerformanceMetrics();
};