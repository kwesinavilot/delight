# Changelog

All notable changes to the Delight Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Advanced summary customization options
- Custom prompt templates
- Multi-language support

## [1.1.0] - 2025-09-06

### 🤖 Agent Automation System - Phase 1

### Added
- **🤖 Agent Automation Framework**
  - Complete multi-agent system with Planner, Navigator, and Monitor agents
  - AgentOrchestrator for coordinating complex web automation tasks
  - Task planning with structured JSON output using Gemini's advanced capabilities
  - Real-time task execution with step-by-step progress tracking
  - Intelligent error handling and recovery mechanisms

- **🎯 Agent Page Interface**
  - Dedicated Agent Automation page accessible from sidepanel sub-toolbar
  - Real-time execution logs with color-coded status indicators
  - Visual execution plan display with step progress tracking
  - Interactive task input with natural language processing
  - Stop/start controls for task execution management

- **🧠 Enhanced Gemini Provider**
  - Structured output support for task planning with JSON schema validation
  - Advanced prompt engineering for agent coordination
  - Task plan schema generation for consistent automation workflows
  - Enhanced error handling for complex agent interactions

- **📋 Agent Type System**
  - Comprehensive TypeScript interfaces for agent communication
  - Task step definitions with status tracking
  - Agent message protocol for inter-agent communication
  - Automation result structures with success/failure handling

### Enhanced
- **🎨 Sidepanel Navigation**
  - Added "Agent" button to sub-toolbar for easy access
  - Bot icon integration for clear agent automation identification
  - Seamless navigation between chat and agent automation modes

- **🔧 Manifest Permissions**
  - Enhanced permissions for browser automation capabilities
  - Prepared infrastructure for advanced web interaction features

### Technical Improvements
- **🏗️ Agent Architecture**
  - Modular agent system with clear separation of concerns
  - Event-driven communication between agents
  - Scalable foundation for future automation capabilities
  - Performance-optimized task execution pipeline

### Notes
- This is Phase 1 of the agent automation system
- Current implementation focuses on framework and UI foundation
- Future phases will add actual browser automation capabilities
- Agent system designed for extensibility and advanced automation scenarios

## [1.0.1] - 2025-09-05

### 🎯 Streamlined User Experience

### Removed
- **📱 Popup Interface**: Disabled popup mode to focus on sidepanel experience
- **🖱️ Context Menu**: Temporarily disabled "Summarize with Delight" right-click option
- **📋 Context Menu Permission**: Removed contextMenus permission from manifest

### Enhanced
- **🎯 Focused Interface**: Extension now opens directly in sidepanel mode for consistent UX
- **⌨️ Keyboard Access**: Ctrl+Shift+Q remains the primary way to access Delight
- **🖥️ Fullscreen Mode**: Still available via maximize button in sidepanel

### Technical Changes
- Removed default_popup from manifest.json
- Commented out context menu creation and handling in background script
- Streamlined permissions for better security and performance

### Notes
- Popup and context menu features will be re-enabled in future versions
- Current focus is on perfecting the sidepanel experience
- All core functionality (AI tools, page attachment, trial system) remains unchanged

## [1.0.0] - 2025-09-05 - Launch Version

### 🎉 Major Launch Features
- **🎁 Trial System**: 5 free AI requests for immediate user onboarding
- **🌐 Browser Compatibility**: Enhanced Edge support with graceful degradation
- **📚 Complete Documentation**: Comprehensive user guide, privacy policy, and welcome flow
- **🚀 Production Ready**: Stable, tested, and ready for Chrome Web Store

### Added
- **🎁 Free Trial System**
  - 5 free AI requests using built-in Gemini key for instant user experience
  - Trial usage tracking with client-side limits
  - Automatic transition to user API keys after trial
  - Trial status display in chat interface and settings
  - Clear onboarding messaging about free requests

- **🌐 Enhanced Browser Compatibility**
  - Edge browser detection with user-friendly error handling
  - Improved fullscreen mode support for Edge with helpful warnings
  - Graceful degradation for unsupported browser features
  - Clear messaging about Chrome recommendations for best experience

- **📚 Complete Documentation Suite**
  - Comprehensive user guide with 7 expandable sections
  - In-app privacy policy page with detailed information
  - Updated welcome flow highlighting trial system
  - FAQ section covering trial, browser compatibility, and common questions

