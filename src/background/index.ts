chrome.runtime.onMessage.addListener((message, sender) => {
    console.log("Received message:", message);

    if (message.action === 'getPageContent') {
        (async () => {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab?.id) return;

                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
            } catch (error) {
                console.log('Content script already injected or injection failed:', error);
            }
        })();
        return true;
    }

    if (message.action === 'openSidePanel') {
        (async () => {
            const tabId = message.tabId || sender.tab?.id;

            if (!tabId) {
                console.error('No tab found for side panel request');
                return;
            }

            try {
                const tab = await chrome.tabs.get(tabId);
                if (tab.url && tab.url.startsWith("chrome://")) {
                    console.error("Cannot open side panel on a chrome:// URL:", tab.url);
                    return;
                }

                await chrome.sidePanel.open({ tabId: tabId });
                await chrome.sidePanel.setOptions({
                    tabId: tabId,
                    path: 'src/pages/sidepanel/index.html',
                    enabled: true
                });

                console.log('Side panel opened for feature:', message.feature);
            } catch (error) {
                console.error('Error setting up side panel:', error);
            }
        })();
        return true;
    }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
    if (command === '_execute_action') {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) return;

            if (tab.url && tab.url.startsWith("chrome://")) {
                console.error("Cannot open side panel on a chrome:// URL:", tab.url);
                return;
            }

            await chrome.sidePanel.open({ tabId: tab.id });
            await chrome.sidePanel.setOptions({
                tabId: tab.id,
                path: 'src/pages/sidepanel/index.html',
                enabled: true
            });

            console.log('Side panel opened via keyboard shortcut');
        } catch (error) {
            console.error('Error opening side panel via shortcut:', error);
        }
    }
});

// Context menu setup
chrome.runtime.onInstalled.addListener(async (details) => {
    // Create context menus with error handling
    try {
        chrome.contextMenus.create({
            id: 'open-delight',
            title: 'Open Delight',
            contexts: ['page']
        });

        chrome.contextMenus.create({
            id: 'summarize-page',
            title: 'Summarize with Delight',
            contexts: ['page']
        });

        chrome.contextMenus.create({
            id: 'chat-about-page',
            title: 'Chat about page with Delight',
            contexts: ['page']
        });

        chrome.contextMenus.create({
            id: 'explain-selection',
            title: 'Explain with Delight',
            contexts: ['selection']
        });

        chrome.contextMenus.create({
            id: 'rewrite-selection',
            title: 'Rewrite with Delight',
            contexts: ['selection']
        });

        // chrome.contextMenus.create({
        //     id: 'translate-selection',
        //     title: 'Translate with Delight',
        //     contexts: ['selection']
        // });
    } catch (error) {
        console.error('Failed to create context menus:', error);
    }

    // Show welcome page on first install
    if (details.reason === 'install') {
        try {
            const result = await chrome.storage.sync.get(['welcomeCompleted']);
            
            if (!result.welcomeCompleted) {
                await chrome.tabs.create({
                    url: chrome.runtime.getURL('src/pages/welcome/index.html'),
                    active: true
                });
            }
        } catch (error) {
            console.error('Error handling first install:', error);
        }
    }
    
    // Show updates page on version update
    if (details.reason === 'update') {
        const previousVersion = details.previousVersion;
        const currentVersion = chrome.runtime.getManifest().version;
        
        if (previousVersion && currentVersion && previousVersion !== currentVersion) {
            try {
                await chrome.storage.local.set({
                    updateInfo: {
                        previousVersion,
                        currentVersion,
                        updateDate: new Date().toISOString()
                    }
                });
                
                await chrome.tabs.create({
                    url: chrome.runtime.getURL('src/pages/updates/index.html'),
                    active: true
                });
            } catch (error) {
                console.error('Error handling extension update:', error);
            }
        }
    }
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab?.id || !tab?.windowId) return;

    try {
        if (tab.url && tab.url.startsWith("chrome://")) {
            console.error("Cannot open side panel on chrome:// URL");
            return;
        }

        // Clear existing chat and store the context menu action
        chrome.storage.local.remove(['quickChatHistory']);
        
        const contextAction = {
            action: info.menuItemId,
            selectedText: info.selectionText || '',
            pageUrl: info.pageUrl || '',
            timestamp: Date.now(),
            autoSend: true
        };

        chrome.storage.local.set({ pendingContextAction: contextAction });

        // Open sidepanel synchronously to preserve user gesture
        chrome.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
        chrome.sidePanel.setOptions({
            tabId: tab.id,
            path: 'src/pages/sidepanel/index.html',
            enabled: true
        });

        console.log('Context menu action:', info.menuItemId);
    } catch (error) {
        console.error('Error handling context menu:', error);
    }
});

chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

chrome.runtime.onConnect.addListener((port) => {
    console.log('Connected to port:', port.name);

    port.onMessage.addListener((msg) => {
        console.log('Received port message:', msg);
    });
});