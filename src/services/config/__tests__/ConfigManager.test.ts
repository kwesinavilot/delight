import { ConfigManager } from '../ConfigManager';
import { AIConfiguration } from '../../../types/ai';

// Mock Chrome storage API
const mockStorage = {
  sync: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn()
  }
};

// @ts-ignore
global.chrome = {
  storage: mockStorage,
  runtime: {
    lastError: null
  }
};

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    // Reset singleton instance
    (ConfigManager as any).instance = null;
    configManager = ConfigManager.getInstance();
    
    // Reset mocks
    jest.clearAllMocks();
    mockStorage.sync.get.mockImplementation((keys, callback) => {
      callback({});
    });
    mockStorage.sync.set.mockImplementation((items, callback) => {
      callback();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize with default settings when no stored settings exist', async () => {
      mockStorage.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });

      await configManager.initialize();
      const currentProvider = await configManager.getCurrentProvider();
      
      expect(currentProvider).toBe('openai');
    });

    it('should load existing settings from storage', async () => {
      const existingSettings = {
        aiSettings: {
          ai: {
            currentProvider: 'anthropic',
            providers: {
              openai: { apiKey: 'test-key', model: 'gpt-4', maxTokens: 2000, temperature: 0.5 },
              anthropic: { apiKey: 'test-key-2', model: 'claude-3-opus-20240229', maxTokens: 1500, temperature: 0.8 }
            }
          }
        }
      };

      mockStorage.sync.get.mockImplementation((keys, callback) => {
        callback(existingSettings);
      });

      await configManager.initialize();
      const currentProvider = await configManager.getCurrentProvider();
      
      expect(currentProvider).toBe('anthropic');
    });
  });

  describe('Provider Management', () => {
    beforeEach(async () => {
      mockStorage.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });
      await configManager.initialize();
    });

    it('should get current provider', async () => {
      const provider = await configManager.getCurrentProvider();
      expect(provider).toBe('openai');
    });

    it('should set current provider', async () => {
      await configManager.setCurrentProvider('anthropic');
      const provider = await configManager.getCurrentProvider();
      expect(provider).toBe('anthropic');
      expect(mockStorage.sync.set).toHaveBeenCalled();
    });

    it('should throw error when setting invalid provider', async () => {
      await expect(configManager.setCurrentProvider('invalid')).rejects.toThrow('Provider invalid is not configured');
    });

    it('should get available providers', async () => {
      const providers = await configManager.getAvailableProviders();
      expect(providers).toEqual(['openai', 'anthropic']);
    });
  });

  describe('Provider Configuration', () => {
    beforeEach(async () => {
      mockStorage.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });
      await configManager.initialize();
    });

    it('should get provider config', async () => {
      const config = await configManager.getProviderConfig('openai');
      
      expect(config).toEqual({
        provider: 'openai',
        apiKey: '',
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.7
      });
    });

    it('should get current provider config', async () => {
      const config = await configManager.getCurrentProviderConfig();
      expect(config.provider).toBe('openai');
    });

    it('should update provider config', async () => {
      const updates: Partial<AIConfiguration> = {
        apiKey: 'new-api-key',
        model: 'gpt-4',
        maxTokens: 2000
      };

      await configManager.updateProviderConfig('openai', updates);
      const config = await configManager.getProviderConfig('openai');

      expect(config.apiKey).toBe('new-api-key');
      expect(config.model).toBe('gpt-4');
      expect(config.maxTokens).toBe(2000);
      expect(config.temperature).toBe(0.7); // Should remain unchanged
      expect(mockStorage.sync.set).toHaveBeenCalled();
    });

    it('should check if provider is configured', async () => {
      let isConfigured = await configManager.isProviderConfigured('openai');
      expect(isConfigured).toBe(false); // No API key set

      await configManager.updateProviderConfig('openai', { apiKey: 'test-key' });
      isConfigured = await configManager.isProviderConfigured('openai');
      expect(isConfigured).toBe(true);
    });

    it('should validate current provider', async () => {
      let isValid = await configManager.validateCurrentProvider();
      expect(isValid).toBe(false);

      await configManager.updateProviderConfig('openai', { apiKey: 'test-key' });
      isValid = await configManager.validateCurrentProvider();
      expect(isValid).toBe(true);
    });
  });

  describe('Settings Management', () => {
    beforeEach(async () => {
      mockStorage.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });
      await configManager.initialize();
    });

    it('should clear all settings', async () => {
      await configManager.clearAllSettings();
      expect(mockStorage.sync.remove).toHaveBeenCalledWith(['aiSettings']);
    });

    it('should export settings without API keys', async () => {
      await configManager.updateProviderConfig('openai', { apiKey: 'secret-key' });
      const exported = await configManager.exportSettings();
      const parsedExport = JSON.parse(exported);
      
      expect(parsedExport.ai.providers.openai.apiKey).toBe('');
      expect(parsedExport.ai.providers.openai.model).toBe('gpt-3.5-turbo');
    });

    it('should import settings while preserving existing API keys', async () => {
      // Set up existing config with API key
      await configManager.updateProviderConfig('openai', { apiKey: 'existing-key' });
      
      const importData = {
        ai: {
          currentProvider: 'anthropic',
          providers: {
            openai: { apiKey: '', model: 'gpt-4', maxTokens: 2000, temperature: 0.5 },
            anthropic: { apiKey: 'new-key', model: 'claude-3-opus-20240229', maxTokens: 1500, temperature: 0.8 }
          }
        }
      };

      await configManager.importSettings(JSON.stringify(importData));
      
      const openaiConfig = await configManager.getProviderConfig('openai');
      const anthropicConfig = await configManager.getProviderConfig('anthropic');
      
      expect(openaiConfig.apiKey).toBe('existing-key'); // Preserved
      expect(openaiConfig.model).toBe('gpt-4'); // Updated
      expect(anthropicConfig.apiKey).toBe('new-key'); // New key
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockStorage.sync.get.mockImplementation((keys, callback) => {
        chrome.runtime.lastError = { message: 'Storage error' };
        callback({});
      });

      await configManager.initialize();
      const provider = await configManager.getCurrentProvider();
      expect(provider).toBe('openai'); // Should fall back to defaults
    });

    it('should handle invalid JSON in import', async () => {
      await expect(configManager.importSettings('invalid json')).rejects.toThrow('Failed to import configuration');
    });
  });
});