### Enhanced
- **🎯 Improved User Onboarding**
  - Welcome page promotes 5 free requests upfront
  - Settings panel shows trial status and hides trial key
  - Chat interface displays remaining trial requests
  - Smooth transition from trial to user API keys

- **🔧 Settings Panel Improvements**
  - Trial key masked and disabled in Gemini provider settings
  - Trial status indicator with remaining request count
  - Automatic trial data clearing when users add own keys
  - Enhanced connection testing for trial mode

### Technical Improvements
- **🏗️ Trial Service Architecture**
  - TrialService class for managing trial usage and limits
  - AIService integration for automatic trial mode detection
  - Secure trial key embedding with usage tracking
  - Client-side enforcement of 5-request limit

## [0.12.0] - 2025-09-05

### 🛠️ AI Tools & Enhanced Input System

### Added
- **🔧 AI Tools Dropdown**
  - Comprehensive AI tools system with 10 specialized tools
  - **Quick Section**: Explain tool for in-depth simplified explanations
  - **Rewrite Section**: Paraphrase, Improve, Expand, Shorten tools
  - **Change Tone Section**: Academic, Professional, Persuasive, Casual, Funny tones
  - Icon-based tools button with upward dropdown interface
  - Tool selection badge system with easy removal
  - Tools disabled when no AI provider is configured

- **📎 Enhanced Page Attachment**
  - Streamlined "Attach Page Content" with paperclip icon
  - Twitter-card style page preview with favicon, title, and domain
  - Full-width page card with white background for better visibility
  - Persistent page context that remains attached throughout conversation
  - Easy removal with dedicated remove button

- **🎨 Redesigned Input Interface**
  - Borderless textarea for seamless writing experience
  - Removed focus borders for cleaner appearance
  - Separate sections for tools and page attachments
  - Tool badge appears above page card when selected
  - Less rounded tool badges for modern rectangular look

### Enhanced
- **⚡ Smart Tool Integration**
  - Tools automatically modify AI prompts based on selection
  - Seamless integration with page content attachment
  - Tool prompts combined with user input and page context
  - One tool selection at a time for focused interactions

- **🎯 Improved User Experience**
  - Click-outside functionality to close dropdowns
  - Visual feedback for selected tools and attached content
  - Disabled states with helpful tooltips
  - Consistent icon-based interface design

### Technical Improvements
- **🏗️ Enhanced Architecture**
  - New AI tools type system with categorized tools
  - Modular tool prompt system for easy expansion
  - Improved state management for tools and attachments
  - Better separation of concerns in chat interface

## [0.11.0] - 2025-09-05

### 🌐 Browser Compatibility & Error Handling

### Added
- **🌐 Edge Browser Detection**
  - Automatic Microsoft Edge browser detection
  - Browser-specific error handling and user messaging
  - Graceful feature degradation for unsupported functionality
  - Enhanced fullscreen mode compatibility checking

- **⚠️ Improved Error Handling**
  - Browser-specific error messages for better user guidance
  - Enhanced fullscreen mode error recovery
  - Better user feedback for browser limitations
  - Automatic fallback suggestions for Edge users

### Enhanced
- **🔧 Settings & Configuration**
  - Enhanced provider configuration with better validation
  - Improved connection testing across different browsers
  - Better error messaging for API key issues
  - Enhanced user guidance for browser-specific features

### Technical Improvements
- **🏗️ Browser Detection System**
  - User agent analysis for browser identification
  - Feature capability detection and reporting
  - Browser-specific UI adaptations
  - Enhanced compatibility layer for cross-browser support

## [0.10.0] - 2025-09-05

### 🧠 Intelligent Page Content Extraction

### Added
- **🔍 Sophisticated Content Extraction System**
  - Multi-strategy content extraction using 4 different algorithms
  - Readability API integration for article extraction
  - Semantic HTML analysis with ARIA support
  - Heuristic scoring system for content quality assessment
  - Intelligent fallback mechanisms for any webpage structure
  - Content scoring and best result selection

- **📊 Comprehensive Page Analysis**
  - Automatic content type detection (blog, news, product, documentation, etc.)
  - SEO metadata extraction (title, description, author, publish date)
  - Page structure analysis (headings, links, images, videos, forms)
  - Reading metrics calculation (word count, estimated reading time)
  - Language detection and content classification

