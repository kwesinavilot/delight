import { AIConfiguration, ExtensionSettings } from '../../types/ai';

export class ConfigManager {
  private static instance: ConfigManager;
  private settings: ExtensionSettings | null = null;

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  async initialize(): Promise<void> {
    await this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(['aiSettings']);
      this.settings = result.aiSettings || this.getDefaultSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  private getDefaultSettings(): ExtensionSettings {
    return {
      ai: {
        currentProvider: 'openai',
        providers: {
          openai: {
            apiKey: '',
            model: 'gpt-3.5-turbo',
            maxTokens: 1000,
            temperature: 0.7
          },
          anthropic: {
            apiKey: '',
            model: 'claude-3-haiku-20240307',
            maxTokens: 1000,
            temperature: 0.7
          },
          gemini: {
            apiKey: '',
            model: 'gemini-2.5-flash',
            maxTokens: 1000,
            temperature: 0.7
          },
          grok: {
            apiKey: '',
            model: 'grok-beta',
            maxTokens: 1000,
            temperature: 0.7
          },
          groq: {
            apiKey: '',
            model: 'openai/gpt-oss-20b',
            maxTokens: 1000,
            temperature: 0.7
          },
          sambanova: {
            apiKey: '',
            model: 'Meta-Llama-3.1-8B-Instruct',
            maxTokens: 1000,
            temperature: 0.7
          }
        }
      }
    };
  }

  async getCurrentProvider(): Promise<string> {
    if (!this.settings) await this.loadSettings();
    return this.settings!.ai.currentProvider;
  }

  async setCurrentProvider(provider: string): Promise<void> {
    if (!this.settings) await this.loadSettings();
    
    if (!this.settings!.ai.providers[provider]) {
      throw new Error(`Provider ${provider} is not configured`);
    }
    
    this.settings!.ai.currentProvider = provider;
    await this.saveSettings();
  }

  async getProviderConfig(provider: string): Promise<AIConfiguration> {
    if (!this.settings) await this.loadSettings();
    
    let providerSettings = this.settings!.ai.providers[provider];
    
    // If provider doesn't exist, create default settings
    if (!providerSettings) {
      const defaultSettings = this.getDefaultProviderSettings(provider);
      this.settings!.ai.providers[provider] = defaultSettings;
      providerSettings = defaultSettings;
      // Save the updated settings
      try {
        await this.saveSettings();
      } catch (error) {
        console.warn('Failed to save default provider settings:', error);
      }
    }

    return {
      provider,
      apiKey: providerSettings.apiKey,
      model: providerSettings.model,
      maxTokens: providerSettings.maxTokens,
      temperature: providerSettings.temperature
    };
  }

  private getDefaultProviderSettings(provider: string) {
    const modelDefaults: Record<string, string> = {
      openai: 'gpt-3.5-turbo',
      anthropic: 'claude-3-haiku-20240307',
      gemini: 'gemini-2.5-flash',
      grok: 'grok-beta',
      groq: 'openai/gpt-oss-20b',
      sambanova: 'Meta-Llama-3.1-8B-Instruct'
    };

    return {
      apiKey: '',
      model: modelDefaults[provider] || 'default-model',
      maxTokens: 1000,
      temperature: 0.7
    };
  }

  async getCurrentProviderConfig(): Promise<AIConfiguration> {
    const currentProvider = await this.getCurrentProvider();
    return this.getProviderConfig(currentProvider);
  }

  async updateProviderConfig(provider: string, config: Partial<AIConfiguration>): Promise<void> {
    if (!this.settings) await this.loadSettings();
    
    if (!this.settings!.ai.providers[provider]) {
      this.settings!.ai.providers[provider] = {
        apiKey: '',
        model: provider === 'openai' ? 'gpt-3.5-turbo' : 'claude-3-haiku-20240307',
        maxTokens: 1000,
        temperature: 0.7
      };
    }

    const providerSettings = this.settings!.ai.providers[provider];
    
    if (config.apiKey !== undefined) providerSettings.apiKey = config.apiKey;
    if (config.model !== undefined) providerSettings.model = config.model;
    if (config.maxTokens !== undefined) providerSettings.maxTokens = config.maxTokens;
    if (config.temperature !== undefined) providerSettings.temperature = config.temperature;

    await this.saveSettings();
  }

  async getAvailableProviders(): Promise<string[]> {
    if (!this.settings) await this.loadSettings();
    return Object.keys(this.settings!.ai.providers);
  }

  async isProviderConfigured(provider: string): Promise<boolean> {
    try {
      const config = await this.getProviderConfig(provider);
      return !!(config.apiKey && config.apiKey.trim());
    } catch {
      return false;
    }
  }

  async validateCurrentProvider(): Promise<boolean> {
    try {
      const currentProvider = await this.getCurrentProvider();
      return await this.isProviderConfigured(currentProvider);
    } catch {
      return false;
    }
  }

  private async saveSettings(): Promise<void> {
    if (!this.settings) return;
    
    try {
      await chrome.storage.sync.set({ aiSettings: this.settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error('Failed to save configuration');
    }
  }

  async clearAllSettings(): Promise<void> {
    try {
      await chrome.storage.sync.remove(['aiSettings']);
      this.settings = this.getDefaultSettings();
    } catch (error) {
      console.error('Failed to clear settings:', error);
      throw new Error('Failed to clear configuration');
    }
  }

  async exportSettings(): Promise<string> {
    if (!this.settings) await this.loadSettings();
    
    // Create a copy without sensitive data for export
    const exportData = JSON.parse(JSON.stringify(this.settings));
    
    // Remove API keys from export
    Object.keys(exportData.ai.providers).forEach(provider => {
      exportData.ai.providers[provider].apiKey = '';
    });
    
    return JSON.stringify(exportData, null, 2);
  }

  async importSettings(settingsJson: string): Promise<void> {
    try {
      const importedSettings = JSON.parse(settingsJson) as ExtensionSettings;
      
      // Validate the structure
      if (!importedSettings.ai || !importedSettings.ai.providers) {
        throw new Error('Invalid settings format');
      }
      
      // Preserve existing API keys if not provided in import
      if (this.settings) {
        Object.keys(importedSettings.ai.providers).forEach(provider => {
          if (!importedSettings.ai.providers[provider].apiKey && 
              this.settings!.ai.providers[provider]?.apiKey) {
            importedSettings.ai.providers[provider].apiKey = 
              this.settings!.ai.providers[provider].apiKey;
          }
        });
      }
      
      this.settings = importedSettings;
      await this.saveSettings();
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw new Error('Failed to import configuration');
    }
  }

  // Methods required by SettingsPanel
  async getAllConfigurations(): Promise<Record<string, AIConfiguration>> {
    if (!this.settings) await this.loadSettings();
    
    const configurations: Record<string, AIConfiguration> = {};
    
    Object.entries(this.settings!.ai.providers).forEach(([provider, config]) => {
      configurations[provider] = {
        provider,
        apiKey: config.apiKey,
        model: config.model,
        maxTokens: config.maxTokens,
        temperature: config.temperature
      };
    });
    
    return configurations;
  }

  async setConfiguration(provider: string, config: AIConfiguration): Promise<void> {
    await this.updateProviderConfig(provider, config);
  }

  async testConnection(provider: string): Promise<boolean> {
    try {
      // Import AIService to test connection
      const { AIService } = await import('../ai/AIService');
      const aiService = AIService.getInstance();
      
      // Get the provider config
      const config = await this.getProviderConfig(provider);
      
      // Test the connection using the AI service
      return await aiService.testProviderConnection(provider, config);
    } catch (error) {
      console.error(`Failed to test connection for ${provider}:`, error);
      return false;
    }
  }
}