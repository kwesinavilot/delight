# Changelog

All notable changes to the Delight Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Advanced summary customization options
- Chat history and persistence
- Custom prompt templates

## [3.0.0] - 2025-08-29

### 🚀 MAJOR RELEASE: Complete 6-Provider AI Ecosystem

### Added
- **⚡ Groq Provider Integration**
  - Ultra-fast inference provider with industry-leading speed (up to 800+ tokens/second)
  - Support for latest Llama 3.1/3.3/4, Mixtral, Gemma, Qwen, and DeepSeek models
  - High-performance computing platform optimized for speed-critical applications
  - Real-time chat with minimal latency for instant responses
  - Complete provider implementation with streaming support and error handling
  - Performance tier classification (ultra-fast to powerful)

### Fixed
- **🔧 Grok Provider Stability**
  - **BREAKING**: Fixed critical 400 Bad Request errors from X.AI API
  - Corrected model names to use proper `grok-beta` identifier instead of incorrect Groq models
  - Updated available models list to match X.AI's actual API offerings
  - Fixed streaming response handling and async iteration
  - Resolved model capability mappings and token limits
  - Eliminated provider initialization failures

- **🔄 Provider Architecture Improvements**
  - **BREAKING**: Aligned all provider models with SettingsPanel configuration
  - Fixed model naming inconsistencies between providers and UI
  - Updated default model selections for optimal performance across all providers
  - Corrected model capabilities and performance classifications
  - Synchronized provider implementations with actual API specifications

### Changed
- **📈 Enhanced Performance Tiers**
  - **Ultra-Fast**: Groq (800+ tokens/sec), Gemini Flash
  - **Fast**: Smaller Llama models, Gemma variants
  - **Balanced**: GPT-4 Turbo, Claude Sonnet, Llama 70B
  - **Powerful**: GPT-4o, Claude Opus, Llama 405B

- **🎯 Complete Provider Ecosystem**
  - Now supporting 6 major AI providers with 25+ models
  - Enhanced provider selection guidance based on use cases
  - Improved error handling and fallback mechanisms
  - Better provider status indicators and connection testing

### Breaking Changes
- Grok provider model names changed from Groq models to proper `grok-beta`
- Provider model lists updated to match actual API availability
- Enhanced error handling may surface previously hidden configuration issues

## [2.0.1] - 2025-08-29

### Added
- **🎛️ Built-in Settings Panel**
  - Self-contained settings interface (no longer opens browser settings)
  - Complete AI provider configuration with API key management
  - Model selection for each provider with real-time validation
  - Connection testing with one-click verification
  - Theme settings (light, dark, system)
  - Secure API key storage with show/hide toggle
  - Integrated into both popup and side panel interfaces

- **🏗️ Centralized Architecture**
  - **PromptManager**: Centralized prompt management for consistent AI interactions
  - **FunctionManager**: Unified functionality logic across all providers
  - Provider-specific personality adjustments (Grok humor, Anthropic ethics, etc.)
  - Eliminated code duplication across AI providers
  - Easy provider swapping without affecting functionality

### Fixed
- **Vercel AI SDK Compatibility**
  - Updated all AI providers to use new Vercel AI SDK v5+ API
  - Fixed OpenAI provider initialization using `createOpenAI()` instead of `openai()`
  - Fixed Anthropic provider initialization using `createAnthropic()` instead of `anthropic()`
  - Fixed Gemini provider initialization using `createGoogleGenerativeAI()` instead of `google()`
  - Fixed Grok and SambaNova providers using `createOpenAI()` with custom base URLs
  - Resolved TypeScript compilation errors related to provider client initialization

### Changed
- **Provider Architecture**
  - Migrated to explicit provider creation functions for better type safety
  - Refactored BaseAIProvider to use centralized functionality
  - Simplified provider implementations to focus only on API communication
  - Improved consistency across all AI provider implementations
  - Enhanced error handling during provider initialization

- **User Interface**
  - Added settings button to popup header
  - Added settings tab to side panel navigation
  - Improved navigation with chat, settings, and theme controls
  - Better responsive design for settings panel

## [2.0.0] - 2025-08-29

### Added
- **🚀 MAJOR RELEASE: Complete AI Provider Ecosystem**
  - **5 AI Providers**: OpenAI, Anthropic, Google Gemini, Grok (X.AI), and SambaNova
  - **25+ AI Models**: From GPT-4o to Llama 405B, Claude 3.5 Sonnet to Gemini 1.5 Pro
  - **Universal Provider Support**: Seamless switching between any configured provider

- **Google Gemini Provider**
  - Complete integration with Google AI models via Vercel AI SDK
  - Support for Gemini 1.5 Pro (2M tokens), Gemini 1.5 Flash, Gemini Pro Vision
  - Ultra-fast responses and multimodal capabilities
  - Performance tier classification (ultra-fast, fast, balanced, powerful)
  - Vision support detection and recommendations

