import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, X, Settings, ArrowLeft, Maximize2, Minimize2, Plus, MessageSquare, Bot } from "lucide-react";
import ChatPanel from '@/components/Chat/ChatPanel';
import SettingsPanel from '@/components/Settings/SettingsPanel';
import ConversationSidebar from '@/components/Chat/ConversationSidebar';
import AgentPage from '@/components/Agent/AgentPage';
// import { enhancedSidepanelManager } from '@/services/tabs';

const MainSidePanel: React.FC = () => {
  const [activeView, setActiveView] = useState<'chat' | 'settings' | 'conversations'>('chat');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMinimizing, setIsMinimizing] = useState<boolean>(false);
  const [hasConversation, setHasConversation] = useState<boolean>(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isEdge, setIsEdge] = useState<boolean>(false);
  const [showAgentPage, setShowAgentPage] = useState<boolean>(false);

  // Detect Edge browser
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isEdgeBrowser = userAgent.includes('Edg/') || userAgent.includes('Edge/');
    setIsEdge(isEdgeBrowser);
    console.log('[MainSidePanel] Edge detection:', { userAgent, isEdgeBrowser });
  }, []);

  // Detect if we're in fullscreen mode (opened as a tab vs sidepanel)
  useEffect(() => {
    const checkIfFullscreen = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hasTabMode = urlParams.get('mode') === 'tab';
      const isWideWindow = window.outerWidth > 500; // More conservative threshold
      const isTabContext = window.location.pathname.includes('sidepanel') && hasTabMode;

      // Primary check: URL parameter
      // Secondary check: window width (sidepanels are typically 320-400px)
      const isTabMode = hasTabMode || (isWideWindow && !window.chrome?.sidePanel);

      console.log('[MainSidePanel] Fullscreen detection:', {
        urlMode: urlParams.get('mode'),
        windowWidth: window.outerWidth,
        isTabContext,
        isWideWindow,
        isTabMode
      });

      setIsFullscreen(isTabMode);
    };

    checkIfFullscreen();

    // Listen for resize events to detect mode changes
    const handleResize = () => {
      // Debounce resize events
      setTimeout(checkIfFullscreen, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Check for existing conversation
  useEffect(() => {
    const checkConversationHistory = async () => {
      try {
        const result = await chrome.storage.local.get(['quickChatHistory']);
        const history = result.quickChatHistory || [];
        setHasConversation(history.length > 0);
      } catch (error) {
        console.error('Failed to check conversation history:', error);
      }
    };

    checkConversationHistory();

    // Listen for storage changes to update conversation state
    const handleStorageChange = (changes: any) => {
      if (changes.quickChatHistory) {
        const newHistory = changes.quickChatHistory.newValue || [];
        setHasConversation(newHistory.length > 0);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleSessionSelect = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // Load session data and notify ChatPanel
    window.dispatchEvent(new CustomEvent('loadSession', { detail: { sessionId } }));
  };

  const handleSessionDelete = async (sessionId: string) => {
    try {
      const result = await chrome.storage.local.get(['chatSessions']);
      const sessions = result.chatSessions || {};
      delete sessions[sessionId];
      await chrome.storage.local.set({ chatSessions: sessions });

      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        window.dispatchEvent(new CustomEvent('newConversation'));
      }

      // Trigger sidebar update
      window.dispatchEvent(new CustomEvent('sessionsUpdated'));
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleSessionRename = async (sessionId: string, newTitle: string) => {
    try {
      const result = await chrome.storage.local.get(['chatSessions']);
      const sessions = result.chatSessions || {};
      if (sessions[sessionId]) {
        sessions[sessionId].title = newTitle;
        await chrome.storage.local.set({ chatSessions: sessions });
      }

      // Trigger sidebar update
      window.dispatchEvent(new CustomEvent('sessionsUpdated'));
    } catch (error) {
      console.error('Failed to rename session:', error);
    }
  };

  // Listen for custom events to switch views
  useEffect(() => {
    const handleSwitchToSettings = () => {
      handleViewChange('settings');
    };

    window.addEventListener('switchToSettings', handleSwitchToSettings);

    return () => {
      window.removeEventListener('switchToSettings', handleSwitchToSettings);
    };
  }, []);

  const closePanel = async () => {
    try {
      if (isFullscreen) {
        window.close();
        return;
      }

      // For sidepanel mode, try window.close() first (most reliable)
      window.close();

      // If window.close() doesn't work, try Chrome API as fallback
      setTimeout(async () => {
        try {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const tab = tabs[0];
          if (tab?.id) {
            await chrome.sidePanel.setOptions({
              tabId: tab.id,
              enabled: false
            });
          }
        } catch (error) {
          console.warn('Chrome API fallback failed:', error);
        }
      }, 100);
    } catch (error) {
      console.error('Error closing panel:', error);
    }
  };

  const maximizeToFullscreen = async () => {
    try {
      // Get current tab before opening fullscreen
      const currentTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = currentTabs[0];

      // Close sidepanel first if it exists
      if (currentTab?.id) {
        try {
          await chrome.sidePanel.setOptions({
            tabId: currentTab.id,
            enabled: false
          });
        } catch (error) {
          console.warn('Could not disable sidepanel:', error);
        }
      }

      // Open the sidepanel page in a new tab for fullscreen experience
      await chrome.tabs.create({
        url: chrome.runtime.getURL('src/pages/sidepanel/index.html?mode=tab'),
        active: true
      });

      console.log('Opened fullscreen tab and closed sidepanel');
    } catch (error) {
      console.error('Error maximizing to fullscreen:', error);
      if (isEdge) {
        alert('Fullscreen mode may not work properly in Microsoft Edge. For the best experience, please use Google Chrome.');
      } else {
        alert('Failed to open fullscreen mode. Please try again.');
      }
    }
  };

  const minimizeToSidePanel = async () => {
    if (isMinimizing) return;

    setIsMinimizing(true);

    try {
      // Try to find existing valid tab first
      const tabs = await chrome.tabs.query({});
      let targetTab = tabs.find(async tab =>
        tab.url &&
        !tab.url.startsWith('chrome://') &&
        !tab.url.startsWith('chrome-extension://') &&
        tab.id !== (await chrome.tabs.getCurrent())?.id
      );

      // If no valid tab exists, create a new one
      if (!targetTab) {
        targetTab = await chrome.tabs.create({ active: true });
      } else {
        await chrome.tabs.update(targetTab.id!, { active: true });
      }

      if (targetTab.id) {
        await chrome.sidePanel.open({ tabId: targetTab.id });
        await chrome.sidePanel.setOptions({
          tabId: targetTab.id,
          path: 'sidepanel.html',
          enabled: true
        });

        setIsFullscreen(false);
        window.close();
      }
    } catch (error) {
      console.error('Error minimizing to sidepanel:', error);
      window.close();
    } finally {
      setIsMinimizing(false);
    }
  };

  const handleViewChange = async (newView: 'chat' | 'settings' | 'conversations') => {
    if (newView === activeView) return;

    setIsTransitioning(true);

    // Small delay for smooth transition
    setTimeout(() => {
      setActiveView(newView);
      setIsTransitioning(false);
    }, 150);
  };

  const startNewConversation = async () => {
    try {
      // Clear the conversation history
      await chrome.storage.local.remove(['quickChatHistory']);
      setHasConversation(false);

      // Dispatch custom event to notify ChatPanel to reset
      window.dispatchEvent(new CustomEvent('newConversation'));

      console.log('Started new conversation');
    } catch (error) {
      console.error('Failed to start new conversation:', error);
    }
  };

  return (
    <div className={`flex flex-col h-screen w-full bg-background`}>
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 border-b bg-background z-10">
        <div className="p-2 flex items-center justify-between">
          {/* Logo and Title / Back Button */}
          <div className="flex items-center space-x-2">
            {activeView === 'settings' ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleViewChange('chat')}
                  title="Back to Chat"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">Settings</h1>
              </>
            ) : activeView === 'conversations' ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleViewChange('chat')}
                  title="Back to Chat"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">Conversations</h1>
              </>
            ) : (
              <>
                <Avatar>
                  <AvatarImage src="/icons/delightful-1.jpg" />
                  <AvatarFallback>
                    <Sparkles className="h-6 w-6 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <h1 className="text-lg font-semibold">Delight</h1>
              </>
            )}
          </div>

          {/* Control buttons */}
          {activeView === 'chat' && (
            <div className="flex items-center space-x-2">
              {/* New Conversation button - show in fullscreen mode */}
              {isFullscreen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={startNewConversation}
                  className={!hasConversation ? 'opacity-50' : ''}
                  title="Start new conversation"
                  disabled={!hasConversation}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              )}

              {/* Maximize/Minimize button */}
              {!isFullscreen ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={maximizeToFullscreen}
                  title={isEdge ? "Open in fullscreen (may not work properly in Edge)" : "Open in fullscreen"}
                >
                  <Maximize2 className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={minimizeToSidePanel}
                  disabled={isMinimizing}
                  title={isMinimizing ? "Minimizing..." : "Minimize to sidepanel"}
                >
                  <Minimize2 className={`h-5 w-5 ${isMinimizing ? 'animate-pulse' : ''}`} />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleViewChange('settings')}
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={closePanel}
                title="Close panel"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-toolbar for sidepanel mode */}
      {!isFullscreen && activeView === 'chat' && (
        <div className="fixed top-[60px] left-0 right-0 border-b bg-background z-10">
          <div className="p-2 flex items-center space-x-2">
            {/* New Conversation button - always visible, faint when no conversations */}
            <Button
              id="new-conversation-btn"
              variant="ghost"
              size="sm"
              onClick={startNewConversation}
              className={`flex items-center space-x-1 ${!hasConversation ? 'opacity-50' : ''}`}
              title="Start new conversation"
              disabled={!hasConversation}
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs">New</span>
            </Button>

            {/* Conversations List button */}
            <Button
              id="conversations-btn"
              variant="ghost"
              size="sm"
              onClick={() => handleViewChange('conversations')}
              className="flex items-center space-x-1"
              title="View conversations"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs">Chats</span>
            </Button>

            {/* Agent Automation button */}
            <Button
              id="agent-automation-btn"
              variant="ghost"
              size="sm"
              onClick={() => setShowAgentPage(true)}
              className="flex items-center space-x-1"
              title="Agent Automation"
            >
              <Bot className="h-4 w-4" />
              <span className="text-xs">Agent</span>
            </Button>
          </div>
        </div>
      )}

      {/* Content Area with SPA-like transitions */}
      <div className={`flex-1 overflow-hidden ${!isFullscreen && activeView === 'chat' ? 'mt-[100px]' : 'mt-[60px]'} relative`}>
        <div
          className={`absolute inset-0 transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-0 transform translate-x-2' : 'opacity-100 transform translate-x-0'
            }`}
        >
          {activeView === 'settings' && (
            <div className="h-full animate-in slide-in-from-right-2 duration-300">
              <SettingsPanel />
            </div>
          )}

          {activeView === 'conversations' && (
            <div className="h-full animate-in slide-in-from-right-2 duration-300">
              <ConversationSidebar
                currentSessionId={currentSessionId}
                onSessionSelect={(sessionId) => {
                  handleSessionSelect(sessionId);
                  handleViewChange('chat');
                }}
                onSessionDelete={handleSessionDelete}
                onSessionRename={handleSessionRename}
                showHeader={false}
                isFullscreen={isFullscreen}
              />
            </div>
          )}

          {activeView === 'chat' && (
            <div className="h-full flex animate-in slide-in-from-left-2 duration-300">
              {/* Conversation Sidebar - only in fullscreen mode */}
              {isFullscreen && (
                <ConversationSidebar
                  currentSessionId={currentSessionId}
                  onSessionSelect={handleSessionSelect}
                  onSessionDelete={handleSessionDelete}
                  onSessionRename={handleSessionRename}
                  showHeader={true}
                  isFullscreen={isFullscreen}
                />
              )}

              {/* Chat Panel */}
              <div className={`flex-1 ${isFullscreen ? 'max-w-4xl mx-auto' : ''}`}>
                <ChatPanel isFullscreen={isFullscreen} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent Page */}
      {showAgentPage && (
        <div className="absolute inset-0 bg-background z-20">
          <AgentPage onBack={() => setShowAgentPage(false)} />
        </div>
      )}
    </div>
  );
};

export default MainSidePanel;
