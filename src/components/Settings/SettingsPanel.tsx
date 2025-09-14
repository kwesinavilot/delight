import React, { useState, useEffect } from 'react';
import {
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { ConfigManager } from '@/services/config/ConfigManager';
import { TrialService } from '@/services/TrialService';
import { AIService } from '@/services/ai/AIService';
import { AIConfiguration } from '@/types/ai';
import NetworkStatusPanel from './NetworkStatusPanel';

interface SettingsPanelProps {
  onClose?: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ }) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'providers' | 'network'>('appearance');
  const [aiService] = useState(() => AIService.getInstance());
  const [providers, setProviders] = useState<Record<string, AIConfiguration>>({});
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'success' | 'error' | null>>({});
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [trialStatus, setTrialStatus] = useState<{
    isTrialMode: boolean;
    remainingRequests: number;
    totalRequests: number;
  }>({ isTrialMode: false, remainingRequests: 0, totalRequests: 5 });
  const [ollamaStatus, setOllamaStatus] = useState<{
    isRunning: boolean;
    hasModels: boolean;
    availableModels: string[];
    checking: boolean;
  }>({ isRunning: false, hasModels: false, availableModels: [], checking: false });


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
      models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemma-3-27b-it', 'gemma-3-12b-it', 'gemma-3-4b-it'],
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
      models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'meta-llama/llama-4-maverick-17b-128e-instruct', 'meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen/qwen3-32b', 'deepseek-r1-distill-llama-70b', 'gemma2-9b-it', 'moonshotai/kimi-k2-instruct', 'compound-beta', 'compound-beta-mini'],
      defaultModel: 'openai/gpt-oss-20b',
      apiKeyPlaceholder: 'gsk_...',
      website: 'https://console.groq.com/keys'
    },
    sambanova: {
      name: 'SambaNova',
      description: 'DeepSeek, Llama, and Qwen models including reasoning variants',
      models: ['DeepSeek-V3.1', 'Meta-Llama-3.1-8B-Instruct', 'Meta-Llama-3.1-70B-Instruct', 'Meta-Llama-3.1-405B-Instruct', 'Llama-3.2-1B-Instruct', 'Llama-3.2-3B-Instruct', 'Llama-3.2-11B-Vision-Instruct', 'Llama-3.2-90B-Vision-Instruct', 'DeepSeek-V3-0324', 'Llama-3.3-Swallow-70B-Instruct-v0.4', 'Meta-Llama-3.3-70B-Instruct', 'DeepSeek-R1-0528', 'DeepSeek-R1-Distill-Llama-70B', 'Qwen3-32B'],
      defaultModel: 'DeepSeek-V3.1',
      apiKeyPlaceholder: 'fad7da1c-...',
      website: 'https://cloud.sambanova.ai/'
    },
    ollama: {
      name: 'Ollama (Local)',
      description: 'Local AI models via Ollama',
      models: ['llama3.2', 'llama3.1', 'codellama', 'mistral'],
      defaultModel: 'llama3.2',
      apiKeyPlaceholder: 'Not required for local',
      website: 'https://ollama.ai'
    },
    // 'gpt-oss-offline': {
    //   name: 'GPT-OSS Offline',
    //   description: 'GPT-OSS models via local Ollama',
    //   models: ['gpt-oss-120b', 'gpt-oss-20b'],
    //   defaultModel: 'gpt-oss-20b',
    //   apiKeyPlaceholder: 'Not required for local',
    //   website: 'https://ollama.ai'
    // }
  };

  useEffect(() => {
    loadSettings();
    loadTrialStatus();
  }, []);

  useEffect(() => {
    if (selectedProvider === 'gpt-oss-offline') {
      checkOllamaStatus();
    }
  }, [selectedProvider]);

  const loadTrialStatus = async () => {
    try {
      const isTrialMode = await TrialService.shouldUseTrialMode();
      const remainingRequests = await TrialService.getRemainingTrialRequests();

      setTrialStatus({
        isTrialMode,
        remainingRequests,
        totalRequests: 5
      });
    } catch (error) {
      console.error('Failed to load trial status:', error);
    }
  };

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
    // If user is entering their own key, clear trial data
    if (field === 'apiKey' && value.trim() !== '' && trialStatus.isTrialMode) {
      await TrialService.clearTrialData();
      await loadTrialStatus();
    }

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
    // Simple provider selection - just update the config
    try {
      const configManager = ConfigManager.getInstance();
      await configManager.setCurrentProvider(providerId);
      setSelectedProvider(providerId);
      console.log(`Selected provider: ${providerId}`);
    } catch (error) {
      console.error('Failed to select provider:', error);
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

  const checkOllamaStatus = async () => {
    setOllamaStatus(prev => ({ ...prev, checking: true }));

    try {
      // Check if Ollama is running
      const response = await fetch('http://localhost:11434/api/tags');
      const isRunning = response.ok;

      if (isRunning) {
        const data = await response.json();
        const models = data.models || [];
        const gptOssModels = models.filter((m: any) =>
          m.name.includes('gpt-oss') || m.name.includes('gpt_oss')
        );

        setOllamaStatus({
          isRunning: true,
          hasModels: gptOssModels.length > 0,
          availableModels: gptOssModels.map((m: any) => m.name),
          checking: false
        });
      } else {
        setOllamaStatus({
          isRunning: false,
          hasModels: false,
          availableModels: [],
          checking: false
        });
      }
    } catch (error) {
      setOllamaStatus({
        isRunning: false,
        hasModels: false,
        availableModels: [],
        checking: false
      });
    }
  };

  const getFilteredProviders = () => {
    return availableProviders;
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
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-2 text-sm font-medium rounded-lg ${activeTab === 'appearance'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`px-3 py-2 text-sm font-medium rounded-lg ${activeTab === 'providers'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            AI Providers
          </button>
          <button
            onClick={() => setActiveTab('network')}
            className={`px-3 py-2 text-sm font-medium rounded-lg ${activeTab === 'network'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            Connectivity
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'providers' && (
          <div className="space-y-6">
            {Object.entries(getFilteredProviders()).map(([providerId, providerInfo]) => {
              const config = providers[providerId] || { provider: providerId, apiKey: '', model: providerInfo.defaultModel };
              const isSelected = selectedProvider === providerId;
              const status = connectionStatus[providerId];

              return (
                <div
                  key={providerId}
                  className={`border rounded-lg p-4 ${isSelected
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

                        className="h-4 w-4 text-blue-600 disabled:opacity-50"
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
                            placeholder={trialStatus.isTrialMode && providerId === 'gemini' && !config.apiKey ? `Enter your Gemini API key (${trialStatus.remainingRequests}/5 trial requests left)` : providerInfo.apiKeyPlaceholder}
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
                          disabled={(!config.apiKey && !(trialStatus.isTrialMode && providerId === 'gemini')) || testingConnection === providerId}
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

            {/* Ollama Setup Checklist - Show when offline provider is selected */}
            {selectedProvider === 'gpt-oss-offline' && (
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    🛠️ Ollama Setup Checklist
                  </h3>
                  <button
                    onClick={checkOllamaStatus}
                    disabled={ollamaStatus.checking}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {ollamaStatus.checking ? 'Checking...' : 'Check Status'}
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className={ollamaStatus.isRunning ? 'text-green-600' : 'text-red-600'}>
                      {ollamaStatus.isRunning ? '✓' : '✗'}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Ollama server running on http://localhost:11434
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={ollamaStatus.hasModels ? 'text-green-600' : 'text-red-600'}>
                      {ollamaStatus.hasModels ? '✓' : '✗'}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      GPT-OSS models installed
                    </span>
                  </div>

                  {ollamaStatus.availableModels.length > 0 && (
                    <div className="ml-6 text-xs text-gray-600 dark:text-gray-400">
                      Available: {ollamaStatus.availableModels.join(', ')}
                    </div>
                  )}
                </div>

                {!ollamaStatus.isRunning && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-700">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                      Setup Required:
                    </p>
                    <ol className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 ml-4 list-decimal">
                      <li>Install Ollama from <a href="https://ollama.ai" target="_blank" className="underline">ollama.ai</a></li>
                      <li>Start Ollama application</li>
                      <li>Run: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">ollama pull gpt-oss-20b</code></li>
                      <li>Run: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">ollama pull gpt-oss-120b</code></li>
                      <li>Click "Check Status" to verify</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* Trial Status Display */}
            {trialStatus.isTrialMode && (
              <div className="mt-2 text-center">
                <p className="text-xs font-medium">
                  {trialStatus.remainingRequests <= 0 ? (
                    <span className="text-red-600 dark:text-red-400">☹️ Trial mode: You've used up all your trial requests</span>
                  ) : (
                    <span className={trialStatus.remainingRequests <= 2 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                      🎁 Trial mode: {trialStatus.remainingRequests}/{trialStatus.totalRequests} trial requests remaining
                    </span>
                  )}
                </p>
                {trialStatus.remainingRequests <= 2 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    <span className="font-medium">To continue using Delight, please set up your own API key in Settings.</span><br />
                    <a className="underline" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                      Google Gemini has a free tier of up to 1,500 requests per day.
                    </a>
                  </p>
                )}
              </div>
            )}
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
          </div>
        )}

        {activeTab === 'network' && (
          <NetworkStatusPanel aiService={aiService} />
        )}
      </div>

      {/* Global Footer - Always visible */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="space-y-4">
          {/* Links */}
          <div className="flex flex-wrap items-center justify-center space-x-6 text-xs text-gray-500 dark:text-gray-400">
            <button
              onClick={() => {
                chrome.tabs.create({
                  url: chrome.runtime.getURL('src/pages/updates/index.html'),
                  active: true
                });
              }}
              className="hover:text-blue-500 transition-colors"
            >
              What's New?
            </button>
            <button
              onClick={() => {
                chrome.tabs.create({
                  url: chrome.runtime.getURL('src/pages/userguide/index.html'),
                  active: true
                });
              }}
              className="hover:text-blue-500 transition-colors"
            >
              User Guide
            </button>
            <button
              onClick={() => {
                chrome.tabs.create({
                  url: chrome.runtime.getURL('src/pages/privacy/index.html'),
                  active: true
                });
              }}
              className="hover:text-blue-500 transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => {
                chrome.tabs.create({
                  url: 'mailto:andrewsankomahene@gmail.com',
                  active: true
                });
              }}
              className="hover:text-blue-500 transition-colors"
            >
              Support
            </button>
            {/* <button
              onClick={() => {
                chrome.tabs.create({
                  url: 'https://github.com/kwesinavilot/delight',
                  active: true
                });
              }}
              className="hover:text-blue-500 transition-colors"
            >
              GitHub
            </button> */}
            {/* <button
              onClick={() => {
                chrome.tabs.create({
                  url: 'https://github.com/kwesinavilot/delight/issues',
                  active: true
                });
              }}
              className="hover:text-blue-500 transition-colors"
            >
              Support
            </button> */}
          </div>

          {/* Version and Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 space-y-0">
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Delight v1.4.2</span>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default SettingsPanel;