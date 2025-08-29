# Design Document

## Overview

This design outlines the migration from Chrome's built-in AI models to the Vercel AI SDK for the Delight Chrome extension. The Vercel AI SDK provides a unified interface for multiple AI providers (OpenAI, Anthropic, Google, etc.) with built-in streaming support, error handling, and TypeScript integration. This migration will replace the current `chrome.aiOriginTrial.languageModel` implementation with a more robust, flexible, and provider-agnostic solution.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Components │    │   AI Service     │    │  Provider APIs  │
│                 │    │   Layer          │    │                 │
│ • ChatPanel     │◄──►│ • AIProvider     │◄──►│ • OpenAI        │
│ • SummaryPanel  │    │ • ConfigManager  │    │ • Anthropic     │
│ • Settings      │    │ • ErrorHandler   │    │ • Google        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Chrome Storage  │    │ Vercel AI SDK    │    │ External APIs   │
│ • Settings      │    │ • Streaming      │    │ • Rate Limiting │
│ • API Keys      │    │ • Type Safety    │    │ • Authentication│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Component Responsibilities

1. **AI Service Layer**: Abstracts AI provider interactions and manages configuration
2. **Provider Implementations**: Specific implementations for each AI provider using Vercel AI SDK
3. **Configuration Manager**: Handles provider selection, API key management, and settings persistence
4. **Error Handler**: Provides consistent error handling and user feedback across providers

## Components and Interfaces

### Core Interfaces

```typescript
interface AIProvider {
  name: string;
  isConfigured(): boolean;
  generateResponse(message: string, options?: GenerationOptions): Promise<AsyncIterable<string>>;
  generateSummary(content: string, length: SummaryLength): Promise<string>;
}

interface AIConfiguration {
  provider: string;
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface GenerationOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

type SummaryLength = 'short' | 'medium' | 'detailed';
```

### AI Service Implementation

```typescript
class AIService {
  private currentProvider: AIProvider;
  private configManager: ConfigManager;
  
  async initialize(): Promise<void>;
  async switchProvider(providerName: string): Promise<void>;
  async generateChatResponse(message: string, onChunk?: (chunk: string) => void): Promise<string>;
  async generatePageSummary(content: string, length: SummaryLength): Promise<string>;
}
```

### Provider Implementations

Each provider will implement the `AIProvider` interface using Vercel AI SDK:

```typescript
class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  
  constructor(config: AIConfiguration);
  async generateResponse(message: string, options?: GenerationOptions): Promise<AsyncIterable<string>>;
  async generateSummary(content: string, length: SummaryLength): Promise<string>;
}

class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  // Similar implementation using Vercel AI SDK's Anthropic integration
}
```

## Data Models

### Configuration Storage

```typescript
interface ExtensionSettings {
  ai: {
    currentProvider: string;
    providers: {
      [key: string]: {
        apiKey: string;
        model: string;
        maxTokens: number;
        temperature: number;
      };
    };
  };
}
```

### Message Models

```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface SummaryRequest {
  content: string;
  length: SummaryLength;
  url?: string;
}
```

## Error Handling

### Error Types

```typescript
enum AIErrorType {
  CONFIGURATION_ERROR = 'configuration_error',
  API_ERROR = 'api_error',
  NETWORK_ERROR = 'network_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  INVALID_API_KEY = 'invalid_api_key'
}

class AIError extends Error {
  constructor(
    public type: AIErrorType,
    message: string,
    public provider?: string,
    public originalError?: Error
  );
}
```

### Error Handling Strategy

1. **Configuration Errors**: Show settings panel with clear instructions
2. **API Errors**: Display user-friendly messages with retry options
3. **Network Errors**: Implement exponential backoff retry logic
4. **Rate Limiting**: Queue requests and inform users of delays
5. **Authentication Errors**: Prompt for API key re-entry

### Fallback Mechanisms

1. **Provider Fallback**: If primary provider fails, attempt with secondary provider if configured
2. **Graceful Degradation**: Show cached responses or placeholder content when AI is unavailable
3. **Offline Mode**: Provide basic functionality without AI when no providers are available

## Testing Strategy

### Unit Testing

1. **Provider Tests**: Mock Vercel AI SDK responses to test each provider implementation
2. **Service Layer Tests**: Test AI service logic, configuration management, and error handling
3. **Component Tests**: Test React components with mocked AI service responses

### Integration Testing

1. **End-to-End Chat Flow**: Test complete chat interaction from UI to AI response
2. **Summary Generation**: Test page content extraction and summary generation
3. **Provider Switching**: Test switching between different AI providers
4. **Error Scenarios**: Test various error conditions and recovery mechanisms

### Test Data

```typescript
const mockChatResponse = {
  content: "Hello! I'm Delight, your AI assistant.",
  usage: { tokens: 15 }
};

const mockSummaryContent = {
  short: "Brief summary of the page content.",
  medium: "A more detailed summary with key points.",
  detailed: "Comprehensive summary with full context and details."
};
```

### Testing Environment

1. **Mock Providers**: Create test implementations that simulate different provider behaviors
2. **Configuration Testing**: Test with various valid and invalid configurations
3. **Performance Testing**: Measure response times and streaming performance
4. **Chrome Extension Testing**: Test within actual Chrome extension environment

## Implementation Phases

### Phase 1: Core Infrastructure
- Set up Vercel AI SDK dependencies
- Create base interfaces and abstract classes
- Implement configuration management system

### Phase 2: Provider Implementation
- Implement OpenAI provider as primary option
- Add Anthropic provider as secondary option
- Create provider factory and registration system

### Phase 3: Service Integration
- Replace existing chat utility with new AI service
- Update ChatPanel component to use new service
- Implement proper error handling and user feedback

### Phase 4: Summary Feature
- Implement page content extraction integration
- Add summary generation using AI providers
- Update SummaryPanel component with full functionality

### Phase 5: Configuration UI
- Create settings panel for provider configuration
- Add API key management interface
- Implement provider switching functionality

### Phase 6: Testing and Polish
- Comprehensive testing across all providers
- Performance optimization and error handling refinement
- Documentation and migration guide