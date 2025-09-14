# Changelog

All notable changes to Delight will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.2] - 2025-09-13

### Added
- Automatic retry with exponential backoff for failed requests
- Intelligent fallback provider switching when primary provider fails
- Network connectivity monitoring and handling
- Enhanced error classification (network, rate limit, authentication, configuration)
- Real-time network connectivity detection
- Provider connectivity testing with detailed status reporting
- Smart error detection for temporary vs permanent failures
- ErrorRecoveryService with sophisticated retry logic
- Connectivity settings panel for monitoring provider status
- Visual network status indicators in settings
- Provider connectivity testing with one-click diagnostics

### Enhanced
- Robust error handling across all AI providers
- BaseAIProvider with improved error detection and handling
- AIService integration with automatic fallback capabilities
- Better error messages and user feedback
- Seamless experience during network issues or provider outages
- Transparent fallback notifications when alternative providers are used

### Changed
- Simplified connectivity panel for regular users (technical settings commented out)
- Updated tab name from "Network & Recovery" to "Connectivity"
- Improved user-friendly language for connection status

## [1.4.1] - 2025-09-13

### Added
- Right-click context menus for instant AI assistance
- "Open Delight", "Summarize with Delight", "Chat about page", "Explain with Delight", "Rewrite with Delight" options
- Smart auto-send functionality for all context menu actions
- Automatic page context attachment for page-level actions
- AI accuracy disclaimer with educational content
- Dedicated accuracy information page explaining AI limitations
- Best practices guide for responsible AI usage

### Enhanced
- Auto-send functionality for context menu actions
- Automatic page context attachment for page-level commands
- New chat creation for each context action
- Reliable content script injection with conflict prevention

### Fixed
- Content script variable conflicts ($ identifier redeclaration)
- Improved error handling for page context extraction
- Better timing for auto-send functionality
- Optimized content script injection strategy

## [1.4.0] - 2025-09-13

### 🎯 Context Menu Integration
- **NEW**: Right-click context menus for instant AI assistance
- **NEW**: "Open Delight" - Quick access to extension
- **NEW**: "Summarize with Delight" - Auto-summarize any webpage
- **NEW**: "Chat about page with Delight" - Discuss page content with AI
- **NEW**: "Explain with Delight" - Explain selected text
- **NEW**: "Rewrite with Delight" - Improve selected text

### 🚀 Smart Automation
- **ENHANCED**: Auto-send functionality for all context menu actions
- **ENHANCED**: Automatic page context attachment for page-level actions
- **ENHANCED**: New chat creation for each context action
- **ENHANCED**: Reliable content script injection with conflict prevention

### 🛡️ AI Accuracy & Trust
- **NEW**: AI accuracy disclaimer with educational content
- **NEW**: Dedicated accuracy information page explaining AI limitations
- **NEW**: Best practices guide for responsible AI usage
- **NEW**: Clickable disclaimer linking to comprehensive AI safety information

### 🔧 Technical Improvements
- **FIXED**: Content script variable conflicts ($ identifier redeclaration)
- **ENHANCED**: Improved error handling for page context extraction
- **ENHANCED**: Better timing for auto-send functionality
- **ENHANCED**: Optimized content script injection strategy

### 🎨 User Experience
- **ENHANCED**: Seamless workflow from right-click to AI response
- **ENHANCED**: Context-aware prompts with automatic page attachment
- **ENHANCED**: Preserved starter prompts when no context actions pending
- **ENHANCED**: Clear visual feedback for all context menu interactions

## [1.3.4] - 2025-09-11

### 🧠 Agent System Overhaul
- **NEW**: Agent Memory System - Persistent context and conversation history across automation steps
- **NEW**: Agent Messaging - Structured communication between agents with typed message schemas  
- **NEW**: Iterative Execution Pattern - Inspired by Vercel AI SDK's approach (plan → execute → store → repeat)
- **ENHANCED**: Tool-Based Planning - Planner creates simple tool calls instead of complex upfront plans
- **ENHANCED**: Context-Aware Planning - Planner sees actual page elements before planning interactions
- **REFACTORED**: Simplified main execution flow - removed complex routing, kept specialized agents as utilities

