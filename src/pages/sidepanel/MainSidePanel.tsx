import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, X, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import ChatPanel from '@/components/Chat/ChatPanel';

const MainSidePanel: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const closePanel = () => {
    chrome.runtime.sendMessage({ action: 'closePanel' });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      <div className="fixed top-0 left-0 right-0 border-b bg-primary/10 backdrop-blur-sm z-10">
        <div className="p-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarImage src="/icons/delightful-1.jpg" />
              <AvatarFallback className="bg-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </AvatarFallback>
            </Avatar>
            <h1 className="text-lg font-semibold text-foreground">Delight Chat</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/20 text-foreground"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? 
                <Moon className="h-5 w-5 text-foreground" /> : 
                <Sun className="h-5 w-5 text-foreground" />
              }
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-destructive/20 text-destructive"
              onClick={closePanel}
              title="Close panel"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 mt-[60px] bg-background/95">
        <ChatPanel />
      </div>
    </div>
  );
};

export default MainSidePanel;
