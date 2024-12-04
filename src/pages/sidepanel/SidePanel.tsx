import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, X, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import { getPageContent, summarizeContent } from "@/utils/summarization";

const SidePanel: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const closePanel = () => {
    console.log("Sending closePanel message");
    chrome.runtime.sendMessage({ action: 'closePanel' });
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
      <div className="fixed top-0 left-0 right-0 border-b bg-background">
        <div className="p-2 flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarImage src="/icons/delightful-1.jpg" />
              <AvatarFallback>
                <Sparkles className="h-6 w-6 text-primary" />
              </AvatarFallback>
            </Avatar>
            <h1 className="text-lg font-semibold">Delight</h1>
          </div>

          {/* Theme and Close buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
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
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto mt-[60px] p-4">
        {loading ? (
          <p>{statusMessage}</p>
        ) : (
          <div>
            <h2 className="font-semibold">Summary:</h2>
            <p>{summary || 'No summary available.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidePanel; 