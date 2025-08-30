import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { ConfigManager } from '@/services/config/ConfigManager';
import { AIConfiguration } from '@/types/ai';

interface SettingsPanelProps {
  onClose?: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ }) => {
  const [activeTab, setActiveTab] = useState<'providers' | 'appearance'>('providers');
  const [providers, setProviders] = useState<Record<string, AIConfiguration>>({});
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'success' | 'error' | null>>({});
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // Provider configurations
  const availableProviders = {
    openai: {
      name: 'OpenAI',
      description: 'GPT models including GPT-4o, GPT-4 Turbo, and GPT-3.5',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
      defaultModel: 'gpt-4-turbo',
      apiKeyPlaceholder: 'sk-...',
      website: 'https://platform.openai.com/api-keys'
    },
    anthropic: {
      name: 'Anthropic',
      description: 'Claude models including Claude 3.5 Sonnet, Opus, and Haiku',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      defaultModel: 'claude-3-5-sonnet-20241022',
      apiKeyPlaceholder: 'sk-ant-...',
      website: 'https://console.anthropic.com/'
    },
    gemini: {
      name: 'Google Gemini',
      description: 'Gemini models including 2.5 Pro, Flash, and Vision variants',
      models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-preview-image-generation', 'gemini-2.0-flash-lite'],
      defaultModel: 'gemini-2.5-flash',
      apiKeyPlaceholder: 'AI...',
      website: 'https://aistudio.google.com/app/apikey'
    },
    grok: {
      name: 'Grok (X.AI)',
      description: 'Grok models with witty personality and real-time information',
      models: ['grok-beta'],
      defaultModel: 'grok-beta',
      apiKeyPlaceholder: 'xai-...',
      website: 'https://console.x.ai/'
    },
    groq: {
      name: 'Groq',
      description: 'Ultra-fast inference with Llama, Mixtral, and Gemma models',
      models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'meta-llama/llama-4-maverick-17b-128e-instruct', 'meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen/qwen3-32b', 'deepseek-r1-distill-llama-70b', 'gemma2-9b-it'],
      defaultModel: 'openai/gpt-oss-20b',
      apiKeyPlaceholder: 'gsk_...',
      website: 'https://console.groq.com/keys'
    },
    sambanova: {
      name: 'SambaNova',
      description: 'Llama models from 1B to 405B parameters with vision support',
      models: ['Meta-Llama-3.1-405B-Instruct', 'Meta-Llama-3.1-70B-Instruct', 'Meta-Llama-3.1-8B-Instruct'],
      defaultModel: 'Meta-Llama-3.1-8B-Instruct',
      apiKeyPlaceholder: 'sk-...',
      website: 'https://cloud.sambanova.ai/'
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const configManager = ConfigManager.getInstance();
      const allConfigs = await configManager.getAllConfigurations();
      const currentProvider = await configManager.getCurrentProvider();
      
      setProviders(allConfigs);
      setSelectedProvider(currentProvider || '');
      
      // Load theme from storage
      const result = await chrome.storage.sync.get(['theme']);
      setTheme(result.theme || 'system');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleProviderConfigChange = async (providerId: string, field: string, value: string) => {
    const updatedProviders = {
      ...providers,
      [providerId]: {
        ...providers[providerId],
        provider: providerId,
        [field]: value
      }
    };
    
    setProviders(updatedProviders);
    
    try {
      const configManager = ConfigManager.getInstance();
      await configManager.setConfiguration(providerId, updatedProviders[providerId]);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  };

  const handleProviderSelect = async (providerId: string) => {
    setSelectedProvider(providerId);
    
    try {
      const configManager = ConfigManager.getInstance();
      await configManager.setCurrentProvider(providerId);
    } catch (error) {
      console.error('Failed to set current provider:', error);
    }
  };

  const testConnection = async (providerId: string) => {
    setTestingConnection(providerId);
    setConnectionStatus({ ...connectionStatus, [providerId]: null });
    
    try {
      const configManager = ConfigManager.getInstance();
      const success = await configManager.testConnection(providerId);
      
      setConnectionStatus({ 
        ...connectionStatus, 
        [providerId]: success ? 'success' : 'error' 
      });
    } catch (error) {
      setConnectionStatus({ 
        ...connectionStatus, 
        [providerId]: 'error' 
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    
    try {
      await chrome.storage.sync.set({ theme: newTheme });
      
      // Apply theme immediately
      if (newTheme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      } else {
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKey({
      ...showApiKey,
      [providerId]: !showApiKey[providerId]
    });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-2">
          <Cog6ToothIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Configuration</h1>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-4 mt-4">
          <button
            onClick={() => setActiveTab('providers')}
            className={`px-3 py-2 text-sm font-medium rounded-lg ${
              activeTab === 'providers'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            AI Providers
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-2 text-sm font-medium rounded-lg ${
              activeTab === 'appearance'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Appearance
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'providers' && (
          <div className="space-y-6">
            {Object.entries(availableProviders).map(([providerId, providerInfo]) => {
              const config = providers[providerId] || { provider: providerId, apiKey: '', model: providerInfo.defaultModel };
              const isSelected = selectedProvider === providerId;
              const status = connectionStatus[providerId];
              
              return (
                <div
                  key={providerId}
                  className={`border rounded-lg p-4 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="provider"
                        checked={isSelected}
                        onChange={() => handleProviderSelect(providerId)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {providerInfo.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {providerInfo.description}
                        </p>
                      </div>
                    </div>
                    
                    {status && (
                      <div className="flex items-center space-x-1">
                        {status === 'success' ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* API Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        API Key
                      </label>
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <input
                            type={showApiKey[providerId] ? 'text' : 'password'}
                            value={config.apiKey || ''}
                            onChange={(e) => handleProviderConfigChange(providerId, 'apiKey', e.target.value)}
                            placeholder={providerInfo.apiKeyPlaceholder}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => toggleApiKeyVisibility(providerId)}
                            className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            {showApiKey[providerId] ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        <button
                          onClick={() => testConnection(providerId)}
                          disabled={!config.apiKey || testingConnection === providerId}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {testingConnection === providerId ? 'Testing...' : 'Test'}
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <a
                          href={providerInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          Get API key →
                        </a>
                      </div>
                    </div>

                    {/* Model Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Model
                      </label>
                      <select
                        value={config.model || providerInfo.defaultModel}
                        onChange={(e) => handleProviderConfigChange(providerId, 'model', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        {providerInfo.models.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Theme</h3>
              <div className="space-y-3">
                {[
                  { value: 'light', label: 'Light', description: 'Always use light theme' },
                  { value: 'dark', label: 'Dark', description: 'Always use dark theme' },
                  { value: 'system', label: 'System', description: 'Follow system preference' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value={option.value}
                      checked={theme === option.value}
                      onChange={(e) => handleThemeChange(e.target.value as any)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium mb-1">About Delight</p>
                  <p>Version 3.0.0 - AI-powered Chrome extension with 6-provider ecosystem including ultra-fast Groq</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;