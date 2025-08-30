/**
 * AI Service Diagnostics
 * 
 * Run this script in the browser console to diagnose AI service configuration issues.
 * Copy and paste this entire script into the console when the extension is loaded.
 */

(async function runAIDiagnostics() {
  console.log('🔍 AI Service Diagnostics');
  console.log('========================');

  try {
    // Check Chrome storage
    console.log('\n📦 Checking Chrome Storage...');
    const storageResult = await chrome.storage.sync.get(['aiSettings']);
    console.log('Raw storage data:', storageResult);

    if (storageResult.aiSettings) {
      console.log('✅ AI settings found in storage');
      console.log('Current provider:', storageResult.aiSettings.ai.currentProvider);
      
      // Check each provider configuration (without exposing API keys)
      Object.entries(storageResult.aiSettings.ai.providers).forEach(([name, config]) => {
        const hasApiKey = !!(config.apiKey && config.apiKey.trim());
        console.log(`${hasApiKey ? '✅' : '❌'} ${name}: ${hasApiKey ? 'Configured' : 'No API key'} (Model: ${config.model})`);
      });
    } else {
      console.log('❌ No AI settings found in storage');
    }

    // Test ConfigManager
    console.log('\n⚙️  Testing ConfigManager...');
    try {
      // Import ConfigManager
      const { ConfigManager } = await import('../services/config/ConfigManager.js');
      const configManager = ConfigManager.getInstance();
      
      await configManager.initialize();
      console.log('✅ ConfigManager initialized successfully');
      
      const currentProvider = await configManager.getCurrentProvider();
      console.log('Current provider from ConfigManager:', currentProvider);
      
      const isCurrentConfigured = await configManager.validateCurrentProvider();
      console.log('Is current provider configured:', isCurrentConfigured);
      
      const availableProviders = await configManager.getAvailableProviders();
      console.log('Available providers:', availableProviders);
      
      // Check each provider
      for (const provider of availableProviders) {
        const isConfigured = await configManager.isProviderConfigured(provider);
        console.log(`${provider}: ${isConfigured ? 'Configured' : 'Not configured'}`);
      }
      
    } catch (error) {
      console.error('❌ ConfigManager error:', error);
    }

    // Test AIService
    console.log('\n🤖 Testing AIService...');
    try {
      // Import AIService
      const { AIService } = await import('../services/ai/AIService.js');
      const aiService = AIService.getInstance();
      
      console.log('Initializing AIService...');
      await aiService.initialize();
      console.log('✅ AIService initialized successfully');
      
      const currentProviderName = aiService.getCurrentProviderName();
      console.log('Current provider from AIService:', currentProviderName);
      
      const isCurrentConfigured = aiService.isCurrentProviderConfigured();
      console.log('Is current provider configured in AIService:', isCurrentConfigured);
      
      const availableProviders = aiService.getAvailableProviders();
      console.log('Available providers from AIService:', availableProviders);
      
      const configuredProviders = aiService.getConfiguredProviders();
      console.log('Configured providers from AIService:', configuredProviders);
      
      const isServiceReady = await aiService.validateCurrentConfiguration();
      console.log('Is AI service ready:', isServiceReady);
      
    } catch (error) {
      console.error('❌ AIService error:', error);
      console.log('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }

    // Test chat utilities
    console.log('\n💬 Testing Chat Utilities...');
    try {
      // Import chat utilities
      const { isAIServiceReady, initializeChatSession } = await import('../utils/chat.js');
      
      const serviceReady = await isAIServiceReady();
      console.log('Is AI service ready (from chat utils):', serviceReady);
      
      const chatSession = await initializeChatSession();
      console.log('Chat session initialized:', !!chatSession);
      
    } catch (error) {
      console.error('❌ Chat utilities error:', error);
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    
    if (!storageResult.aiSettings) {
      console.log('1. ❗ No AI settings found. Go to Settings and configure an AI provider.');
    } else {
      const providers = storageResult.aiSettings.ai.providers;
      const hasAnyConfigured = Object.values(providers).some(config => config.apiKey && config.apiKey.trim());
      
      if (!hasAnyConfigured) {
        console.log('1. ❗ No providers have API keys configured. Add an API key in Settings.');
      } else {
        console.log('1. ✅ At least one provider is configured.');
        
        const currentProvider = storageResult.aiSettings.ai.currentProvider;
        const currentConfig = providers[currentProvider];
        
        if (!currentConfig || !currentConfig.apiKey || !currentConfig.apiKey.trim()) {
          console.log('2. ❗ Current provider is not configured. Switch to a configured provider or add an API key.');
        } else {
          console.log('2. ✅ Current provider appears to be configured.');
          console.log('3. 🔄 Try refreshing the page or reloading the extension.');
        }
      }
    }

  } catch (error) {
    console.error('❌ Diagnostics failed:', error);
  }

  console.log('\n🏁 Diagnostics complete!');
})();