### 🔧 Technical Improvements
- Added AgentMemory class for persistent context management
- Added AgentMessenger for structured agent communication
- Added MessageTypes for type-safe agent messaging
- Enhanced MonitorAgent with messaging and memory capabilities
- Updated PlannerAgent to use memory and conversation history
- Updated NavigatorAgent to store execution results in memory
- Simplified AgentOrchestrator for iterative execution pattern

### 🛠️ Architecture Changes
- Moved from complex multi-agent orchestration to simple iterative pattern
- Specialized agents (FormHandler, DataExtractor, SearchAgent, ErrorRecovery) kept as utilities
- Memory-driven context sharing between planning iterations
- Tool-based approach prevents CSS selector guessing issues

## [1.3.3] - 2025-09-10

### 🌐 Universal Automation System
- **NEW**: Complete rebuild of automation system focusing on reliability over complexity
- **NEW**: Works on ANY page including chrome://, edge://, settings, and new tabs without restrictions
- **ENHANCED**: True planner-navigator-planner flow with smart re-planning and reliable visual highlighting
- **ENHANCED**: Streamlined actions that work consistently across all page types

### 🤖 Multi-Agent Framework
- **NEW**: 6 specialized agents working together (Planner, Navigator, Monitor, PageAnalyzer, FormHandler, DataExtractor)
- **NEW**: Intelligent routing system that directs tasks to appropriate specialized agents
- **NEW**: Advanced error recovery and validation at every step
- **ENHANCED**: Real-time progress monitoring with clear execution logging

### 🏆 GPT-OSS Integration
- **NEW**: OpenAI's open-weight reasoning models (gpt-oss-120b, gpt-oss-20b)
- **NEW**: Dual hosting options - Groq hosted for speed + Ollama local for privacy
- **NEW**: Complete privacy option with local inference and no API costs

### 🛠️ AI Tools & Features
- **NEW**: 10 specialized AI tools for content manipulation (explain, rewrite, tone changes)
- **NEW**: Smart page attachment with Twitter-card style previews
- **ENHANCED**: Persistent context throughout conversations
- **ENHANCED**: Multi-provider support with 27+ models across 8 providers

### 🚀 Performance & UX
- **NEW**: Lightning-fast conversation loading (~100ms vs 2-3 seconds before)
- **NEW**: Intelligent memory management with automatic cleanup
- **NEW**: Seamless mode switching between sidepanel and fullscreen
- **ENHANCED**: Non-blocking operations and optimized storage

## [1.3.2] - 2025-09-10

