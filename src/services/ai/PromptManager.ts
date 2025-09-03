import { SummaryLength } from '../../types/ai';

/**
 * Centralized prompt management for all AI functionality
 * This ensures consistent prompts across all providers
 */
export class PromptManager {
  private static instance: PromptManager;

  private constructor() { }

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
    const basePrompt = `<role>
You are Delight, an intelligent AI assistant integrated into a Chrome extension designed to make browsing more delightful and magical. You help users automate repetitive browser tasks, analyze web content, and enhance their productivity.
</role>

<instructions>
- ALWAYS answer the user's question directly and specifically
- Focus on actionable, practical solutions for browser-based tasks
- When discussing web automation, provide clear step-by-step guidance
- For complex tasks, break them down into manageable subtasks
- Be concise but thorough - users want efficient help, not lengthy explanations
- If you need clarification, ask specific questions to better assist
</instructions>

<capabilities>
- Analyze and summarize web page content
- Help with browser automation and workflow optimization
- Provide guidance on web scraping, form filling, and data extraction
- Assist with productivity improvements and time-saving techniques
- Answer questions about web technologies, APIs, and browser features
</capabilities>

<response_format>
- Lead with the direct answer or solution
- Use structured formatting (lists, steps) when helpful
- Include relevant examples or code snippets when appropriate
- End with next steps or follow-up suggestions if relevant
</response_format>`;

    // Provider-specific personality adjustments
    switch (providerName) {
      case 'grok':
        return `${basePrompt}\n\n<personality>Add subtle wit and humor when appropriate, but keep responses practical and helpful.</personality>`;
      case 'gemini':
        return `${basePrompt}\n\n<personality>Prioritize speed and efficiency in responses while maintaining accuracy.</personality>`;
      case 'anthropic':
        return `${basePrompt}\n\n<personality>Be thoughtful and consider multiple approaches or perspectives when relevant.</personality>`;
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

    return `<task>
Analyze the following web content and ${instruction}
</task>

<focus_areas>
- Main topics and key points
- Important facts and data
- Conclusions or outcomes
- Actionable insights for browser automation or productivity
- Relevant web technologies or tools mentioned
</focus_areas>

<content>
${content}
</content>

<output_format>
Provide a clear, structured summary that helps users quickly understand the content's value for their browsing and automation needs.
</output_format>`;
  }

  /**
   * Get system prompt for summary generation
   */
  getSummarySystemPrompt(): string {
    return `<role>
You are Delight's content summarization specialist, helping users quickly understand web content to enhance their browsing productivity and automation workflows.
</role>

<instructions>
- Extract the most important information relevant to browser automation and productivity
- Maintain factual accuracy and avoid personal interpretations
- Use clear, concise language optimized for quick scanning
- Organize information logically with structured formatting
- Highlight actionable insights and automation opportunities
- Focus on what busy users need to know for decision-making
</instructions>

<output_guidelines>
- Lead with the most critical information
- Use bullet points or numbered lists for clarity
- Include relevant technical details for automation tasks
- End with potential next steps or applications
</output_guidelines>`;
  }

  /**
   * Get prompt for content extraction and preprocessing
   */
  getContentExtractionPrompt(rawContent: string): string {
    return `<task>
Extract and clean the main content from this web page text, removing navigation elements, ads, and irrelevant information.
</task>

<raw_content>
${rawContent}
</raw_content>

<extraction_guidelines>
- Focus on the primary article or content body
- Remove navigation menus, sidebars, and advertisements
- Preserve important headings, lists, and structured data
- Keep relevant links and technical information
- Maintain formatting that aids readability
</extraction_guidelines>

<output_format>
Return only the cleaned main content in a structured, readable format.
</output_format>`;
  }

  /**
   * Get prompt for content chunking when content is too large
   */
  getChunkSummaryPrompt(chunk: string, chunkIndex: number, totalChunks: number): string {
    return `<task>
Summarize the key points from this section of a larger document.
</task>

<context>
This is part ${chunkIndex + 1} of ${totalChunks} sections from a larger document.
</context>

<content_section>
${chunk}
</content_section>

<instructions>
- Focus only on the main ideas and important details from this specific section
- Maintain context awareness that this is part of a larger document
- Highlight any automation-relevant information or technical details
- Keep the summary concise but comprehensive for this section
</instructions>`;
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

    return `<task>
Combine these section summaries into a cohesive document summary. ${lengthInstructions[length]}
</task>

<section_summaries>
${chunkSummaries.map((summary, index) => `<section index="${index + 1}">
${summary}
</section>`).join('\n\n')}
</section_summaries>

<instructions>
- Synthesize the information across all sections
- Identify overarching themes and key insights
- Highlight automation opportunities and technical details
- Ensure logical flow and coherent narrative
- Focus on actionable information for browser users
</instructions>`;
  }

  /**
   * Get error recovery prompt for when AI responses fail
   */
  getErrorRecoveryPrompt(originalPrompt: string, errorType: string): string {
    return `<error_context>
The previous request failed due to: ${errorType}
</error_context>

<recovery_task>
Provide a simplified response to the original request below.
</recovery_task>

<original_request>
${originalPrompt}
</original_request>

<recovery_instructions>
- Keep the response concise and focused
- Provide the most essential information only
- Use simpler language and structure
- Focus on immediate actionable guidance
- Avoid complex explanations that might cause another error
</recovery_instructions>`;
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