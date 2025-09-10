export class ExtensionTransport {
  private tabId: number;
  private sessionId: string | null = null;

  constructor(tabId: number) {
    this.tabId = tabId;
  }

  static async connectTab(tabId: number): Promise<ExtensionTransport> {
    const transport = new ExtensionTransport(tabId);
    await transport.initialize();
    return transport;
  }

  private async initialize(): Promise<void> {
    // Enable CDP for the tab
    await chrome.debugger.attach({ tabId: this.tabId }, '1.3');
    
    // Get session info
    const result = await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      'Target.getTargetInfo'
    ) as any;
    this.sessionId = result.targetId || 'session';
  }

  async send(message: string): Promise<void> {
    if (!this.sessionId) throw new Error('Transport not initialized');
    
    const command = JSON.parse(message);
    await chrome.debugger.sendCommand(
      { tabId: this.tabId },
      command.method,
      command.params
    );
  }

  onMessage(callback: (message: string) => void): void {
    chrome.debugger.onEvent.addListener((source, method, params) => {
      if (source.tabId === this.tabId) {
        callback(JSON.stringify({ method, params }));
      }
    });
  }

  async close(): Promise<void> {
    if (this.tabId) {
      await chrome.debugger.detach({ tabId: this.tabId });
    }
  }
}