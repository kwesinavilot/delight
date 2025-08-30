import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, X, Settings, ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import ChatPanel from '@/components/Chat/ChatPanel';
import SettingsPanel from '@/components/Settings/SettingsPanel';

const MainSidePanel: React.FC = () => {
  const [activeView, setActiveView] = useState<'chat' | 'settings'>('chat');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Detect if we're in fullscreen mode (opened as a tab vs sidepanel)
  useEffect(() => {
    const checkIfFullscreen = () => {
      // Check if we're in a tab by examining the URL parameters or window properties
      const urlParams = new URLSearchParams(window.location.search);
      const isTabMode = urlParams.get('mode') === 'tab' ||
        window.outerWidth > 500 || // Sidepanel is typically narrow
        window.location.href.includes('?tab=true');
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

  const closePanel = () => {
    if (isFullscreen) {
      // If we're in fullscreen mode, minimize back to sidepanel
      minimizeToSidePanel();
    } else {
      // If we're in sidepanel, close it
      chrome.runtime.sendMessage({ action: 'closePanel' });
    }
  };

  const maximizeToFullscreen = () => {
    // Open the sidepanel page in a new tab for fullscreen experience with tab mode parameter
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/pages/sidepanel/index.html?mode=tab'),
      active: true
    });
  };

  const minimizeToSidePanel = async () => {
    try {
      // Get all tabs to find a suitable one for the sidepanel
      const tabs = await chrome.tabs.query({ currentWindow: true });

      // Find a non-extension tab to attach the sidepanel to
      const suitableTab = tabs.find(tab =>
        tab.url &&
        !tab.url.startsWith('chrome://') &&
        !tab.url.startsWith('chrome-extension://') &&
        tab.id !== undefined
      );

      if (suitableTab?.id) {
        // Open sidepanel on the suitable tab
        await chrome.sidePanel.open({ tabId: suitableTab.id });
        await chrome.sidePanel.setOptions({
          tabId: suitableTab.id,
          path: 'sidepanel.html',
          enabled: true
        });

        // Focus on that tab
        await chrome.tabs.update(suitableTab.id, { active: true });

        // Close the current fullscreen tab
        const currentTab = await chrome.tabs.getCurrent();
        if (currentTab?.id) {
          chrome.tabs.remove(currentTab.id);
        }
      } else {
        // If no suitable tab found, just close the current tab
        window.close();
      }
    } catch (error) {
      console.error('Error minimizing to sidepanel:', error);
      // Fallback: just close the current tab
      window.close();
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
                <h1 className="text-lg font-semibold">Chat</h1>
              </>
            )}
          </div>

          {/* Control buttons */}
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
                title="Minimize to sidepanel"
              >
                <Minimize2 className="h-5 w-5" />
              </Button>
            )}

            {activeView !== 'settings' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleViewChange('settings')}
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={closePanel}
              title={isFullscreen ? "Minimize to sidepanel" : "Close panel"}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
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
