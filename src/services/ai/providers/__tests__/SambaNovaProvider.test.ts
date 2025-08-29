import { SambaNovaProvider } from '../SambaNovaProvider';
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

describe('SambaNovaProvider', () => {
  let provider: SambaNovaProvider;
  let config: AIConfiguration;

  beforeEach(() => {
    config = {
      provider: 'sambanova',
      apiKey: 'test-api-key',
      model: 'Meta-Llama-3.1-8B-Instruct',
      maxTokens: 1000,
      temperature: 0.7
    };

    provider = new SambaNovaProvider(config);
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct name', () => {
      expect(provider.name).toBe('sambanova');
    });

    it('should initialize with SambaNova base URL', () => {
      expect(mockOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        baseURL: 'https://api.sambanova.ai/v1'
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
          yield ' SambaNova!';
        }
      };

      mockStreamText.mockResolvedValue({
        textStream: mockTextStream,
        text: Promise.resolve('Hello from SambaNova!')
      } as any);

      const response = provider.generateResponse('Hello', { stream: true });
      const chunks: string[] = [];
      
      for await (const chunk of response) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' from', ' SambaNova!']);
    });

    it('should use SambaNova branding in system prompt for summaries', async () => {
      const mockModel = jest.fn();
      mockOpenAI.mockReturnValue(mockModel);
      
      mockGenerateText.mockResolvedValue({
        text: 'High-performance summary from SambaNova',
        usage: { totalTokens: 20 }
      } as any);

      await provider.generateSummary('Content to summarize', 'short');

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('SambaNova\'s high-performance computing platform')
            })
          ])
        })
      );
    });
  });

  describe('SambaNova-specific Features', () => {
    it('should get available models', () => {
      const models = provider.getAvailableModels();
      expect(models).toContain('Meta-Llama-3.1-405B-Instruct');
      expect(models).toContain('Meta-Llama-3.1-70B-Instruct');
      expect(models).toContain('Meta-Llama-3.1-8B-Instruct');
      expect(models).toContain('Llama-3.2-90B-Vision-Instruct');
    });

    it('should categorize model sizes correctly', () => {
      expect(provider.getModelSize('Llama-3.2-1B-Instruct')).toBe('small');
      expect(provider.getModelSize('Meta-Llama-3.1-8B-Instruct')).toBe('medium');
      expect(provider.getModelSize('Meta-Llama-3.1-70B-Instruct')).toBe('large');
      expect(provider.getModelSize('Meta-Llama-3.1-405B-Instruct')).toBe('extra-large');
    });

    it('should check vision support', () => {
      expect(provider.supportsVision('Llama-3.2-90B-Vision-Instruct')).toBe(true);
      expect(provider.supportsVision('Meta-Llama-3.1-8B-Instruct')).toBe(false);
    });

    it('should get performance profile for different model sizes', () => {
      const smallProfile = provider.getPerformanceProfile('Llama-3.2-1B-Instruct');
      expect(smallProfile).toEqual({ speed: 'fast', quality: 'good' });

      const largeProfile = provider.getPerformanceProfile('Meta-Llama-3.1-70B-Instruct');
      expect(largeProfile).toEqual({ speed: 'medium', quality: 'better' });

      const extraLargeProfile = provider.getPerformanceProfile('Meta-Llama-3.1-405B-Instruct');
      expect(extraLargeProfile).toEqual({ speed: 'slow', quality: 'best' });
    });

    it('should get appropriate recommendations for vision models', () => {
      const recommendations = provider.getModelRecommendations('Llama-3.2-90B-Vision-Instruct');
      expect(recommendations).toContain('Image analysis');
      expect(recommendations).toContain('Visual content');
      expect(recommendations).toContain('Multimodal tasks');
    });

    it('should get appropriate recommendations for different sizes', () => {
      const smallRecommendations = provider.getModelRecommendations('Llama-3.2-1B-Instruct');
      expect(smallRecommendations).toContain('Quick responses');
      expect(smallRecommendations).toContain('High-throughput');

      const largeRecommendations = provider.getModelRecommendations('Meta-Llama-3.1-405B-Instruct');
      expect(largeRecommendations).toContain('Expert-level tasks');
      expect(largeRecommendations).toContain('Advanced reasoning');
    });

    it('should get model capabilities', () => {
      const capabilities = provider.getModelCapabilities('Meta-Llama-3.1-8B-Instruct');
      expect(capabilities.maxTokens).toBe(131072);
      expect(capabilities.supportsStreaming).toBe(true);
    });
  });
});