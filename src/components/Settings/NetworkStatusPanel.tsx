import React, { useState, useEffect } from 'react';
import { AIService } from '../../services/ai/AIService';

interface NetworkStatusPanelProps {
  aiService: AIService;
}

interface ProviderStatus {
  configured: boolean;
  connected: boolean;
  error?: string;
}

export const NetworkStatusPanel: React.FC<NetworkStatusPanelProps> = ({ aiService }) => {
  const [networkStatus, setNetworkStatus] = useState<{ isOnline: boolean; lastCheck: number }>({
    isOnline: true,
    lastCheck: Date.now()
  });
  const [providerStatuses, setProviderStatuses] = useState<Record<string, ProviderStatus>>({});
  const [isTestingProviders, setIsTestingProviders] = useState(false);
  // TODO: Uncomment for Pro/Technical Users
  // const [retryConfig, setRetryConfig] = useState({ maxRetries: 3, baseDelay: 1000, maxDelay: 10000 });

  useEffect(() => {
    updateNetworkStatus();
    // TODO: Uncomment for Pro/Technical Users
    // updateRetryConfig();
    
    // Update network status every 30 seconds
    const interval = setInterval(updateNetworkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateNetworkStatus = async () => {
    try {
      const status = aiService.getNetworkStatus();
      setNetworkStatus(status);
    } catch (error) {
      console.error('Failed to get network status:', error);
    }
  };

  // TODO: Uncomment for Pro/Technical Users
  // const updateRetryConfig = () => {
  //   try {
  //     const config = aiService.getRetryConfiguration();
  //     setRetryConfig(config);
  //   } catch (error) {
  //     console.error('Failed to get retry configuration:', error);
  //   }
  // };

  const testNetworkConnectivity = async () => {
    try {
      const isOnline = await aiService.checkNetworkConnectivity();
      setNetworkStatus({ isOnline, lastCheck: Date.now() });
    } catch (error) {
      console.error('Network connectivity test failed:', error);
      setNetworkStatus({ isOnline: false, lastCheck: Date.now() });
    }
  };

  const testAllProviders = async () => {
    setIsTestingProviders(true);
    try {
      const results = await aiService.testAllProviders();
      setProviderStatuses(results);
    } catch (error) {
      console.error('Provider testing failed:', error);
    } finally {
      setIsTestingProviders(false);
    }
  };

  // TODO: Uncomment for Pro/Technical Users
  // const updateRetrySettings = (updates: Partial<typeof retryConfig>) => {
  //   const newConfig = { ...retryConfig, ...updates };
  //   setRetryConfig(newConfig);
  //   aiService.updateRetryConfiguration(newConfig);
  // };

  const formatLastCheck = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div className="space-y-6">
      {/* Network Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
            <span className={`w-3 h-3 rounded-full mr-2 ${networkStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            Connection Status
          </h3>
          <button
            onClick={testNetworkConnectivity}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Test Connection
          </button>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Internet:</span>
            <span className={networkStatus.isOnline ? 'text-green-600' : 'text-red-600'}>
              {networkStatus.isOnline ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Last checked:</span>
            <span>{formatLastCheck(networkStatus.lastCheck)}</span>
          </div>
        </div>
      </div>

      {/* Provider Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 dark:text-white">
            AI Provider Status
          </h3>
          <button
            onClick={testAllProviders}
            disabled={isTestingProviders}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isTestingProviders ? 'Testing...' : 'Test All'}
          </button>
        </div>

        {Object.keys(providerStatuses).length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click "Test All" to check if your AI providers are working
          </p>
        ) : (
          <div className="space-y-2">
            {Object.entries(providerStatuses).map(([name, status]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="capitalize font-medium text-gray-700 dark:text-gray-300">
                  {name}
                </span>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    !status.configured 
                      ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      : status.connected
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {!status.configured ? 'Not set up' : status.connected ? 'Working' : 'Not working'}
                  </span>
                  {status.error && (
                    <span className="text-xs text-red-500 truncate max-w-32" title={status.error}>
                      {status.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TODO: Uncomment for Pro/Technical Users */}
      {/* Retry Configuration */}
      {/* <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          Error Recovery Settings
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Retries
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={retryConfig.maxRetries}
              onChange={(e) => updateRetrySettings({ maxRetries: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Number of retry attempts for failed requests
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Base Delay (ms)
            </label>
            <input
              type="number"
              min="100"
              max="10000"
              step="100"
              value={retryConfig.baseDelay}
              onChange={(e) => updateRetrySettings({ baseDelay: parseInt(e.target.value) || 1000 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Initial delay before first retry
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Delay (ms)
            </label>
            <input
              type="number"
              min="1000"
              max="60000"
              step="1000"
              value={retryConfig.maxDelay}
              onChange={(e) => updateRetrySettings({ maxDelay: parseInt(e.target.value) || 10000 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maximum delay between retries (exponential backoff)
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Enhanced Error Recovery:</strong> Automatic retry with exponential backoff, 
            fallback provider switching, and network connectivity monitoring are now active.
          </p>
        </div>
      </div> */}

      {/* Enhanced Features Info - Simplified for Regular Users */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-4">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          🛡️ Enhanced Reliability
        </h3>
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <div className="flex items-center">
            <span className="text-green-600 mr-2">✓</span>
            Automatic retry when requests fail
          </div>
          <div className="flex items-center">
            <span className="text-green-600 mr-2">✓</span>
            Smart backup provider switching
          </div>
          <div className="flex items-center">
            <span className="text-green-600 mr-2">✓</span>
            Network connectivity monitoring
          </div>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
          These features work automatically in the background to ensure reliable AI responses.
        </p>
      </div>
    </div>
  );
};

export default NetworkStatusPanel;