- **⚡ Smart Page Context Buttons**
  - **📄 Full Analysis**: Complete page analysis with metadata and structure
  - **📊 Summary**: Key metrics with excerpt for quick understanding
  - **⚡ Quick Context**: Essential info for lightweight context
  - Real-time content extraction with loading indicators
  - Intelligent error handling and user feedback

- **🎯 Advanced Content Processing**
  - Noise removal system (navigation, ads, sidebars automatically filtered)
  - Content clustering and paragraph quality scoring
  - Smart text cleaning and normalization
  - Excerpt generation with sentence-aware truncation
  - Multi-format output (detailed, summary, minimal)

### Enhanced
- **🔧 Content Script Architecture**
  - Intelligent content extractor class with multiple strategies
  - Element scoring system based on semantic value
  - Tree walker for efficient text extraction
  - Performance-optimized content processing
  - Robust error handling and graceful degradation

- **📱 Chat Interface Integration**
  - Page context buttons integrated into chat interface
  - Automatic content insertion into chat input
  - Debug logging for troubleshooting extraction issues
  - Better error messages and user guidance

### Technical Improvements
- **🏗️ Enhanced Architecture**
  - PageContextService with sophisticated formatting options
  - Content script auto-injection via manifest
  - Background script integration for content extraction
  - TypeScript interfaces for comprehensive page data
  - Modular extraction strategies for maintainability

## [0.9.0] - 2025-09-02

### 🚀 Provider SDK Upgrades & Model Expansion

### Added
- **🔧 Official Provider SDKs**
  - Migrated Groq to official `@ai-sdk/groq` package for better reliability
  - Migrated SambaNova to official `sambanova-ai-provider` package
  - Improved streaming performance and error handling
  - Better reasoning model support with proper temperature handling

- **🤖 New Groq Models**
  - `moonshotai/kimi-k2-instruct` - Moonshot AI's Kimi model
  - `compound-beta` - Compound AI's beta model
  - `compound-beta-mini` - Compound AI's mini beta model

- **🧠 New SambaNova Models**
  - **Text Models**: `DeepSeek-V3-0324`, `Llama-3.3-Swallow-70B-Instruct-v0.4`, `Meta-Llama-3.3-70B-Instruct`
  - **Reasoning Models**: `DeepSeek-R1-0528`, `DeepSeek-R1-Distill-Llama-70B`, `DeepSeek-V3.1`, `Qwen3-32B`
  - Enhanced reasoning capabilities with temperature exclusion for reasoning models

### Enhanced
- **⚡ Improved Error Handling**
  - Better error messages for model-specific issues
  - Graceful fallbacks for streaming problems
  - Enhanced debugging and logging for provider issues

- **🎯 Reasoning Model Support**
  - Automatic temperature exclusion for reasoning models to prevent AI SDK warnings
  - Support for both Groq and SambaNova reasoning models
  - Better handling of model-specific capabilities

### Fixed
- **🔧 Provider Connection Issues**
  - Resolved SambaNova connection failures with proper SDK integration
  - Fixed Groq streaming errors (`summaryParts` issues) with official SDK
  - Improved provider initialization and error recovery

- **📝 System Prompt Improvements**
  - Enhanced system prompts to ensure AI models answer questions directly
  - Reduced generic greeting responses in favor of specific answers
  - Better instruction following across all providers

## [0.7.0] - 2025-09-01

### 🎨 UI/UX Refinements & Responsive Design

### Enhanced
- **📱 Responsive Chat Layout**
  - Optimized padding for different modes (fullscreen: px-12 py-8, sidepanel: px-4 py-6)
  - Better chat bubble spacing and readability in sidepanel mode
  - Improved content flow and visual hierarchy

- **🔘 Always-Visible New Button**
  - "New" button now always visible in sub-toolbar
  - Appears faint/disabled when no conversations exist
  - Provides consistent UI layout and better user expectations

- **📋 Conversation List Improvements**
  - Removed duplicate "Conversations" header in sidepanel mode
  - Fixed conversation list height to stretch full screen in sidepanel
  - Proper width management (w-64 fullscreen, w-full sidepanel)
  - Clean, streamlined conversation management interface

### Fixed
- **⚖️ Fullscreen Layout Balance**
  - Fixed conversation sidebar taking too much space in fullscreen mode
  - Restored proper width ratio between sidebar and chat area
  - Maintained responsive design across different screen sizes

## [0.6.0] - 2025-09-01

