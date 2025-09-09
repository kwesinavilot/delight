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
                    path: 'sidepanel.html',
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

// Context menu setup and welcome page handling
chrome.runtime.onInstalled.addListener(async (details) => {
    // Create context menu - DISABLED
    // chrome.contextMenus.create({
    //     id: 'summarize',
    //     title: 'Summarize with Delight',
    //     contexts: ['page'],
    //     enabled: true
    // });

    // Show welcome page on first install
    if (details.reason === 'install') {
        try {
            // Check if welcome has been completed before
            const result = await chrome.storage.sync.get(['welcomeCompleted']);
            
            if (!result.welcomeCompleted) {
                // Open welcome page in a new tab
                await chrome.tabs.create({
                    url: chrome.runtime.getURL('src/pages/welcome/index.html'),
                    active: true
                });
            }
        } catch (error) {
            console.error('Error handling first install:', error);
        }
    }
    
    // Show updates page on any version update
    if (details.reason === 'update') {
        const previousVersion = details.previousVersion;
        const currentVersion = chrome.runtime.getManifest().version;
        
        if (previousVersion && currentVersion && previousVersion !== currentVersion) {
            try {
                // Store update info for the updates page
                await chrome.storage.local.set({
                    updateInfo: {
                        previousVersion,
                        currentVersion,
                        updateDate: new Date().toISOString()
                    }
                });
                
                // Open updates page
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

// Context menu click handler - DISABLED
// chrome.contextMenus.onClicked.addListener((info, tab) => {
//     if (!tab?.id || !tab?.windowId) {
//         console.error('No tab found for context menu action');
//         return;
//     }

//     (async () => {
//         try {
//             if (tab.url && tab.url.startsWith("chrome://")) {
//                 console.error("Cannot open side panel on a chrome:// URL");
//                 return;
//             }

//             if (info.menuItemId === 'summarize') {
//                 // Store summarization request
//                 await chrome.storage.local.set({
//                     pendingSummarization: {
//                         tabId: tab.id,
//                         url: tab.url,
//                         title: tab.title,
//                         timestamp: Date.now()
//                     }
//                 });
//             }

//             await chrome.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
//             await chrome.sidePanel.setOptions({
//                 tabId: tab.id,
//                 path: 'sidepanel.html',
//                 enabled: true
//             });
//         } catch (error) {
//             console.error('Error setting up side panel:', error);
//         }
//     })();
//     return true;
// });

chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// Update context menu based on the active tab - DISABLED
// chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
//     if (!tab.url) return;

//     if (changeInfo.status === 'complete' && tab.active) {
//         const isUtilityPage = tab.url && tab.url.startsWith('chrome://');
//         chrome.contextMenus.update('summarize', { enabled: !isUtilityPage });
//     }
// });

// Add connection listener
chrome.runtime.onConnect.addListener((port) => {
    console.log('Connected to port:', port.name);

    port.onMessage.addListener((msg) => {
        console.log('Received port message:', msg);
    });
});
