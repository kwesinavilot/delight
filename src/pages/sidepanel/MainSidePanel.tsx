import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, X, Settings, ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import ChatPanel from '@/components/Chat/ChatPanel';
import SettingsPanel from '@/components/Settings/SettingsPanel';
import { enhancedSidepanelManager } from '@/services/tabs';

const MainSidePanel: React.FC = () => {
  const [activeView, setActiveView] = useState<'chat' | 'settings'>('chat');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMinimizing, setIsMinimizing] = useState<boolean>(false);

  // Detect if we're in fullscreen mode (opened as a tab vs sidepanel)
  useEffect(() => {
    const checkIfFullscreen = () => {
      // Check if we're in a tab by examining the URL parameters or window properties
      const urlParams = new URLSearchParams(window.location.search);
      const isTabMode = urlParams.get('mode') === 'tab' ||
        window.location.href.includes('?tab=true') ||
        window.outerWidth > 600; // Sidepanels are typically 300-400px, tabs are much wider

      console.log('[MainSidePanel] Fullscreen detection:', {
        urlMode: urlParams.get('mode'),
        hasTabParam: window.location.href.includes('?tab=true'),
        windowWidth: window.outerWidth,
        isTabMode
      });

      setIsFullscreen(isTabMode);
    };

    checkIfFullscreen();

    // Listen for resize events to detect mode changes
    window.addEventListener('resize', checkIfFullscreen);

    return () => {
      window.removeEventListener('resize', checkIfFullscreen);
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
      // Get the current tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];

      if (tab?.id) {
        // Actually close the sidepanel by disabling it
        await chrome.sidePanel.setOptions({
          tabId: tab.id,
          enabled: false
        });
        console.log('Side panel closed successfully');
      }
    } catch (error) {
      console.error('Error closing side panel:', error);
      // Fallback: try to close the window if we're in a tab
      if (isFullscreen) {
        window.close();
      }
    }
  };

  const maximizeToFullscreen = () => {
    // Open the sidepanel page in a new tab for fullscreen experience with tab mode parameter
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/pages/sidepanel/index.html?mode=tab'),
      active: true
    });

    setIsFullscreen(true);
  };

  const minimizeToSidePanel = async () => {
    if (isMinimizing) return; // Prevent multiple simultaneous operations

    setIsMinimizing(true);

    try {
      console.log('[MainSidePanel] Starting enhanced minimize to sidepanel');

      // Use the enhanced sidepanel manager for robust tab management
      const result = await enhancedSidepanelManager.minimizeToSidePanel({
        preserveCurrentTab: false,
        preferRecentlyActive: true,
        enableLogging: true
      });

      if (result.success) {
        console.log('[MainSidePanel] Successfully minimized to sidepanel:', {
          targetTab: result.targetTab?.id,
          fallbackUsed: result.fallbackUsed,
          transitionTime: result.transitionTime
        });

        setIsFullscreen(false);
      } else {
        console.error('[MainSidePanel] Enhanced minimize failed:', result.error);

        // Fallback to closing the current tab
        console.log('[MainSidePanel] Using fallback: closing current tab');
        window.close();
      }
    } catch (error) {
      console.error('[MainSidePanel] Critical error during minimize operation:', error);

      // Last resort fallback
      try {
        window.close();
      } catch (closeError) {
        console.error('[MainSidePanel] Failed to close window:', closeError);
      }
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