### 🎯 Sidepanel Conversation Management & Enhanced UX

### Added
- **📱 Sidepanel Sub-toolbar**
  - New sub-toolbar in sidepanel mode with "New" and "Chats" navigation
  - Seamless conversation management without switching to fullscreen
  - SPA-like transitions between chat and conversation list views
  - Contextual "New Conversation" button (only shows when conversations exist)

- **💬 Sidepanel Conversation List**
  - Full conversation history access in sidepanel mode
  - Same rename/delete functionality as fullscreen mode
  - Auto-return to chat view when selecting conversations
  - Consistent conversation management across all modes

- **📜 Smart Scroll Management**
  - Scroll-to-bottom button with intelligent visibility (200px threshold)
  - Auto-scroll for new messages when user is at bottom
  - Manual scroll control with smooth scrolling behavior
  - Better handling of long conversations

- **✏️ Multi-line Input Support**
  - Textarea input with auto-resize functionality
  - Ctrl+Enter for new lines, Enter to send
  - Visual feedback with keyboard shortcut hints
  - Maximum height limit to prevent UI overflow

- **📋 Enhanced Copy Functionality**
  - "Copy Text" strips markdown formatting for clean text
  - Smart markdown-to-text conversion (removes **bold**, `code`, etc.)
  - Improved user experience for copying AI responses
  - Preserved markdown copy option (commented for future use)

### Enhanced
- **🎨 Improved Layout**
  - Dynamic content area spacing based on toolbar presence
  - Better visual hierarchy in sidepanel mode
  - Consistent button styling and iconography
  - Responsive design for different screen sizes

## [0.5.1] - 2025-09-01

### 🐛 Critical Bug Fixes & Error Handling

### Fixed
- **🔧 TypeScript Error Resolution**
  - Fixed error handling type checking for proper message property access
  - Enhanced error parameter typing with proper type guards
  - Improved error message extraction and display

- **⚠️ Enhanced Error Messages**
  - User-friendly error messages for model-specific issues
  - Clear guidance for "Developer instruction not enabled" errors
  - Helpful messages for image-generation model misuse
  - Better error handling for unsupported operations

- **🛠️ Streaming Response Improvements**
  - Fixed blank response boxes during error states
  - Better error detection during streaming responses
  - Improved error message display without breaking UI flow

## [0.5.0] - 2025-09-01

### 🎨 Enhanced User Experience & Real-time Updates

### Added
- **🎯 Centered Sample Prompts**
  - Sample prompts now properly centered in fullscreen mode for better visual balance
  - Improved layout with max-width container for optimal reading experience
  - Enhanced visual hierarchy in fullscreen conversations

- **⚡ Real-time Conversation Management**
  - Instant sidebar updates when deleting conversations
  - Live title updates when renaming conversations
  - Event-driven architecture for seamless UI synchronization
  - No manual refresh needed for conversation changes

### Fixed
- **🛑 Stop Response Error Handling**
  - Eliminated error messages when intentionally stopping AI responses
  - Enhanced cancellation detection for both "cancelled" and "aborted" requests
  - Clean UI state management during response interruption
  - Improved user experience with silent cancellation handling

### Enhanced
- **📱 Fullscreen Layout Optimization**
  - Better content positioning and spacing in fullscreen mode
  - Improved visual consistency across different screen sizes
  - Enhanced conversation sidebar integration with real-time updates

## [0.4.0] - 2025-09-01

### 🆕 Smart Conversation Management

### Added
- **➕ New Conversation Button**
  - Smart "New Conversation" button in header that only appears when there's existing conversation history
  - One-click conversation reset with clean state management
  - Plus icon with intuitive "Start new conversation" tooltip
  - Automatic conversation detection to show/hide button contextually
  - Event-driven architecture for clean state reset across components

- **📋 Fullscreen Conversation Sidebar**
  - Conversation history sidebar in fullscreen mode showing all past conversations
  - Truncated conversation titles (30 characters) with message count display
  - Three-dot menu for each conversation with rename and delete options
  - Inline editing for conversation titles with click-to-edit functionality
  - Session-based storage system for conversation management
  - Automatic sidepanel closure when opening fullscreen mode

### Enhanced
- **🎯 Contextual UI**
  - Header buttons now appear only when relevant to current state
  - Improved user experience with smart UI element visibility
  - Clean conversation state management with proper event handling
  - Better visual hierarchy with contextual controls
  - Fullscreen mode now provides complete conversation management interface

