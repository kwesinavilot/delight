# Implementation Plan

- [x] 1. Set up Vercel AI SDK dependencies and core infrastructure





  - Install Vercel AI SDK and required provider packages (ai, @ai-sdk/openai, @ai-sdk/anthropic)
  - Update package.json with new dependencies and remove Chrome AI type dependencies
  - Create base TypeScript interfaces for AI providers and configuration
  - _Requirements: 4.1, 4.2_

- [x] 2. Create configuration management system



  - Implement ConfigManager class for handling AI provider settings and API keys
  - Create Chrome storage utilities for securely storing and retrieving AI configuration
  - Write unit tests for configuration management functionality








  - _Requirements: 2.2, 5.1, 5.2_







- [ ] 3. Implement core AI service interfaces
  - Create AIProvider interface with methods for chat and summary generation

  - Implement AIService class as the main service layer for AI interactions



  - Add error handling classes and types for different AI error scenarios
  - Write unit tests for core interfaces and error handling
  - _Requirements: 4.1, 4.3, 4.4_



- [ ] 4. Implement OpenAI provider using Vercel AI SDK



  - Create OpenAIProvider class implementing AIProvider interface



  - Integrate Vercel AI SDK's OpenAI client for streaming chat responses
  - Implement summary generation with appropriate prompts for different lengths
  - Write unit tests for OpenAI provider functionality





  - _Requirements: 1.1, 1.3, 3.2_

- [ ] 5. Implement Anthropic provider as secondary option
  - Create AnthropicProvider class implementing AIProvider interface
  - Integrate Vercel AI SDK's Anthropic client for chat and summary functionality





  - Ensure consistent interface with OpenAI provider implementation
  - Write unit tests for Anthropic provider functionality
  - _Requirements: 2.1, 4.2_

- [ ] 6. Replace existing chat utility with new AI service
  - Remove chrome.aiOriginTrial.languageModel references from chat.ts
  - Update initializeChatSession function to use new AIService
  - Update generateChatResponse function to use Vercel AI SDK streaming
  - Ensure backward compatibility with existing function signatures
  - _Requirements: 1.1, 1.2, 6.1_




- [ ] 7. Update ChatPanel component to use new AI service
  - Modify ChatPanel.tsx to initialize and use the new AIService
  - Update streaming response handling to work with Vercel AI SDK
  - Add error handling for AI service failures with user-friendly messages
  - Test chat functionality with both OpenAI and Anthropic providers
  - _Requirements: 1.2, 1.3, 6.2, 6.3_

- [ ] 8. Implement page content extraction for summaries
  - Create utility functions to extract page content using existing readability integration
  - Add content preprocessing to handle large pages and token limits
  - Implement content chunking strategy for pages exceeding AI model limits
  - Write unit tests for content extraction and preprocessing
  - _Requirements: 3.1, 3.4_

- [ ] 9. Implement summary generation functionality
  - Update SummaryPanel.tsx to use AI service for generating summaries
  - Create appropriate prompts for short, medium, and detailed summary lengths
  - Integrate page content extraction with AI summary generation
  - Add loading states and error handling for summary generation
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 10. Create settings UI for AI provider configuration
  - Create SettingsPanel component for managing AI provider selection
  - Add form inputs for API key entry and provider-specific settings
  - Implement provider switching functionality with validation
  - Add secure storage and retrieval of API keys using Chrome storage
  - _Requirements: 2.1, 2.2, 5.1_

- [ ] 11. Add comprehensive error handling and user feedback
  - Implement error boundary components for AI-related failures
  - Create user-friendly error messages for different failure scenarios
  - Add retry mechanisms for transient failures and network issues
  - Implement fallback behavior when AI services are unavailable
  - _Requirements: 4.3, 6.4, 5.3_

- [ ] 12. Write integration tests for complete AI workflows
  - Create end-to-end tests for chat functionality with mocked AI responses
  - Write integration tests for summary generation workflow
  - Test provider switching and configuration management
  - Add tests for error scenarios and recovery mechanisms
  - _Requirements: 1.4, 3.3, 4.4_

- [ ] 13. Update Chrome extension manifest and permissions
  - Add necessary host permissions for AI provider API endpoints
  - Update content security policy to allow AI provider API calls
  - Remove any Chrome AI origin trial permissions that are no longer needed
  - Test extension loading and functionality in Chrome
  - _Requirements: 1.1, 2.3_

- [ ] 14. Optimize performance and finalize implementation
  - Implement request caching for repeated queries where appropriate
  - Add performance monitoring for AI response times
  - Optimize bundle size by ensuring proper tree-shaking of AI SDK
  - Conduct final testing across all supported AI providers
  - _Requirements: 6.1, 6.2, 6.3_