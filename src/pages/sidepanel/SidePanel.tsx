import React, { useState, useEffect } from 'react';
import ChatPanel from '../../components/Chat/ChatPanel';
import SummaryPanel from '../../components/Summary/SummaryPanel';

type PanelType = 'chat' | 'summary';

const SidePanel: React.FC = () => {
  const [activePanel, setActivePanel] = useState<PanelType>('chat');

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'setPanel') {
        setActivePanel(message.panel);
      }
    });
  }, []);

  return (
    <div className="h-screen bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
      {activePanel === 'chat' ? <ChatPanel /> : <SummaryPanel />}
    </div>
  );
};

export default SidePanel; 