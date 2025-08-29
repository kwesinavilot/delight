import { GeminiProvider } from '../GeminiProvider';
import { AIConfiguration, AIError } from '../../../../types/ai';

// Mock the Vercel AI SDK
jest.mock('@ai-sdk/google', () => ({
  google: jest.fn()
}));

jest.mock('ai', () => ({
  streamText: jest.fn(),
  generateText: jest.fn()
}));

import { google } from '@ai-sdk/google';
import { streamText, generateText } from 'ai';

const mockGoogle = google as jest.MockedFunction<typeof google>;
const mockStreamText = streamText as jest.MockedFunction<typeof streamText>;
const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;

describe('GeminiProvider', () => {
  let provider: GeminiProvider;
  let config: AIConfiguration;

  beforeEach(() => {
    config = {
      provider: 'gemini',
      apiKey: 'test-api-key',
      model: 'gemini-1.5-flash',
      maxTokens: 1000,
      temperature: 0.7
    };

    provider = new GeminiProvider(config);
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct name', () => {
      expect(provider.name).toBe('gemini');
    });

    it('should be configured with valid API key', () => {
      expect(provider.isConfigured()).toBe(true);
    });

    it('should not be configured without API key', () => {
      const emptyConfig = { ...config, apiKey: '' };
      const emptyProvider = new GeminiProvider(emptyConfig);
      expect(emptyProvider.isConfigured()).toBe(false);
    });
  });

  describe('Chat Response Generation', () => {
    beforeEach(() => {
      const mockModel = jest.fn();
      mockGoogle.mockReturnValue(mockModel);
    });

    it('should generate streaming response', async () => {
      const mockTextStream = {
        async *[Symbol.asyncIterator]() {
          yield 'Hello';
          yield ' from';
          yield ' Gemini!';
        }
      };

      mockStreamText.mockResolvedValue({
        textStream: mockTextStream,
        text: Promise.resolve('Hello from Gemini!')
      } as any);

      const response = provider.generateResponse('Hello', { stream: true });
      const chunks: string[] = [];
      
      for await (const chunk of response) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' from', ' Gemini!']);
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
        text: 'Hello from Gemini!',
        usage: { totalTokens: 10 }
      } as any);

      const response = provider.generateResponse('Hello', { stream: false });
      const chunks: string[] = [];
      
      for await (const chunk of response) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello from Gemini!']);
    });

    it('should handle API errors', async () => {
      mockStreamText.mockRejectedValue(new Error('API Error'));

      await expect(async () => {
        const response = provider.generateResponse('Hello');
        for await (const _ of response) {}
      }).rejects.toThrow(AIError);
    });
  });

  describe('Summary Generation', () => {
    beforeEach(() => {
      const mockModel = jest.fn();
      mockGoogle.mockReturnValue(mockModel);
    });

    it('should generate summary with appropriate token limits', async () => {
      const mockSummary = 'This is a Gemini-generated summary.';
      mockGenerateText.mockResolvedValue({
        text: mockSummary,
        usage: { totalTokens: 20 }
      } as any);

      const summary = await provider.generateSummary('Long content here...', 'medium');

      expect(summary).toBe(mockSummary);
      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          maxTokens: 300
        })
      );
    });
  });

  describe('Gemini-specific Features', () => {
    it('should get available models', () => {
      const models = provider.getAvailableModels();
      expect(models).toContain('gemini-1.5-pro');
      expect(models).toContain('gemini-1.5-flash');
      expect(models).toContain('gemini-pro-vision');
    });

    it('should get model performance for flash models', () => {
      const performance = provider.getModelPerformance('gemini-1.5-flash');
      expect(performance).toBe('ultra-fast');
    });

    it('should get model performance for pro models', () => {
      const performance = provider.getModelPerformance('gemini-1.5-pro');
      expect(performance).toBe('powerful');
    });

    it('should check vision support', () => {
      expect(provider.supportsVision('gemini-pro-vision')).toBe(true);
      expect(provider.supportsVision('gemini-1.5-flash')).toBe(true);
      expect(provider.supportsVision('gemini-1.0-pro')).toBe(false);
    });

    it('should get model capabilities with correct token limits', () => {
      const capabilities = provider.getModelCapabilities('gemini-1.5-pro');
      expect(capabilities.maxTokens).toBe(2097152);
      expect(capabilities.supportsStreaming).toBe(true);
    });
  });
});