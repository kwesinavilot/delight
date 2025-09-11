// Advanced DOM analysis system based on Nanobrowser's approach
window.buildDomTree = (args = {}) => {
  const {
    shouldHighlight = true,
    viewportExpansion = 100,
    includeDynamicAttributes = true,
    maxElements = 500
  } = args;

  // Performance caching
  const DOM_CACHE = {
    boundingRects: new WeakMap(),
    computedStyles: new WeakMap(),
    clearCache: () => {
      DOM_CACHE.boundingRects = new WeakMap();
      DOM_CACHE.computedStyles = new WeakMap();
    }
  };

  let highlightIndex = 0;
  const selectorMap = new Map();
  const elementHashes = new Set();

  // Cached style computation
  function getCachedStyle(element) {
    if (!DOM_CACHE.computedStyles.has(element)) {
      DOM_CACHE.computedStyles.set(element, getComputedStyle(element));
    }
    return DOM_CACHE.computedStyles.get(element);
  }

  // Cached bounding rect
  function getCachedRect(element) {
    if (!DOM_CACHE.boundingRects.has(element)) {
      DOM_CACHE.boundingRects.set(element, element.getBoundingClientRect());
    }
    return DOM_CACHE.boundingRects.get(element);
  }

  // Enhanced visibility detection
  function isElementVisible(element) {
    try {
      const rect = getCachedRect(element);
      const style = getCachedStyle(element);
      
      // Basic size check
      if (rect.width <= 0 || rect.height <= 0) return false;
      
      // Style visibility checks
      if (style.display === 'none' || 
          style.visibility === 'hidden' || 
          style.opacity === '0' ||
          style.clip === 'rect(0px, 0px, 0px, 0px)') {
        return false;
      }
      
      // Viewport check with expansion
      const isInExpandedViewport = !(
        rect.bottom < -viewportExpansion ||
        rect.top > window.innerHeight + viewportExpansion ||
        rect.right < -viewportExpansion ||
        rect.left > window.innerWidth + viewportExpansion
      );
      
      if (!isInExpandedViewport) return false;
      
      // Check if element is covered by other elements
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const elementAtPoint = document.elementFromPoint(centerX, centerY);
      
      if (elementAtPoint && !element.contains(elementAtPoint) && !elementAtPoint.contains(element)) {
        // Element might be covered, but still consider it visible if it's interactive
        return isInteractiveElement(element);
      }
      
      return true;
    } catch (error) {
      console.warn('Visibility check failed:', error);
      return false;
    }
  }

  // Enhanced interactivity detection
  function isInteractiveElement(element) {
    const tagName = element.tagName.toLowerCase();
    const style = getCachedStyle(element);
    
    // Interactive tags
    const interactiveTags = new Set([
      'a', 'button', 'input', 'select', 'textarea', 'label',
      'details', 'summary', 'option'
    ]);
    
    if (interactiveTags.has(tagName)) return true;
    
    // Interactive attributes
    if (element.hasAttribute('onclick') ||
        element.hasAttribute('onmousedown') ||
        element.hasAttribute('onmouseup') ||
        element.hasAttribute('ontouchstart') ||
        element.getAttribute('role') === 'button' ||
        element.getAttribute('role') === 'link' ||
        element.getAttribute('role') === 'menuitem' ||
        element.getAttribute('tabindex') === '0' ||
        element.hasAttribute('draggable')) {
      return true;
    }
    
    // Interactive cursors
    const interactiveCursors = new Set([
      'pointer', 'move', 'text', 'grab', 'grabbing', 'crosshair'
    ]);
    
    if (style?.cursor && interactiveCursors.has(style.cursor)) {
      return true;
    }
    
    // Content editable
    if (element.isContentEditable) return true;
    
    // Has click listeners (heuristic)
    if (element._listeners || element.onclick) return true;
    
    return false;
  }

  // Generate enhanced CSS selector
  function generateEnhancedSelector(element) {
    const selectors = [];
    
    // ID selector (highest priority)
    if (element.id && /^[a-zA-Z][\w-]*$/.test(element.id)) {
      selectors.push(`#${element.id}`);
    }
    
    // Class selector
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/)
        .filter(cls => cls && /^[a-zA-Z][\w-]*$/.test(cls))
        .slice(0, 3); // Limit to 3 classes
      
      if (classes.length > 0) {
        selectors.push(`.${classes.join('.')}`);
      }
    }
    
    // Attribute selectors
    const importantAttrs = ['name', 'type', 'role', 'data-testid', 'aria-label'];
    for (const attr of importantAttrs) {
      const value = element.getAttribute(attr);
      if (value) {
        selectors.push(`[${attr}="${value}"]`);
      }
    }
    
    // Tag selector with position
    const tagName = element.tagName.toLowerCase();
    const siblings = Array.from(element.parentNode?.children || [])
      .filter(el => el.tagName.toLowerCase() === tagName);
    
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1;
      selectors.push(`${tagName}:nth-of-type(${index})`);
    } else {
      selectors.push(tagName);
    }
    
    return selectors[0] || tagName; // Return best selector
  }

  // Generate XPath
  function generateXPath(element) {
    if (element === document.body) return '/html/body';
    
    const parts = [];
    let current = element;
    
    while (current && current !== document.body && current.parentNode) {
      const tagName = current.tagName.toLowerCase();
      const siblings = Array.from(current.parentNode.children)
        .filter(el => el.tagName.toLowerCase() === tagName);
      
      if (siblings.length === 1) {
        parts.unshift(tagName);
      } else {
        const index = siblings.indexOf(current) + 1;
        parts.unshift(`${tagName}[${index}]`);
      }
      
      current = current.parentNode;
    }
    
    return '/html/body/' + parts.join('/');
  }

  // Create element hash for change detection
  function createElementHash(element) {
    const rect = getCachedRect(element);
    const attrs = Array.from(element.attributes)
      .map(attr => `${attr.name}=${attr.value}`)
      .sort()
      .join('|');
    
    return `${element.tagName}:${rect.x}:${rect.y}:${rect.width}:${rect.height}:${attrs}`;
  }

  // Visual highlighting
  function highlightElement(element, index) {
    if (!shouldHighlight) return;
    
    const container = document.getElementById('delight-highlight-container') || 
      createHighlightContainer();
    
    const rects = element.getClientRects();
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFA500', '#FF00FF'];
    const baseColor = colors[index % colors.length];
    
    // Create overlay for each client rect
    for (const rect of rects) {
      const overlay = document.createElement('div');
      overlay.className = 'delight-highlight-overlay';
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
    const mainRect = rects[0];
    const label = document.createElement('div');
    label.className = 'delight-highlight-label';
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
      top: ${Math.max(0, mainRect.top - 22)}px;
      left: ${mainRect.left}px;
      z-index: 2147483648;
      pointer-events: none;
      min-width: 16px;
      text-align: center;
    `;
    container.appendChild(label);
  }

  function createHighlightContainer() {
    const container = document.createElement('div');
    container.id = 'delight-highlight-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483647;
    `;
    document.body.appendChild(container);
    return container;
  }

  // Main DOM traversal
  function buildDomTree(node = document.body, parentIframe = null) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return null;
    if (highlightIndex >= maxElements) return null;
    
    const element = node;
    
    // Skip non-visible or non-interactive elements early
    if (!isElementVisible(element)) return null;
    
    const isInteractive = isInteractiveElement(element);
    let elementData = null;
    
    if (isInteractive) {
      // Create element hash for deduplication
      const hash = createElementHash(element);
      if (elementHashes.has(hash)) return null;
      elementHashes.add(hash);
      
      // Create element data
      elementData = {
        tagName: element.tagName.toLowerCase(),
        highlightIndex: highlightIndex,
        xpath: generateXPath(element),
        cssSelector: generateEnhancedSelector(element),
        attributes: {},
        text: (element.textContent || element.value || '').trim().substring(0, 200),
        rect: getCachedRect(element),
        isVisible: true,
        isInteractive: true,
        parentIframe: parentIframe
      };
      
      // Collect important attributes
      const importantAttrs = [
        'id', 'class', 'name', 'type', 'role', 'aria-label', 'title', 
        'placeholder', 'value', 'href', 'src', 'data-testid'
      ];
      
      for (const attr of importantAttrs) {
        const value = element.getAttribute(attr);
        if (value) {
          elementData.attributes[attr] = value;
        }
      }
      
      // Add to selector map
      selectorMap.set(highlightIndex, elementData);
      
      // Set data attribute for targeting
      element.setAttribute('data-delight-index', highlightIndex.toString());
      
      // Highlight element
      highlightElement(element, highlightIndex);
      
      highlightIndex++;
    }
    
    // Process child elements (including iframes)
    const children = [];
    for (const child of element.children) {
      if (child.tagName.toLowerCase() === 'iframe') {
        try {
          // Try to access iframe content
          const iframeDoc = child.contentDocument;
          if (iframeDoc && iframeDoc.body) {
            const iframeElements = buildDomTree(iframeDoc.body, child);
            if (iframeElements) children.push(iframeElements);
          }
        } catch (e) {
          // Cross-origin iframe, skip
          console.debug('Skipping cross-origin iframe:', e);
        }
      } else {
        const childData = buildDomTree(child, parentIframe);
        if (childData) children.push(childData);
      }
    }
    
    return elementData;
  }

  // Clear existing highlights
  const existingContainer = document.getElementById('delight-highlight-container');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  // Clear cache
  DOM_CACHE.clearCache();
  
  // Build the tree
  console.time('DOM Analysis');
  const elementTree = buildDomTree();
  console.timeEnd('DOM Analysis');
  
  // Return comprehensive state
  return {
    elementTree,
    selectorMap: Object.fromEntries(selectorMap),
    url: window.location.href,
    title: document.title,
    scrollY: window.scrollY,
    scrollHeight: document.documentElement.scrollHeight,
    visualViewportHeight: window.visualViewport?.height || window.innerHeight,
    elementCount: highlightIndex,
    timestamp: Date.now()
  };
};

