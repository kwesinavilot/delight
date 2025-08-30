import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, X, Settings, ArrowLeft } from "lucide-react";
import { getPageContent, summarizeContent } from "@/utils/summarization";
import SettingsPanel from '@/components/Settings/SettingsPanel';
import ChatPanel from '@/components/Chat/ChatPanel';

const SidePanel: React.FC = () => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [activeView, setActiveView] = useState<'summary' | 'chat' | 'settings'>('chat');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const closePanel = () => {
    console.log("Sending closePanel message");
    chrome.runtime.sendMessage({ action: 'closePanel' });
  };

  const handleViewChange = async (newView: 'summary' | 'chat' | 'settings') => {
    if (newView === activeView) return;
    
    setIsTransitioning(true);
    
    // Small delay for smooth transition
    setTimeout(() => {
      setActiveView(newView);
      setIsTransitioning(false);
    }, 150);
  };

  const summarizePage = async () => {
    setLoading(true);
    setStatusMessage('Getting page content...');
    console.log("Getting page content...");
    const currentTab = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = currentTab[0].url;

    if (url) {
      try {
        const content = await getPageContent(url);
        setStatusMessage('Cleaning content...');
        console.log("Cleaning content...");
        const summary = await summarizeContent(content);
        setStatusMessage('Summarizing...:' + summary);
        console.log("Summarizing...");
        setSummary(summary);
        setStatusMessage('Summary complete!');
        console.log("Summary complete!:", summary);
      } catch (error) {
        console.error('Error during summarization:', error);
        setStatusMessage('Error during summarization.');
      }
    } else {
      setStatusMessage('No URL found.');
    }
    setLoading(false);
  };

  useEffect(() => {
    summarizePage();
  }, []);

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
                <h1 className="text-lg font-semibold">
                  {activeView === 'chat' ? 'Chat' : activeView === 'summary' ? 'Summary' : 'Delight'}
                </h1>
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
              <SettingsPanel onClose={() => handleViewChange('chat')} />
            </div>
          )}
          
          {activeView === 'chat' && (
            <div className="h-full animate-in slide-in-from-left-2 duration-300">
              <ChatPanel />
            </div>
          )}
          
          {activeView === 'summary' && (
            <div className="p-4 h-full overflow-auto animate-in fade-in duration-300">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">{statusMessage}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Page Summary</h2>
                  <div className="prose dark:prose-invert max-w-none">
                    {summary ? (
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{summary}</p>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">No summary available.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidePanel; 