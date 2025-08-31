import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ConfigManager } from '@/services/config/ConfigManager';
import { providerSwitchingUtil } from '@/utils/providerSwitching';
import ProviderSwitchDialog from './ProviderSwitchDialog';

interface ProviderSwitchButtonProps {
  className?: string;
  showLabel?: boolean;
}

const ProviderSwitchButton: React.FC<ProviderSwitchButtonProps> = ({
  className = '',
  showLabel = true
}) => {
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  // Provider display names
  const providerNames: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    gemini: 'Gemini',
    grok: 'Grok',
    groq: 'Groq',
    sambanova: 'SambaNova'
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const configManager = ConfigManager.getInstance();
      const current = await configManager.getCurrentProvider();
      const configured = await configManager.getAvailableProviders();
      
      setCurrentProvider(current);
      setAvailableProviders(configured);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const handleProviderSelect = async (providerId: string) => {
    setShowDropdown(false);
    
    if (providerId === currentProvider) return;

    // Check if confirmation is needed
    const requiresConfirmation = await providerSwitchingUtil.requiresConfirmation(providerId);
    
    if (requiresConfirmation) {
      setPendingProvider(providerId);
      setShowSwitchDialog(true);
    } else {
      await performSwitch(providerId, {
        preserveContext: false,
        convertContext: false,
        createNewSession: true
      });
    }
  };

  const performSwitch = async (
    providerId: string,
    options: {
      preserveContext: boolean;
      convertContext: boolean;
      createNewSession: boolean;
    }
  ) => {
    setSwitching(true);
    try {
      const result = await providerSwitchingUtil.switchProvider(providerId, options);
      
      if (result.success) {
        setCurrentProvider(providerId);
        
        if (result.warnings && result.warnings.length > 0) {
          console.warn('Provider switch warnings:', result.warnings);
        }
      } else {
        console.error('Provider switch failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to switch provider:', error);
    } finally {
      setSwitching(false);
    }
  };

  const getCurrentProviderName = () => {
    return providerNames[currentProvider] || currentProvider || 'Select Provider';
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={switching}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {switching ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            <div className="flex items-center space-x-2">
              {showLabel && <span>Provider:</span>}
              <span className="font-semibold">{getCurrentProviderName()}</span>
              <ChevronDownIcon className="h-4 w-4" />
            </div>
          )}
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
            <div className="py-1">
              {availableProviders.map((providerId) => (
                <button
                  key={providerId}
                  onClick={() => handleProviderSelect(providerId)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    providerId === currentProvider
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{providerNames[providerId] || providerId}</span>
                    {providerId === currentProvider && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Click outside to close dropdown */}
        {showDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>

      {/* Provider Switch Dialog */}
      {showSwitchDialog && pendingProvider && (
        <ProviderSwitchDialog
          isOpen={showSwitchDialog}
          onClose={() => {
            setShowSwitchDialog(false);
            setPendingProvider(null);
          }}
          currentProvider={currentProvider}
          targetProvider={pendingProvider}
          targetProviderName={providerNames[pendingProvider] || pendingProvider}
          onConfirm={async (options) => {
            await performSwitch(pendingProvider!, options);
            setShowSwitchDialog(false);
            setPendingProvider(null);
          }}
        />
      )}
    </>
  );
};

export default ProviderSwitchButton;