// Utility functions for element interaction
window.delightUtils = {
  removeHighlights: () => {
    const container = document.getElementById('delight-highlight-container');
    if (container) container.remove();
  },
  
  getElementByIndex: (index) => {
    return document.querySelector(`[data-delight-index="${index}"]`);
  },
  
  clickElement: (index) => {
    const element = window.delightUtils.getElementByIndex(index);
    if (!element) throw new Error(`Element ${index} not found`);
    
    // Multiple click strategies
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Dispatch multiple events for reliability
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    // Fallback direct click
    if (element.click) element.click();
    
    return `Clicked element ${index}`;
  },
  
  fillElement: (index, value) => {
    const element = window.delightUtils.getElementByIndex(index);
    if (!element) throw new Error(`Element ${index} not found`);
    
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Clear existing value
    if ('value' in element) {
      element.value = '';
    }
    if (element.isContentEditable) {
      element.textContent = '';
    }
    
    // Set new value
    if ('value' in element) {
      element.value = value;
    } else if (element.isContentEditable) {
      element.textContent = value;
    }
    
    // Dispatch events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    
    return `Filled element ${index} with: ${value}`;
  },
  
  extractElement: (index) => {
    const element = window.delightUtils.getElementByIndex(index);
    if (!element) throw new Error(`Element ${index} not found`);
    
    return element.textContent || element.value || element.getAttribute('aria-label') || '';
  }
};