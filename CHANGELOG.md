# Changelog

All notable changes to the Delight Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Integration with existing chat components (in progress)
- Summary panel AI functionality (in progress)
- Settings UI for provider configuration (planned)

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