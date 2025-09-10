# Changelog

All notable changes to Delight will be documented in this file.

## [1.3.0] - 2025-10-09

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