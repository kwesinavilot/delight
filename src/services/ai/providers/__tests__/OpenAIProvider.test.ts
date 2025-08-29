import { OpenAIProvider } from '../OpenAIProvider';
import { AIConfiguration, AIError } from '../../../../types/ai';

// Mock the Vercel AI SDK
jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn()
}));

jest.mock('ai', () => ({
  streamText: jest.fn(),
  generateText: jest.fn()
}));

import { openai } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';

const mockOpenAI = openai as jest.MockedFunction<typeof openai>;
const mockStreamText = streamText as jest.MockedFunction<typeof streamText>;
const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let config: AIConfiguration;

  beforeEach(() => {
    config = {
      provider: 'openai',
      apiKey: 'test-api-key',
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7
    };

    provider = new OpenAIProvider(config);
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct name', () => {
      expect(provider.name).toBe('openai');
    });

    it('should be configured with valid API key', () => {
      expect(provider.isConfigured()).toBe(true);
    });

    it('should not be configured without API key', () => {
      const emptyConfig = { ...config, apiKey: '' };
      const emptyProvider = new OpenAIProvider(emptyConfig);
      expect(emptyProvider.isConfigured()).toBe(false);
    });
  });

  describe('Chat Response Generation', () => {
    beforeEach(() => {
      const mockModel = jest.fn();
      mockOpenAI.mockReturnValue(mockModel);
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
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        maxTokens: 1000,
        temperature: 0.7
      });
    });

    it('should include system prompt when provided', async () => {
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
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
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
      const unconfiguredProvider = new OpenAIProvider({ ...config, apiKey: '' });

      await expect(async () => {
        const response = unconfiguredProvider.generateResponse('Hello');
        for await (const _ of response) {}
      }).rejects.toThrow(AIError);
    });
  });

  describe('Summary Generation', () => {
    beforeEach(() => {
      const mockModel = jest.fn();
      mockOpenAI.mockReturnValue(mockModel);
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
        messages: [
          { role: 'system', content: 'You are a helpful assistant that creates clear, concise summaries.' },
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
      const unconfiguredProvider = new OpenAIProvider({ ...config, apiKey: '' });

      await expect(unconfiguredProvider.generateSummary('Content', 'short')).rejects.toThrow(AIError);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = { ...config, model: 'gpt-4', temperature: 0.5 };
      provider.updateConfig(newConfig);
      
      // Verify the config was updated (we can't directly access private config, 
      // but we can test behavior that depends on it)
      expect(provider.isConfigured()).toBe(true);
    });

    it('should get available models', () => {
      const models = provider.getAvailableModels();
      expect(models).toContain('gpt-4');
      expect(models).toContain('gpt-3.5-turbo');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should get default model', () => {
      const defaultModel = provider.getDefaultModel();
      expect(defaultModel).toBe('gpt-3.5-turbo');
    });

    it('should get model capabilities', () => {
      const capabilities = provider.getModelCapabilities('gpt-4');
      expect(capabilities).toHaveProperty('maxTokens');
      expect(capabilities).toHaveProperty('supportsStreaming');
      expect(capabilities.supportsStreaming).toBe(true);
    });

    it('should return default capabilities for unknown model', () => {
      const capabilities = provider.getModelCapabilities('unknown-model');
      expect(capabilities.maxTokens).toBe(4096);
      expect(capabilities.supportsStreaming).toBe(true);
    });
  });

  describe('Connection Testing', () => {
    beforeEach(() => {
      const mockModel = jest.fn();
      mockOpenAI.mockReturnValue(mockModel);
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