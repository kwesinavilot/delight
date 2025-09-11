// Simplified state manager for compatibility
export class BrowserStateManager {
  private static instance: BrowserStateManager;

  static getInstance(): BrowserStateManager {
    if (!BrowserStateManager.instance) {
      BrowserStateManager.instance = new BrowserStateManager();
    }
    return BrowserStateManager.instance;
  }

  saveState(): void {}
  detectChanges(): any { return { hasChanges: false }; }
  findElementByText(): any[] { return []; }
  getElementByIndex(): any { return null; }
  getInteractiveElements(): any[] { return []; }
  getElementsInViewport(): any[] { return []; }
  getCurrentState(): any { return null; }
  getStateMetrics(): any { return {}; }
  clearHistory(): void {}
}