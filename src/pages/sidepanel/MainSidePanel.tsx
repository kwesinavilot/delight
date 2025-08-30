import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, X, Settings, ArrowLeft } from "lucide-react";
import ChatPanel from '@/components/Chat/ChatPanel';
import SettingsPanel from '@/components/Settings/SettingsPanel';

const MainSidePanel: React.FC = () => {
  const [activeView, setActiveView] = useState<'chat' | 'settings'>('chat');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const closePanel = () => {
    chrome.runtime.sendMessage({ action: 'closePanel' });
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
    <div className="flex flex-col h-screen w-full bg-background">
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
              title="Close panel"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area with SPA-like transitions */}
      <div className="flex-1 overflow-hidden mt-[60px] relative">
        <div 
          className={`absolute inset-0 transition-all duration-300 ease-in-out ${
            isTransitioning ? 'opacity-0 transform translate-x-2' : 'opacity-100 transform translate-x-0'
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
