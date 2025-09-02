import { SummaryLength } from '../../types/ai';

/**
 * Centralized prompt management for all AI functionality
 * This ensures consistent prompts across all providers
 */
export class PromptManager {
  private static instance: PromptManager;

  private constructor() {}

  static getInstance(): PromptManager {
    if (!PromptManager.instance) {
      PromptManager.instance = new PromptManager();
    }
    return PromptManager.instance;
  }

  /**
   * Get system prompt for chat functionality
   */
  getChatSystemPrompt(providerName?: string): string {
    const basePrompt = `You are a helpful AI assistant. ALWAYS answer the user's question directly. Do not give generic greetings or introductions. Focus on providing the specific information the user is asking for.`;

    // Provider-specific personality adjustments
    switch (providerName) {
      case 'grok':
        return `${basePrompt} Feel free to add a touch of wit and humor when appropriate.`;
      case 'gemini':
        return `${basePrompt} Provide quick, efficient responses.`;
      case 'anthropic':
        return `${basePrompt} Be thoughtful and consider multiple perspectives.`;
      default:
        return basePrompt;
    }
  }

  /**
   * Get summary prompt based on content and desired length
   */
  getSummaryPrompt(content: string, length: SummaryLength): string {
    const lengthInstructions = {
      short: 'Create a brief summary in 2-3 sentences that captures the main point.',
      medium: 'Create a comprehensive summary in 1-2 paragraphs that covers the key points and important details.',
      detailed: 'Create a detailed summary that thoroughly covers all important points, key arguments, and relevant details. Organize it with clear structure and include specific examples where relevant.'
    };

    const instruction = lengthInstructions[length];

    return `Please analyze the following content and ${instruction}

Focus on:
- Main topics and key points
- Important facts and data
- Conclusions or outcomes
- Actionable insights (if any)

Content to summarize:
${content}

Summary:`;
  }

  /**
   * Get system prompt for summary generation
   */
  getSummarySystemPrompt(): string {
    return `You are an expert content summarizer. Your role is to create clear, accurate, and well-structured summaries that capture the essential information from any given content.

Guidelines:
- Extract the most important information
- Maintain factual accuracy
- Use clear, concise language
- Organize information logically
- Avoid adding your own opinions or interpretations
- Focus on what the reader needs to know`;
  }

  /**
   * Get prompt for content extraction and preprocessing
   */
  getContentExtractionPrompt(rawContent: string): string {
    return `Please extract and clean the main content from this text, removing navigation elements, ads, and irrelevant information:

${rawContent}

Return only the main article or content body.`;
  }

  /**
   * Get prompt for content chunking when content is too large
   */
  getChunkSummaryPrompt(chunk: string, chunkIndex: number, totalChunks: number): string {
    return `This is part ${chunkIndex + 1} of ${totalChunks} of a larger document. 
Please summarize the key points from this section:

${chunk}

Focus on the main ideas and important details from this section only.`;
  }

  /**
   * Get prompt for combining multiple chunk summaries
   */
  getCombinedSummaryPrompt(chunkSummaries: string[], length: SummaryLength): string {
    const lengthInstructions = {
      short: 'Create a brief overall summary in 2-3 sentences.',
      medium: 'Create a comprehensive summary in 1-2 paragraphs.',
      detailed: 'Create a detailed summary with clear structure and all important points.'
    };

    return `I have summaries from different sections of a document. Please combine them into ${lengthInstructions[length]}

Section summaries:
${chunkSummaries.map((summary, index) => `Section ${index + 1}: ${summary}`).join('\n\n')}

Combined summary:`;
  }

  /**
   * Get error recovery prompt for when AI responses fail
   */
  getErrorRecoveryPrompt(originalPrompt: string, errorType: string): string {
    return `The previous request failed due to: ${errorType}. 
Please provide a simplified response to: ${originalPrompt}

Keep the response concise and focus on the most essential information.`;
  }

  /**
   * Get test connection prompt
   */
  getTestConnectionPrompt(): string {
    return 'Please respond with "OK" to confirm the connection is working.';
  }

  /**
   * Get model capability test prompt
   */
  getCapabilityTestPrompt(capability: string): string {
    const tests = {
      streaming: 'Please count from 1 to 5, with each number on a new line.',
      reasoning: 'What is 2+2? Please show your reasoning.',
      creativity: 'Write a creative one-sentence story about a robot.',
      analysis: 'Analyze this simple statement: "The sky is blue."'
    };

    return tests[capability as keyof typeof tests] || 'Please respond with a simple acknowledgment.';
  }
}

export const promptManager = PromptManager.getInstance();