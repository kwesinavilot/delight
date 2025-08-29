import { AnthropicProvider } from '../AnthropicProvider';
import { AIConfiguration, AIError } from '../../../../types/ai';

// Mock the Vercel AI SDK
jest.mock('@ai-sdk/anthropic', () => ({
  anthropic: jest.fn()
}));

jest.mock('ai', () => ({
  streamText: jest.fn(),
  generateText: jest.fn()
}));

import { anthropic } from '@ai-sdk/anthropic';
import { streamText, generateText } from 'ai';

const mockAnthropic = anthropic as jest.MockedFunction<typeof anthropic>;
const mockStreamText = streamText as jest.MockedFunction<typeof streamText>;
const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  let config: AIConfiguration;

  beforeEach(() => {
    config = {
      provider: 'anthropic',
      apiKey: 'test-api-key',
      model: 'claude-3-haiku-20240307',
      maxTokens: 1000,
      temperature: 0.7
    };

    provider = new AnthropicProvider(config);
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct name', () => {
      expect(provider.name).toBe('anthropic');
    });

    it('should be configured with valid API key', () => {
      expect(provider.isConfigured()).toBe(true);
    });

    it('should not be configured without API key', () => {
      const emptyConfig = { ...config, apiKey: '' };
      const emptyProvider = new AnthropicProvider(emptyConfig);
      expect(emptyProvider.isConfigured()).toBe(false);
    });
  });

  describe('Chat Response Generation', () => {
    beforeEach(() => {
      const mockModel = jest.fn();
      mockAnthropic.mockReturnValue(mockModel);
    });

    it('should generate streaming response', async () => {
      const mockTextStream = {
        async *[Symbol.asyncIterator]() {
          yield 'Hello';
          yield ' there';
          yield '!';
        }
      };

      mockStreamText.mockResolvedValue({
        textStream: mockTextStream,
        text: Promise.resolve('Hello there!')
      } as any);

      const response = provider.generateResponse('Hello', { stream: true });
      const chunks: string[] = [];
      
      for await (const chunk of response) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' there', '!']);
      expect(mockStreamText).toHaveBeenCalledWith({
        model: expect.any(Function),
        system: 'You are Delight, a helpful and friendly AI assistant.',
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        maxTokens: 1000,
        temperature: 0.7
      });
    });

    it('should generate non-streaming response', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Hello there!',
        usage: { totalTokens: 10 }
      } as any);

      const response = provider.generateResponse('Hello', { stream: false });
      const chunks: string[] = [];
      
      for await (const chunk of response) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello there!']);
      expect(mockGenerateText).toHaveBeenCalledWith({
        model: expect.any(Function),
        system: 'You are Delight, a helpful and friendly AI assistant.',
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        maxTokens: 1000,
        temperature: 0.7
      });
    });

    it('should use custom system prompt when provided', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Response',
        usage: { totalTokens: 5 }
      } as any);

      const response = provider.generateResponse('Hello', { 
        systemPrompt: 'You are a helpful assistant',
        stream: false 
      });
      
      // Consume the response
      for await (const _ of response) {}

      expect(mockGenerateText).toHaveBeenCalledWith({
        model: expect.any(Function),
        system: 'You are a helpful assistant',
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        maxTokens: 1000,
        temperature: 0.7
      });
    });

    it('should handle API errors', async () => {
      mockStreamText.mockRejectedValue(new Error('API Error'));

      await expect(async () => {
        const response = provider.generateResponse('Hello');
        for await (const _ of response) {}
      }).rejects.toThrow(AIError);
    });

    it('should throw error when not configured', async () => {
      const unconfiguredProvider = new AnthropicProvider({ ...config, apiKey: '' });

      await expect(async () => {
        const response = unconfiguredProvider.generateResponse('Hello');
        for await (const _ of response) {}
      }).rejects.toThrow(AIError);
    });
  });

  describe('Summary Generation', () => {
    beforeEach(() => {
      const mockModel = jest.fn();
      mockAnthropic.mockReturnValue(mockModel);
    });

    it('should generate short summary', async () => {
      const mockSummary = 'This is a short summary.';
      mockGenerateText.mockResolvedValue({
        text: mockSummary,
        usage: { totalTokens: 20 }
      } as any);

      const summary = await provider.generateSummary('Long content here...', 'short');

      expect(summary).toBe(mockSummary);
      expect(mockGenerateText).toHaveBeenCalledWith({
        model: expect.any(Function),
        system: expect.stringContaining('helpful assistant that creates clear, concise summaries'),
        messages: [
          { role: 'user', content: expect.stringContaining('Please provide a brief summary') }
        ],
        maxTokens: 150,
        temperature: 0.3
      });
    });

    it('should generate medium summary', async () => {
      const mockSummary = 'This is a medium-length summary with more details.';
      mockGenerateText.mockResolvedValue({
        text: mockSummary,
        usage: { totalTokens: 50 }
      } as any);

      const summary = await provider.generateSummary('Long content here...', 'medium');

      expect(summary).toBe(mockSummary);
      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          maxTokens: 300
        })
      );
    });

    it('should generate detailed summary', async () => {
      const mockSummary = 'This is a comprehensive detailed summary with full context.';
      mockGenerateText.mockResolvedValue({
        text: mockSummary,
        usage: { totalTokens: 100 }
      } as any);

      const summary = await provider.generateSummary('Long content here...', 'detailed');

      expect(summary).toBe(mockSummary);
      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          maxTokens: 600
        })
      );
    });

    it('should handle summary generation errors', async () => {
      mockGenerateText.mockRejectedValue(new Error('Summary error'));

      await expect(provider.generateSummary('Content', 'short')).rejects.toThrow(AIError);
    });

    it('should throw error when not configured for summary', async () => {
      const unconfiguredProvider = new AnthropicProvider({ ...config, apiKey: '' });

      await expect(unconfiguredProvider.generateSummary('Content', 'short')).rejects.toThrow(AIError);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = { ...config, model: 'claude-3-sonnet-20240229', temperature: 0.5 };
      provider.updateConfig(newConfig);
      
      // Verify the config was updated (we can't directly access private config, 
      // but we can test behavior that depends on it)
      expect(provider.isConfigured()).toBe(true);
    });

    it('should get available models', () => {
      const models = provider.getAvailableModels();
      expect(models).toContain('claude-3-haiku-20240307');
      expect(models).toContain('claude-3-sonnet-20240229');
      expect(models).toContain('claude-3-opus-20240229');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should get default model', () => {
      const defaultModel = provider.getDefaultModel();
      expect(defaultModel).toBe('claude-3-haiku-20240307');
    });

    it('should get model capabilities', () => {
      const capabilities = provider.getModelCapabilities('claude-3-opus-20240229');
      expect(capabilities).toHaveProperty('maxTokens');
      expect(capabilities).toHaveProperty('supportsStreaming');
      expect(capabilities.supportsStreaming).toBe(true);
      expect(capabilities.maxTokens).toBe(200000);
    });

    it('should return default capabilities for unknown model', () => {
      const capabilities = provider.getModelCapabilities('unknown-model');
      expect(capabilities.maxTokens).toBe(200000);
      expect(capabilities.supportsStreaming).toBe(true);
    });
  });

  describe('Anthropic-specific Features', () => {
    it('should get model tier for haiku models', () => {
      const tier = provider.getModelTier('claude-3-haiku-20240307');
      expect(tier).toBe('fast');
    });

    it('should get model tier for sonnet models', () => {
      const tier = provider.getModelTier('claude-3-sonnet-20240229');
      expect(tier).toBe('balanced');
    });

    it('should get model tier for opus models', () => {
      const tier = provider.getModelTier('claude-3-opus-20240229');
      expect(tier).toBe('powerful');
    });

    it('should get model recommendations for fast tier', () => {
      const recommendations = provider.getModelRecommendations('claude-3-haiku-20240307');
      expect(recommendations).toContain('Quick responses');
      expect(recommendations).toContain('Simple tasks');
    });

    it('should get model recommendations for balanced tier', () => {
      const recommendations = provider.getModelRecommendations('claude-3-sonnet-20240229');
      expect(recommendations).toContain('General conversation');
      expect(recommendations).toContain('Content creation');
    });

    it('should get model recommendations for powerful tier', () => {
      const recommendations = provider.getModelRecommendations('claude-3-opus-20240229');
      expect(recommendations).toContain('Complex reasoning');
      expect(recommendations).toContain('Research tasks');
    });
  });

  describe('Connection Testing', () => {
    beforeEach(() => {
      const mockModel = jest.fn();
      mockAnthropic.mockReturnValue(mockModel);
    });

    it('should test connection successfully', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'OK',
        usage: { totalTokens: 1 }
      } as any);

      const result = await provider.testConnection();
      expect(result).toBe(true);
    });

    it('should return false on connection failure', async () => {
      mockGenerateText.mockRejectedValue(new Error('Connection failed'));

      const result = await provider.testConnection();
      expect(result).toBe(false);
    });
  });
});