## [0.3.1] - 2025-08-31

### 🚀 Performance Optimization & Enhanced UX

### Added
- **🛑 Stop/Cancel Button**
  - Dynamic submit button transforms to stop button during AI responses
  - Clean cancellation without error messages
  - Keyboard support (Enter key) for stopping responses
  - Visual feedback with red destructive styling when in stop mode
  - Proper AbortController integration for request cancellation

### Fixed
- **⚡ Conversation Loading Performance**
  - Dramatically improved startup time from ~2-3 seconds to ~100ms
  - Removed heavy ConversationManager initialization overhead
  - Simplified to direct Chrome storage access for instant loading
  - Limited history to last 20 messages on startup for faster performance
  - Non-blocking history saves to prevent UI freezing

- **🔧 Error Handling Improvements**
  - Clean cancellation handling without showing error messages
  - Proper detection of user-cancelled requests vs actual errors
  - Silent cleanup when responses are intentionally stopped
  - Better error message differentiation for real vs cancelled requests

### Changed
- **📦 Lightweight Storage Architecture**
  - Replaced complex ConversationManager with simple Chrome storage
  - Direct Message[] storage without heavy metadata overhead
  - Quick history saves (last 50 messages) for optimal performance
  - Instant conversation loading without blocking operations

### Performance Improvements
- **🎯 Startup Optimization**
  - Eliminated async ConversationManager initialization
  - Direct storage reads for immediate history access
  - Reduced memory footprint during chat operations
  - Faster message processing and UI updates

## [0.3.0] - 2025-08-31

### 🎯 Enhanced Chat Experience & Persistent History

### Added
- **💾 Persistent Chat History**
  - Chat conversations now persist across sidepanel ↔ fullscreen mode switches
  - Automatic conversation loading on extension startup
  - Seamless continuation of conversations regardless of UI mode
  - Integration with ConversationManager for robust history management
  - No data loss when closing/reopening extension

- **⚡ Improved Streaming Experience**
  - Enhanced streaming response visualization with real-time content display
  - Graceful streaming with proper Markdown rendering during generation
  - Subtle pulsing cursor indicator for active streaming
  - Smooth transition from "Thinking..." to actual content streaming
  - Better visual feedback during AI response generation

### Fixed
- **🔧 Chat Interface Improvements**
  - Copy and Retry buttons now only appear after AI response is complete
  - Eliminated empty response boxes during loading states
  - Fixed premature button display during streaming responses
  - Improved streaming state management and visual consistency
  - Better error handling for conversation history operations

- **🔄 Provider Context Handling**
  - Enhanced AIService to handle both ChatMessage[] and ProviderMessage[] formats
  - Improved context optimization for different AI providers
  - Better message format conversion and validation
  - Fixed compatibility issues between ConversationManager and AIService

### Changed
- **📱 Cross-Mode Continuity**
  - Chat state now maintained in persistent storage instead of component state
  - Conversations automatically resume when switching between modes
  - Enhanced user experience with seamless mode transitions
  - Improved conversation context preservation across sessions

### Technical Improvements
- **🏗️ Architecture Enhancements**
  - Integrated ConversationManager with ChatPanel for persistent storage
  - Enhanced message handling with proper conversation history tracking
  - Improved streaming content management with separate state handling
  - Better separation of UI state and persistent conversation data
  - Enhanced error recovery and conversation restoration mechanisms

## [0.2.0] - 2025-08-31

### 🚀 MAJOR RELEASE: Advanced Performance Optimization & Memory Management

### Added
- **⚡ Lazy Loading System**
  - Intelligent lazy loading for conversation messages with configurable thresholds
  - Memory-efficient session loading with LRU cache management
  - Automatic cache cleanup when memory limits are exceeded
  - Performance-aware loading with size estimation and optimization
  - Smart threshold adjustment based on usage patterns (default: 50 messages)

- **🗜️ Message Compression Engine**
  - Web Worker-based compression system with fallback mechanisms
  - Automatic compression for messages older than configurable age (default: 7 days)
  - Real-time compression/decompression with performance monitoring
  - Compression ratio tracking and optimization metrics
  - Graceful degradation when compression fails

