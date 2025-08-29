import { AIService } from '../services/ai/AIService';
import { AIError, AIErrorType } from '../types/ai';

interface ChatSession {
  aiService: AIService;
  destroy: () => void;
}

export const initializeChatSession = async (): Promise<ChatSession | null> => {
  try {
    const aiService = AIService.getInstance();
    await aiService.initialize();
    
    // Check if any provider is configured
    if (!aiService.isCurrentProviderConfigured()) {
      console.warn('No AI provider is configured. Please configure an API key.');
      return null;
    }
    
    return {
      aiService,
      destroy: () => {
        // No cleanup needed for the new AI service
        // The service manages its own lifecycle
      }
    };
  } catch (error) {
    console.error('Failed to initialize AI service:', error);
    return null;
  }
};

export const generateChatResponse = async (
  session: any,
  message: string,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  // Handle both old session format (for backward compatibility) and new AIService
  const aiService = session?.aiService || session;
  
  if (!aiService || typeof aiService.generateChatResponse !== 'function') {
    throw new AIError(
      AIErrorType.CONFIGURATION_ERROR,
      'Invalid session or AI service not available'
    );
  }

  try {
    return await aiService.generateChatResponse(message, onChunk);
  } catch (error) {
    console.error('Chat response generation failed:', error);
    
    if (error instanceof AIError) {
      throw error;
    }
    
    throw new AIError(
      AIErrorType.API_ERROR,
      'Failed to generate chat response',
      undefined,
      error as Error
    );
  }
};

// New utility functions for the updated AI service

export const switchAIProvider = async (providerName: string): Promise<void> => {
  try {
    const aiService = AIService.getInstance();
    await aiService.switchProvider(providerName);
  } catch (error) {
    console.error('Failed to switch AI provider:', error);
    throw error;
  }
};

export const getCurrentAIProvider = (): string | null => {
  try {
    const aiService = AIService.getInstance();
    return aiService.getCurrentProviderName();
  } catch (error) {
    console.error('Failed to get current AI provider:', error);
    return null;
  }
};

export const getAvailableAIProviders = (): string[] => {
  try {
    const aiService = AIService.getInstance();
    return aiService.getAvailableProviders();
  } catch (error) {
    console.error('Failed to get available AI providers:', error);
    return [];
  }
};

export const getConfiguredAIProviders = (): string[] => {
  try {
    const aiService = AIService.getInstance();
    return aiService.getConfiguredProviders();
  } catch (error) {
    console.error('Failed to get configured AI providers:', error);
    return [];
  }
};

export const testAIProvider = async (providerName?: string): Promise<boolean> => {
  try {
    const aiService = AIService.getInstance();
    return await aiService.testProvider(providerName);
  } catch (error) {
    console.error('Failed to test AI provider:', error);
    return false;
  }
};

export const isAIServiceReady = async (): Promise<boolean> => {
  try {
    const aiService = AIService.getInstance();
    return await aiService.validateCurrentConfiguration();
  } catch (error) {
    console.error('Failed to validate AI service:', error);
    return false;
  }
};
