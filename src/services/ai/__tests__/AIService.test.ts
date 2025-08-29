import { AIService } from '../AIService';
import { ConfigManager } from '../../config/ConfigManager';
import { AIError, AIErrorType } from '../../../types/ai';

// Mock the providers
jest.mock('../providers/OpenAIProvider');
jest.mock('../providers/AnthropicProvider');
jest.mock('../../config/ConfigManager');

const mockConfigManager = {
  initialize: jest.fn(),
  getCurrentProvider: jest.fn(),
  getProviderConfig: jest.fn(),
  setCurrentProvider: jest.fn()
};

const mockProvider = {
  name: 'test-provider',
  isConfigured: jest.fn(),
  generateResponse: jest.fn(),
  generateSummary: jest.fn()
};

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    // Reset singleton
    (AIService as any).instance = null;
    aiService = AIService.getInstance();
    
    // Mock ConfigManager
    (ConfigManager.getInstance as jest.Mock).mockReturnValue(mockConfigManager);
    
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AIService.getInstance();
      const instance2 = AIService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid configuration', async () => {
      mockConfigManager.initialize.mockResolvedValue(undefined);
      mockConfigManager.getCurrentProvider.mockResolvedValue('openai');
      mockConfigManager.getProviderConfig.mockResolvedValue({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo'
      });

      await expect(aiService.initialize()).resolves.not.toThrow();
      expect(mockConfigManager.initialize).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockConfigManager.initialize.mockRejectedValue(new Error('Config error'));

      await expect(aiService.initialize()).rejects.toThrow(AIError);
    });
  });

  describe('Provider Management', () => {
    beforeEach(async () => {
      mockConfigManager.initialize.mockResolvedValue(undefined);
      mockConfigManager.getCurrentProvider.mockResolvedValue('openai');
      mockConfigManager.getProviderConfig.mockResolvedValue({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo'
      });
    });

    it('should switch providers successfully', async () => {
      await aiService.initialize();
      
      // Mock the provider as configured
      const mockOpenAIProvider = { ...mockProvider, name: 'openai', isConfigured: () => true };
      (aiService as any).providers.set('openai', mockOpenAIProvider);
      
      await aiService.switchProvider('openai');
      expect(mockConfigManager.setCurrentProvider).toHaveBeenCalledWith('openai');
    });

    it('should throw error when switching to unconfigured provider', async () => {
      await aiService.initialize();
      
      const mockUnconfiguredProvider = { ...mockProvider, name: 'openai', isConfigured: () => false };
      (aiService as any).providers.set('openai', mockUnconfiguredProvider);
      
      await expect(aiService.switchProvider('openai')).rejects.toThrow(AIError);
    });

    it('should throw error when switching to non-existent provider', async () => {
      await aiService.initialize();
      
      await expect(aiService.switchProvider('nonexistent')).rejects.toThrow(AIError);
    });
  });

  describe('Chat Response Generation', () => {
    beforeEach(async () => {
      mockConfigManager.initialize.mockResolvedValue(undefined);
      mockConfigManager.getCurrentProvider.mockResolvedValue('openai');
      mockConfigManager.getProviderConfig.mockResolvedValue({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo'
      });
      
      await aiService.initialize();
      
      const mockConfiguredProvider = { 
        ...mockProvider, 
        name: 'openai', 
        isConfigured: () => true 
      };
      (aiService as any).currentProvider = mockConfiguredProvider;
    });

    it('should generate chat response successfully', async () => {
      const mockResponse = ['Hello', ' there', '!'];
      const mockAsyncIterable = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of mockResponse) {
            yield chunk;
          }
        }
      };
      
      (aiService as any).currentProvider.generateResponse.mockResolvedValue(mockAsyncIterable);
      
      const response = await aiService.generateChatResponse('Hello');
      expect(response).toBe('Hello there!');
    });

    it('should handle streaming with onChunk callback', async () => {
      const mockResponse = ['Hello', ' there', '!'];
      const mockAsyncIterable = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of mockResponse) {
            yield chunk;
          }
        }
      };
      
      (aiService as any).currentProvider.generateResponse.mockResolvedValue(mockAsyncIterable);
      
      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);
      
      const response = await aiService.generateChatResponse('Hello', onChunk);
      
      expect(response).toBe('Hello there!');
      expect(chunks).toEqual(['Hello', ' there', '!']);
    });

    it('should throw error when no provider is configured', async () => {
      (aiService as any).currentProvider = null;
      
      await expect(aiService.generateChatResponse('Hello')).rejects.toThrow(AIError);
    });

    it('should handle provider errors', async () => {
      (aiService as any).currentProvider.generateResponse.mockRejectedValue(new Error('API Error'));
      
      await expect(aiService.generateChatResponse('Hello')).rejects.toThrow(AIError);
    });
  });

  describe('Summary Generation', () => {
    beforeEach(async () => {
      mockConfigManager.initialize.mockResolvedValue(undefined);
      mockConfigManager.getCurrentProvider.mockResolvedValue('openai');
      mockConfigManager.getProviderConfig.mockResolvedValue({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo'
      });
      
      await aiService.initialize();
      
      const mockConfiguredProvider = { 
        ...mockProvider, 
        name: 'openai', 
        isConfigured: () => true 
      };
      (aiService as any).currentProvider = mockConfiguredProvider;
    });

    it('should generate summary successfully', async () => {
      const mockSummary = 'This is a test summary';
      (aiService as any).currentProvider.generateSummary.mockResolvedValue(mockSummary);
      
      const summary = await aiService.generatePageSummary('Test content', 'short');
      expect(summary).toBe(mockSummary);
      expect((aiService as any).currentProvider.generateSummary).toHaveBeenCalledWith('Test content', 'short');
    });

    it('should throw error when no provider is configured', async () => {
      (aiService as any).currentProvider = null;
      
      await expect(aiService.generatePageSummary('content', 'short')).rejects.toThrow(AIError);
    });
  });

  describe('Provider Information', () => {
    beforeEach(async () => {
      mockConfigManager.initialize.mockResolvedValue(undefined);
      mockConfigManager.getCurrentProvider.mockResolvedValue('openai');
      mockConfigManager.getProviderConfig.mockResolvedValue({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo'
      });
      
      await aiService.initialize();
    });

    it('should return current provider name', () => {
      const mockCurrentProvider = { ...mockProvider, name: 'openai' };
      (aiService as any).currentProvider = mockCurrentProvider;
      
      expect(aiService.getCurrentProviderName()).toBe('openai');
    });

    it('should return null when no current provider', () => {
      (aiService as any).currentProvider = null;
      
      expect(aiService.getCurrentProviderName()).toBeNull();
    });

    it('should check if current provider is configured', () => {
      const mockCurrentProvider = { ...mockProvider, name: 'openai', isConfigured: () => true };
      (aiService as any).currentProvider = mockCurrentProvider;
      
      expect(aiService.isCurrentProviderConfigured()).toBe(true);
    });

    it('should return available providers', () => {
      (aiService as any).providers.set('openai', mockProvider);
      (aiService as any).providers.set('anthropic', mockProvider);
      
      const providers = aiService.getAvailableProviders();
      expect(providers).toEqual(['openai', 'anthropic']);
    });
  });

  describe('Provider Testing', () => {
    beforeEach(async () => {
      mockConfigManager.initialize.mockResolvedValue(undefined);
      mockConfigManager.getCurrentProvider.mockResolvedValue('openai');
      mockConfigManager.getProviderConfig.mockResolvedValue({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo'
      });
      
      await aiService.initialize();
    });

    it('should test provider connectivity successfully', async () => {
      const mockAsyncIterable = {
        async *[Symbol.asyncIterator]() {
          yield 'OK';
        }
      };
      
      const mockTestProvider = { 
        ...mockProvider, 
        name: 'openai', 
        isConfigured: () => true,
        generateResponse: jest.fn().mockResolvedValue(mockAsyncIterable)
      };
      (aiService as any).currentProvider = mockTestProvider;
      
      const result = await aiService.testProvider();
      expect(result).toBe(true);
    });

    it('should return false for unconfigured provider', async () => {
      const mockUnconfiguredProvider = { 
        ...mockProvider, 
        name: 'openai', 
        isConfigured: () => false 
      };
      (aiService as any).currentProvider = mockUnconfiguredProvider;
      
      const result = await aiService.testProvider();
      expect(result).toBe(false);
    });
  });
});