- **🧹 Automatic Cleanup Policies**
  - Intelligent cleanup system with age-based session deletion
  - Configurable cleanup frequency (default: 24 hours)
  - Session count limits with LRU eviction (default: 20 concurrent sessions)
  - Message count enforcement per session (default: 100 messages)
  - Space usage optimization with automatic compression triggers

- **📊 Performance Monitoring & Analytics**
  - Real-time performance metrics collection (memory usage, load times, cache hit rates)
  - Continuous performance monitoring with configurable intervals (default: 30 minutes)
  - Automatic performance optimization triggers at 75% memory usage
  - Performance scoring system (0-100) with actionable recommendations
  - Emergency recovery system for critical performance situations

- **🎯 Context Processing Optimization**
  - Advanced context optimization for large conversation histories
  - Smart message truncation with system message preservation
  - Content compression for oversized messages with quality preservation
  - Provider-specific optimization strategies and token limits
  - Async context processing with performance metrics tracking

- **⚙️ Comprehensive Performance Settings**
  - `enableLazyLoading`: Toggle lazy loading functionality
  - `lazyLoadThreshold`: Messages count before lazy loading (default: 50)
  - `enableCompression`: Toggle message compression
  - `compressionThreshold`: Days before compression (default: 7)
  - `maxMemoryUsage`: Memory limit in MB (default: 50MB)
  - `enablePerformanceMonitoring`: Toggle monitoring system
  - `cleanupFrequency`: Hours between cleanup runs (default: 24)
  - `maxConcurrentSessions`: Max sessions in memory (default: 20)

### Enhanced
- **🔄 Conversation Manager Improvements**
  - Async method signatures for better performance handling
  - Integration with performance optimizer for large session management
  - Enhanced provider switching with context optimization
  - Performance-aware context generation for AI providers
  - Memory usage monitoring and automatic optimization

- **💾 Advanced Storage Management**
  - Performance-optimized storage operations with caching
  - Intelligent session loading with lazy loading integration
  - Enhanced cleanup policies with compression support
  - Storage statistics and usage monitoring
  - Automatic performance optimization triggers

- **🧠 Context Processor Enhancements**
  - Performance-aware context optimization for large histories
  - Provider-specific optimization settings and strategies
  - Async context processing with performance monitoring
  - Smart truncation algorithms with content preservation
  - Token counting optimization and caching

### Performance Features
- **📈 Performance Manager**
  - Centralized performance coordination and optimization
  - Automatic performance tuning based on usage patterns
  - Performance report generation with actionable insights
  - Emergency performance recovery for critical situations
  - Configuration optimization based on real-time metrics

- **🔍 Performance Monitor**
  - Continuous background monitoring with configurable intervals
  - Automatic issue detection and resolution recommendations
  - Performance trend analysis and optimization suggestions
  - Memory usage alerts and automatic cleanup triggers
  - Cache efficiency monitoring and optimization

- **🛠️ Performance Integration Service**
  - Complete performance optimization workflow management
  - Automated performance recovery and optimization
  - Continuous performance maintenance and tuning
  - Emergency performance recovery protocols
  - Performance status reporting and recommendations

### Technical Improvements
- **🏗️ Enhanced Architecture**
  - New performance optimization service layer
  - Web Worker integration for CPU-intensive operations
  - Advanced caching strategies with intelligent eviction
  - Memory management with automatic cleanup
  - Performance metrics collection and analysis

- **🔧 Developer Experience**
  - Comprehensive performance debugging tools
  - Performance integration examples and documentation
  - Configurable performance thresholds and policies
  - Performance testing utilities and benchmarks
  - Extensive TypeScript interfaces for performance features

### Breaking Changes
- ConversationManager methods are now async for better performance handling
- Enhanced settings structure with new performance configuration options
- Updated storage format to support compression and performance metadata

### Migration Guide
- Existing conversations will be automatically migrated to support new performance features
- Performance monitoring is enabled by default but can be disabled in settings
- Memory limits are set conservatively (50MB) but can be adjusted based on device capabilities

## [3.3.1] - 2025-08-31

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

## [3.3.0] - 2025-08-31

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

## [3.2.0] - 2025-08-30

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

## [3.1.0] - 2025-08-30

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

## [3.0.0] - 2025-08-30

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

## [2.0.1] - 2025-08-30

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

## [2.0.0] - 2025-08-30

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

## [0.4.0] - 2025-08-30

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

## [0.3.0] - 2025-08-30

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

## [0.2.0] - 2025-08-30

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