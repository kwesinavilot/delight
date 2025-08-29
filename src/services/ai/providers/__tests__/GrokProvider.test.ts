import { GrokProvider } from '../GrokProvider';
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

describe('GrokProvider', () => {
  let provider: GrokProvider;
  let config: AIConfiguration;

  beforeEach(() => {
    config = {
      provider: 'grok',
      apiKey: 'test-api-key',
      model: 'grok-beta',
      maxTokens: 1000,
      temperature: 0.7
    };

    provider = new GrokProvider(config);
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct name', () => {
      expect(provider.name).toBe('grok');
    });

    it('should initialize with X.AI base URL', () => {
      expect(mockOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        baseURL: 'https://api.x.ai/v1'
      });
    });

    it('should be configured with valid API key', () => {
      expect(provider.isConfigured()).toBe(true);
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
          yield ' from';
          yield ' Grok!';
        }
      };

      mockStreamText.mockResolvedValue({
        textStream: mockTextStream,
        text: Promise.resolve('Hello from Grok!')
      } as any);

      const response = provider.generateResponse('Hello', { stream: true });
      const chunks: string[] = [];
      
      for await (const chunk of response) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' from', ' Grok!']);
    });

    it('should use Grok personality in system prompt for summaries', async () => {
      const mockModel = jest.fn();
      mockOpenAI.mockReturnValue(mockModel);
      
      mockGenerateText.mockResolvedValue({
        text: 'Witty summary from Grok',
        usage: { totalTokens: 20 }
      } as any);

      await provider.generateSummary('Content to summarize', 'short');

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Grok, a witty and helpful AI assistant')
            })
          ])
        })
      );
    });
  });

  describe('Grok-specific Features', () => {
    it('should get available models', () => {
      const models = provider.getAvailableModels();
      expect(models).toContain('grok-beta');
      expect(models).toContain('grok-vision-beta');
    });

    it('should get model personality', () => {
      expect(provider.getModelPersonality('grok-beta')).toBe('witty');
      expect(provider.getModelPersonality('grok-vision-beta')).toBe('visual');
    });

    it('should check vision support', () => {
      expect(provider.supportsVision('grok-vision-beta')).toBe(true);
      expect(provider.supportsVision('grok-beta')).toBe(false);
    });

    it('should support real-time capabilities', () => {
      expect(provider.supportsRealTime()).toBe(true);
    });

    it('should get appropriate recommendations for witty personality', () => {
      const recommendations = provider.getModelRecommendations('grok-beta');
      expect(recommendations).toContain('Conversational AI');
      expect(recommendations).toContain('Creative writing');
      expect(recommendations).toContain('Real-time information');
    });

    it('should get model capabilities', () => {
      const capabilities = provider.getModelCapabilities('grok-beta');
      expect(capabilities.maxTokens).toBe(131072);
      expect(capabilities.supportsStreaming).toBe(true);
    });
  });
});