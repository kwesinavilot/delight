import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, X, Settings, ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import ChatPanel from '@/components/Chat/ChatPanel';
import SettingsPanel from '@/components/Settings/SettingsPanel';
// import { enhancedSidepanelManager } from '@/services/tabs';

const MainSidePanel: React.FC = () => {
  const [activeView, setActiveView] = useState<'chat' | 'settings'>('chat');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMinimizing, setIsMinimizing] = useState<boolean>(false);

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
      // Open the sidepanel page in a new tab for fullscreen experience
      await chrome.tabs.create({
        url: chrome.runtime.getURL('src/pages/sidepanel/index.html?mode=tab'),
        active: true
      });
      
      console.log('Opened fullscreen tab');
      
      // Close the current sidepanel after a short delay to ensure the tab opens
      setTimeout(async () => {
        try {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const currentTab = tabs.find(tab => !tab.url?.includes('mode=tab'));
          
          if (currentTab?.id) {
            await chrome.sidePanel.setOptions({
              tabId: currentTab.id,
              enabled: false
            });
          }
        } catch (error) {
          console.warn('Could not close sidepanel after maximizing:', error);
        }
      }, 500);
    } catch (error) {
      console.error('Error maximizing to fullscreen:', error);
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

  const handleViewChange = async (newView: 'chat' | 'settings') => {
    if (newView === activeView) return;

    setIsTransitioning(true);

    // Small delay for smooth transition
    setTimeout(() => {
      setActiveView(newView);
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <div className={`flex flex-col h-screen w-full bg-background ${isFullscreen ? 'max-w-4xl mx-auto' : ''}`}>
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

          {/* Control buttons - only show in chat view */}
          {activeView === 'chat' && (
            <div className="flex items-center space-x-2">
              {/* Maximize/Minimize button */}
              {!isFullscreen ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={maximizeToFullscreen}
                  title="Open in fullscreen"
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

      {/* Content Area with SPA-like transitions */}
      <div className="flex-1 overflow-hidden mt-[60px] relative">
        <div
          className={`absolute inset-0 transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-0 transform translate-x-2' : 'opacity-100 transform translate-x-0'
            }`}
        >
          {activeView === 'settings' && (
            <div className="h-full animate-in slide-in-from-right-2 duration-300">
              <SettingsPanel />
            </div>
          )}

          {activeView === 'chat' && (
            <div className="h-full animate-in slide-in-from-left-2 duration-300">
              <ChatPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainSidePanel;