### 🤖 Agent System Foundation
- **NEW**: Multi-agent automation system with Planner, Navigator, and Monitor agents
- **NEW**: Puppeteer Core integration with ExtensionTransport for reliable browser automation
- **NEW**: Advanced DOM analysis with element indexing and visual highlighting
- **NEW**: Universal page support including restricted pages (chrome://, edge://)

### 🔧 Core Infrastructure
- **NEW**: ActionRegistry with 15+ automation actions across 8 categories
- **NEW**: BrowserStateManager with element change detection
- **NEW**: Anti-detection scripts for stealth automation
- **ENHANCED**: Error recovery with retry logic and fallback strategies

### 📊 Data & Context
- **NEW**: Smart tab detection and intelligent wait conditions
- **NEW**: Dynamic re-planning based on page analysis results
- **ENHANCED**: Structured data extraction with performance caching

## [1.3.1] - 2025-09-10

### 🌐 Multi-Provider Expansion
- **NEW**: Added Groq provider for ultra-fast inference
- **NEW**: Added SambaNova provider with Llama models (1B-405B parameters)
- **NEW**: Added Grok (X.AI) provider with witty personality
- **ENHANCED**: Provider selection UI with performance indicators

### 🚀 Performance Optimizations
- **NEW**: Lazy loading system for conversation messages
- **NEW**: Message compression with Web Worker processing
- **NEW**: Automatic cleanup policies with age-based deletion
- **ENHANCED**: Memory management with LRU eviction

### 💬 Chat Experience
- **NEW**: Persistent chat history across mode switches
- **NEW**: Enhanced streaming with graceful visualization
- **NEW**: Smart button timing (copy/retry appear after completion)
- **ENHANCED**: Conversation continuity and restoration

## [1.3.0] - 2025-09-09

### Added
- **Enterprise Agent Automation**: Advanced Puppeteer CDP integration with anti-detection measures
- **Action Registry Pattern**: Dynamic schema generation for structured LLM responses
- **Visual DOM Analysis**: Interactive element detection with numbered highlighting overlays
- **Performance Optimization**: DOM caching with WeakMap, viewport filtering, and change detection
- **Smart Action System**: Multiple execution modes (index, selector, query) with intelligent retry logic
- **Enhanced Error Recovery**: Robust fallback mechanisms and graceful degradation
- **ExtensionTransport**: Direct Chrome DevTools Protocol connection to browser tabs

### Enhanced
- **DOM Analysis**: Real-time visual highlighting with numbered elements for better debugging
- **Agent Coordination**: Improved multi-agent workflow with better error handling
- **Performance**: Significant speed improvements with intelligent caching and viewport optimization
- **Reliability**: Enhanced retry logic and multiple execution strategies for actions

### Technical Improvements
- Puppeteer browser-specific entrypoint integration for Chrome extensions
- WeakMap-based DOM caching for computed styles and bounding rectangles
- TreeWalker optimization for efficient DOM traversal
- Dynamic action schema generation with Zod validation
- Anti-detection measures including navigator property spoofing

## [1.2.0] - 2025-09-15

### Added
- **GPT-OSS Integration**: OpenAI's open-weight reasoning models (gpt-oss-120b, gpt-oss-20b)
- **Dual GPT-OSS Hosting**: Groq hosted + Ollama local options
- **Complete Agent Automation**: Cross-browser automation with 25+ actions
- **Multi-Agent System**: Planner, Navigator, Monitor coordination
- **Natural Language Tasks**: Describe complex web automation in plain English
- **Real-time Execution**: Visual progress monitoring and error recovery

### Enhanced
- **AI Tools System**: 10 specialized tools (explain, rewrite, tone changes)
- **Smart Page Attachment**: Twitter-card style previews with persistent context
- **Multi-Provider Support**: 8 major AI providers with 27+ models
- **Performance Optimized**: Lightning-fast loading and memory management

## [1.1.0] - 2025-08-20

### Added
- **Multi-Provider AI Support**: OpenAI, Anthropic, Google Gemini, Grok, Groq, SambaNova
- **Interactive Chat**: Streaming responses with conversation history
- **Page Summarization**: AI-powered content analysis and summarization
- **Sidepanel Integration**: Native Chrome sidepanel support
- **Fullscreen Mode**: Enhanced experience with conversation sidebar

### Enhanced
- **Performance**: Lazy loading and message compression
- **Memory Management**: Intelligent cache management with LRU eviction
- **User Experience**: Seamless mode switching and conversation continuity

## [1.0.0] - 2025-07-10

### Added
- **Initial Release**: Basic AI chat functionality
- **OpenAI Integration**: GPT-4 and GPT-3.5 Turbo support
- **Chrome Extension**: Manifest V3 architecture
- **Basic UI**: Popup and sidepanel interfaces
- **Settings Management**: API key configuration and model selection

---

**Legend:**
- 🆕 New Feature
- 🔧 Enhancement
- 🐛 Bug Fix
- 🔒 Security
- ⚡ Performance
- 📚 Documentation