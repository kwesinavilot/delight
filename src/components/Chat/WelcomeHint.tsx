import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  CogIcon, 
  RocketLaunchIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface WelcomeHintProps {
  onDismiss: () => void;
}

const WelcomeHint: React.FC<WelcomeHintProps> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if welcome hint should be shown
    const checkWelcomeStatus = async () => {
      try {
        const result = await chrome.storage.sync.get(['welcomeCompleted', 'welcomeHintDismissed']);
        
        // Show hint if welcome not completed and hint not dismissed
        if (!result.welcomeCompleted && !result.welcomeHintDismissed) {
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error checking welcome status:', error);
      }
    };

    checkWelcomeStatus();
  }, []);

  const handleDismiss = async () => {
    setIsVisible(false);
    onDismiss();
    
    try {
      await chrome.storage.sync.set({ welcomeHintDismissed: true });
    } catch (error) {
      console.error('Error saving welcome hint dismissal:', error);
    }
  };

  const handleOpenWelcome = () => {
    chrome.tabs.create({ 
      url: chrome.runtime.getURL('src/pages/welcome/index.html'),
      active: true 
    });
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <SparklesIcon className="h-6 w-6 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Welcome to Delight 3.0! 🎉
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
              Get started with 6 AI providers including ultra-fast Groq. Set up your first provider to begin chatting!
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleOpenWelcome}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
              >
                <RocketLaunchIcon className="h-3 w-3" />
                <span>Quick Setup</span>
              </button>
              <button
                onClick={() => {
                  // Dispatch custom event to switch to settings
                  const event = new CustomEvent('switchToSettings');
                  window.dispatchEvent(event);
                }}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 text-xs rounded-md border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <CogIcon className="h-3 w-3" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default WelcomeHint;