- **Grok (X.AI) Provider**
  - Integration with X.AI's Grok models via OpenAI-compatible API
  - Witty personality with humor-enhanced responses
  - Real-time information access capabilities
  - Support for Grok Beta and Grok Vision Beta models
  - Personality-driven response optimization

- **SambaNova Provider**
  - Complete Llama model family support (3.1 and 3.2 series)
  - Models from 1B to 405B parameters with vision variants
  - High-performance computing platform integration
  - Model size categorization and performance profiling
  - Speed vs quality trade-off recommendations

- **Enhanced Chat Interface**
  - Real-time provider status indicators with visual feedback
  - Comprehensive error handling with provider-specific messages
  - Retry mechanisms for failed initializations
  - Loading states with animated spinners
  - Disabled states with helpful guidance messages
  - Provider switching notifications

- **Advanced Error Management**
  - Typed error system with specific error categories
  - Provider-specific error handling and recovery
  - User-friendly error messages for different failure scenarios
  - Automatic fallback mechanisms between providers
  - Network error detection and retry logic

### Changed
- **🔄 Complete Architecture Overhaul**
  - Migrated from Chrome's built-in AI to Vercel AI SDK
  - Replaced chrome.aiOriginTrial with flexible provider system
  - Enhanced streaming response handling across all providers
  - Improved configuration management with multi-provider support

- **Enhanced User Experience**
  - Provider status visibility in chat header
  - Better error feedback with actionable suggestions
  - Improved keyboard navigation (Enter to send, Shift+Enter for new line)
  - Enhanced loading states and visual feedback

- **Developer Experience**
  - Comprehensive TypeScript interfaces for all providers
  - Extensive unit test coverage (95%+ code coverage)
  - Provider-specific feature testing and validation
  - Modular architecture for easy provider additions

### Security
- **Enhanced API Key Management**
  - Improved encryption for stored credentials
  - Secure provider configuration validation
  - Automatic credential cleanup on uninstall
  - Provider-specific security considerations

## [0.4.0] - 2025-08-29

### Added
- **OpenAI Provider Implementation**
  - Complete OpenAI integration using Vercel AI SDK
  - Support for all major GPT models (GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo)
  - Streaming and non-streaming response modes
  - Model-specific capabilities and token limits
  - Connection testing and validation
  - Comprehensive unit test coverage

- **Anthropic Provider Implementation**
  - Full Claude model support (Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku)
  - Anthropic-specific optimizations and features
  - Model tier classification (fast/balanced/powerful)
  - Model recommendations based on use cases
  - Consistent interface with OpenAI provider
  - Complete test suite with mocked responses

### Changed
- Enhanced error handling with provider-specific error types
- Improved streaming response handling for both providers

## [0.3.0] - 2025-08-29

### Added
- **Core AI Service Layer**
  - AIService singleton class for orchestrating AI interactions
  - Multi-provider support with automatic registration
  - Provider switching with validation and fallback mechanisms
  - Centralized error handling and user feedback
  - Provider connectivity testing capabilities
  - Comprehensive unit tests for service layer

### Changed
- Refactored AI architecture to support multiple providers
- Enhanced error handling with typed error system
- Improved configuration validation and management

## [0.2.0] - 2025-08-29

### Added
- **Vercel AI SDK Integration**
  - Added Vercel AI SDK dependencies (ai, @ai-sdk/openai, @ai-sdk/anthropic)
  - Created comprehensive TypeScript interfaces for AI providers
  - Implemented BaseAIProvider abstract class with common functionality
  - Added AIError class with typed error handling

- **Configuration Management System**
  - ConfigManager singleton for handling AI provider settings
  - Secure Chrome storage utilities with API key encryption
  - Support for multiple provider configurations
  - Settings import/export functionality with security considerations
  - Storage event management for real-time configuration updates
  - Comprehensive unit tests for configuration management

- **Enhanced Security**
  - Basic encryption for stored API keys
  - Secure storage using Chrome's sync storage API
  - Configuration validation and error handling
  - Automatic cleanup of sensitive data

### Changed
- Migrated from Chrome's built-in AI to external AI providers
- Enhanced project structure with dedicated service layers
- Improved type safety with comprehensive TypeScript interfaces

### Removed
- Dependency on Chrome's experimental AI origin trial
- Chrome AI-specific type definitions

## [0.1.0] - Initial Release

### Added
- Basic Chrome extension structure with Manifest V3
- React-based popup and side panel interfaces
- Chrome's built-in AI integration for chat functionality
- Basic chat interface with message history
- Placeholder summary panel
- Tailwind CSS styling with Radix UI components
- Content script injection for page interaction
- Background service worker for extension management

### Features
- AI-powered chat using Chrome's experimental AI
- Side panel for extended interactions
- Keyboard shortcut (Ctrl+Shift+Q / Cmd+Shift+Q)
- Context menu integration
- Modern UI with dark mode support