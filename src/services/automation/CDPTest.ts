// Simple CDP connection test
export class CDPTest {
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 [CDPTest] Testing CDP connection...');
      
      // Get current tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        console.error('❌ [CDPTest] No active tab found');
        return false;
      }
      
      const tabId = tabs[0].id!;
      const tabUrl = tabs[0].url || '';
      console.log('📋 [CDPTest] Found tab:', tabId, 'URL:', tabUrl);
      
      // Check if URL is restricted
      if (tabUrl.startsWith('chrome://') || tabUrl.startsWith('edge://') || tabUrl.startsWith('chrome-extension://')) {
        throw new Error(`Cannot debug restricted URL: ${tabUrl}. Please navigate to a regular website first.`);
      }
      
      // Try to attach debugger
      await chrome.debugger.attach({ tabId }, '1.3');
      console.log('✅ [CDPTest] Debugger attached');
      
      // Enable Runtime domain
      await chrome.debugger.sendCommand({ tabId }, 'Runtime.enable');
      console.log('✅ [CDPTest] Runtime domain enabled');
      
      // Test simple evaluation
      const result = await chrome.debugger.sendCommand(
        { tabId },
        'Runtime.evaluate',
        { expression: 'window.location.href' }
      ) as any;
      
      console.log('✅ [CDPTest] Test evaluation result:', result.result?.value);
      
      // Cleanup
      await chrome.debugger.detach({ tabId });
      console.log('✅ [CDPTest] Debugger detached');
      
      return true;
    } catch (error) {
      console.error('❌ [CDPTest] Connection test failed:', error);
      return false;
    }
  }
}