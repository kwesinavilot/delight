# Changelog

All notable changes to the Delight Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Advanced summary customization options
- Chat history and persistence
- Custom prompt templates

## [3.3.1] - 2025-01-29

### 🐛 Critical Bug Fixes

### Fixed
- **✅ Sidepanel Close Button**
  - Fixed close button not working in sidepanel mode
  - Improved close functionality to properly detect fullscreen vs sidepanel mode
  - Added proper fallback handling for Chrome API failures

- **🔧 Provider Registration Errors**
  - Fixed "Failed to register providers: Error: Provider groq is not configured" on startup
  - Changed provider registration to be non-blocking - failed providers no longer crash initialization
  - Enhanced ConfigManager to create default configurations for missing providers
  - Improved error handling with graceful degradation

- **🖥️ Fullscreen/Sidepanel Mode Issues**
  - Fixed ERR_FILE_NOT_FOUND error when minimizing from fullscreen to sidepanel
  - Improved mode detection logic with better window width thresholds (500px)
  - Enhanced maximize/minimize functionality with proper tab management
  - Simplified minimize logic to avoid invalid tab switching

- **🏠 Welcome Page Navigation**
  - Removed Google redirect after welcome completion
  - Now uses existing valid tabs or creates blank new tab instead
  - Improved tab selection logic to avoid chrome:// and extension pages

### Changed
- **🔄 Enhanced Tab Management**
  - Improved existing tab detection and validation
  - Better fallback mechanisms for tab operations
  - More reliable sidepanel attachment to valid tabs

## [3.3.0] - 2025-01-29

### 🚀 Enhanced Sidepanel Experience & UX Improvements

### Added
- **💬 Interactive Sample Prompts**
  - Added 5 sample prompts to the chat interface when no messages are present
  - One-click prompt insertion for common tasks like page summarization
  - Prompts only appear when AI service is ready and configured
  - Improved new user onboarding experience

- **🔧 Robust Sidepanel Management System**
  - Implemented comprehensive tab validation service with URL pattern checking
  - Added smart tab selector with intelligent fallback strategies
  - Enhanced error recovery manager with multiple retry mechanisms
  - Performance optimizer with caching, batching, and debouncing
  - Comprehensive testing documentation and diagnostic tools

### Fixed
- **✅ Sidepanel Close Functionality**
  - Fixed critical issue where close button didn't actually close the sidepanel
  - Replaced background script messaging with direct Chrome API calls
  - Added proper error handling and fallback mechanisms
  - Eliminated "Could not establish connection" errors

- **🎯 Fullscreen Detection Logic**
  - Improved window width threshold from 800px to 600px for better detection
  - Fixed incorrect icon display (minimize vs maximize) based on mode
  - Enhanced detection using URL parameters and window properties
  - Default state now correctly assumes sidepanel mode (isFullscreen: false)

- **⚙️ Provider Configuration Issues**
  - Fixed "Provider groq is not configured" error on startup
  - Added missing Groq provider to default configuration settings
  - Synchronized all 6 providers between AIService and ConfigManager
  - Resolved provider registration failures during initialization

### Changed
- **🎨 Improved UI Layout**
  - Control buttons (maximize/minimize, settings, close) now only show in chat view
  - Cleaner settings page with just back button and title
  - Better visual hierarchy and reduced interface clutter
  - Enhanced header layout with proper button positioning

- **🏠 Enhanced Onboarding Flow**
  - Welcome flow now opens in sidepanel mode instead of fullscreen
  - Creates new tab and opens sidepanel for better user experience
  - Maintains consistency with primary usage pattern
  - Improved first-time user journey

### Technical Improvements
- **🛠️ Code Quality**
  - Fixed TypeScript comparison errors in conditional rendering
  - Improved component structure and prop handling
  - Enhanced error handling throughout the application
  - Better separation of concerns in UI components

## [3.2.0] - 2025-08-29

### 🎯 Enhanced User Experience & Documentation

### Added
- **📚 Comprehensive User Guide**
  - Interactive user guide with 6 expandable sections (Getting Started, AI Providers, Features, Settings, Security & Privacy, Troubleshooting, FAQ)
  - Step-by-step setup instructions for all 6 AI providers with direct API key links
  - Comprehensive troubleshooting section with common issues and solutions
  - Detailed security and privacy information
  - FAQ section covering most common user questions
  - Collapsible sections with smooth animations for better navigation

- **🔗 Enhanced Settings Footer**
  - Global footer visible on all settings tabs with version information
  - Quick access links to User Guide, Privacy Policy, GitHub, and Support
  - Persistent "Show Welcome" button for easy onboarding access
  - Improved navigation between documentation and settings

- **📄 Privacy Policy**
  - Comprehensive privacy policy explaining data handling practices
  - Clear statements about no data collection by Delight
  - Detailed information about local-only storage
  - Transparency about AI provider interactions and their respective policies
  - Instructions for data deletion and privacy controls

### Changed
- **⚙️ Improved Settings Organization**
  - Reordered settings tabs: "Appearance" now appears before "AI Providers"
  - Default settings tab changed to "Appearance" for better first-time user experience
  - Moved version information and links to persistent global footer
  - Enhanced settings navigation with consistent footer across all tabs

- **📖 Updated Documentation Links**
  - Changed "Documentation" to "User Guide" throughout the interface
  - Updated welcome page links to point to comprehensive user guide
  - Added proper click handlers for opening documentation in new tabs
  - Improved link accessibility and user experience

### Technical
- Added user guide to build configuration and web accessible resources
- Enhanced manifest permissions for improved functionality
- Updated build system to include new documentation pages

## [3.1.0] - 2025-08-29

### 🖥️ Fullscreen Mode & Interface Enhancements

### Added
- **📱 Fullscreen Mode Support**
  - Maximize button in sidepanel to open fullscreen experience in new tab
  - Minimize button in fullscreen mode to return to sidepanel
  - Smart mode detection using URL parameters and window properties
  - Seamless state preservation when switching between modes
  - Enhanced desktop experience with responsive layout

- **🎛️ Smart Interface Controls**
  - Dynamic button behavior based on current mode (sidepanel vs fullscreen)
  - Intelligent close button: minimizes from fullscreen, closes from sidepanel
  - Automatic tab management for smooth mode transitions
  - Suitable tab detection for sidepanel attachment

- **🎨 Enhanced Welcome Experience**
  - First-time installation welcome page with 3-step interactive onboarding
  - Welcome hint component in chat panel for new users
  - Dismissible welcome hints with persistent storage
  - Quick setup buttons for immediate configuration access
  - Major version update detection with automatic welcome page display

### Changed
- **🔄 Improved Navigation**
  - Enhanced MainSidePanel with maximize/minimize functionality
  - Better responsive design for fullscreen mode with centered layout
  - Improved event system for switching between chat and settings views
  - Enhanced background script for first install detection

- **⚡ Better User Onboarding**
  - Welcome page now opens in fullscreen mode by default for better experience
  - Integrated welcome hints appear when chat is empty and no errors present
  - Streamlined setup process with direct links to provider configuration

### Technical
- Added "tabs" permission to manifest for enhanced tab management
- Enhanced URL parameter handling for mode detection
- Improved Chrome extension API usage for sidepanel management
- Better error handling for tab operations and mode switching

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