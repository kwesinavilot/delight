export class TabMatcher {
  private static serviceMap = new Map([
    ['email', ['gmail.com', 'outlook.com', 'yahoo.com', 'mail.google.com']],
    ['whatsapp', ['web.whatsapp.com', 'whatsapp.com']],
    ['twitter', ['twitter.com', 'x.com']],
    ['facebook', ['facebook.com', 'fb.com']],
    ['youtube', ['youtube.com', 'youtu.be']],
    ['github', ['github.com']],
    ['linkedin', ['linkedin.com']],
    ['instagram', ['instagram.com']],
    ['reddit', ['reddit.com']],
    ['news', ['bbc.com', 'cnn.com', 'reuters.com', 'news.google.com']]
  ]);

  static async findRelevantTabs(userInput: string): Promise<chrome.tabs.Tab[]> {
    const tabs = await chrome.tabs.query({});
    const relevantTabs: chrome.tabs.Tab[] = [];
    const input = userInput.toLowerCase();
    
    // Method 1: Check for specific service keywords
    for (const [service, domains] of this.serviceMap) {
      if (input.includes(service)) {
        const matchingTabs = tabs.filter(tab => {
          if (!tab.url) return false;
          try {
            const hostname = new URL(tab.url).hostname;
            return domains.some(domain => hostname.includes(domain));
          } catch {
            return false;
          }
        });
        relevantTabs.push(...matchingTabs);
      }
    }
    
    // Method 2: Check tab titles for keywords from user input
    const keywords = input.split(' ').filter(word => word.length > 3);
    for (const tab of tabs) {
      if (tab.title && tab.url && !relevantTabs.includes(tab)) {
        const title = tab.title.toLowerCase();
        const url = tab.url.toLowerCase();
        
        // Check if any keyword matches title or URL
        const hasMatch = keywords.some(keyword => 
          title.includes(keyword) || url.includes(keyword)
        );
        
        if (hasMatch) {
          relevantTabs.push(tab);
        }
      }
    }
    
    return relevantTabs;
  }

  static async suggestExistingTab(userInput: string): Promise<{
    suggested: chrome.tabs.Tab | null;
    message: string;
  }> {
    const relevantTabs = await this.findRelevantTabs(userInput);
    
    if (relevantTabs.length === 0) {
      return { suggested: null, message: '' };
    }
    
    const tab = relevantTabs[0]; // Use first match
    const service = this.getServiceName(tab.url || '');
    
    return {
      suggested: tab,
      message: `I found ${service} already open in another tab. Should I use that instead?`
    };
  }

  private static getServiceName(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      for (const [service, domains] of this.serviceMap) {
        if (domains.some(domain => hostname.includes(domain))) {
          return service.charAt(0).toUpperCase() + service.slice(1);
        }
      }
      return hostname;
    } catch {
      return 'the existing tab';
    }
  }
}