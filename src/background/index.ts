chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === 'openSidePanel') {
        // Add null check for sender.tab
        if (sender.tab?.windowId) {
            chrome.sidePanel.open({ windowId: sender.tab.windowId });
            chrome.runtime.sendMessage({
                action: 'setPanel',
                panel: message.feature
            });
        }
    }
});

// Add context menu item
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'summarize',
        title: 'Summarize with Delight',
        contexts: ['page']
    });
});

chrome.contextMenus.onClicked.addListener((_info, tab) => {
    // Add null check for tab
    if (tab?.windowId) {
        chrome.sidePanel.open({ windowId: tab.windowId });
        chrome.runtime.sendMessage({
            action: 'setPanel',
            panel: 'summary'
        });
    }
}); 