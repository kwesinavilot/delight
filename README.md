# Delight - AI-Powered Chrome Extension

> An intelligent Chrome extension that provides AI-powered chat and page summaries using flexible LLM providers.

## 🎉 **Version 1.0.1 - Streamlined Experience**

**NEW**: 5 free AI requests to try all features immediately! Complete with AI tools system, smart page attachment, and enhanced browser compatibility.

Now supporting **6 major AI providers** with **25+ models** for every use case:
- ⚡ **Groq** - Ultra-fast inference (NEW!)
- 🤖 **OpenAI** - GPT-4o, GPT-4 Turbo
- 🧠 **Anthropic** - Claude 3.5 Sonnet, Opus
- 🔍 **Google Gemini** - 1.5 Pro/Flash, Vision
- 😄 **Grok (X.AI)** - Witty personality, real-time info
- 🦙 **SambaNova** - Llama 3.1/3.2 (1B-405B)

## 🌟 Features

### 🚀 Core AI Features
- **Multi-Provider AI Support**: Choose between 6 major AI providers - OpenAI, Anthropic, Google Gemini, Grok (X.AI), Groq, and SambaNova
- **AI Tools System**: 10 specialized tools for explaining, rewriting (paraphrase, improve, expand, shorten), and tone changes (academic, professional, persuasive, casual, funny)
- **Interactive Sample Prompts**: One-click prompt insertion for common tasks like page summarization
- **Intelligent Chat**: Interactive AI conversations with streaming responses
- **Smart Page Content Extraction**: Sophisticated system that can extract and analyze content from any webpage structure
- **Enhanced Page Attachment**: Twitter-card style page previews with persistent context throughout conversations

### ⚡ Performance & Memory Management (v4.0.0+)
- **Lazy Loading System**: Intelligent loading of conversation messages with configurable thresholds
- **Message Compression**: Automatic compression for old messages with Web Worker processing
- **Automatic Cleanup**: Smart cleanup policies with age-based deletion and space optimization
- **Performance Monitoring**: Real-time metrics tracking with automatic optimization triggers
- **Memory Management**: Intelligent cache management with LRU eviction and memory limits
- **Context Optimization**: Advanced processing for large conversation histories

### 💾 Chat Experience & History (v4.1.0+)
- **Persistent Chat History**: Conversations persist across sidepanel ↔ fullscreen mode switches
- **Seamless Mode Switching**: Continue conversations without interruption when changing modes
- **Enhanced Streaming**: Real-time content display with graceful streaming visualization
- **Smart Button Timing**: Copy/retry buttons only appear after AI responses are complete
- **Conversation Continuity**: Automatic conversation loading and restoration on startup

### 🚀 Performance & UX (NEW in v4.1.1)
- **Lightning-Fast Loading**: Conversation history loads in ~100ms (vs 2-3 seconds before)
- **Stop/Cancel Button**: Dynamic button to stop AI responses with clean cancellation
- **Optimized Storage**: Lightweight message storage for instant access
- **Non-blocking Operations**: All saves happen asynchronously without UI freezing
- **Smart History Management**: Only loads recent messages for optimal performance

### 📱 Sidepanel Conversation Management (NEW in v4.5.0)
- **Sub-toolbar Navigation**: "New" and "Chats" buttons in sidepanel mode for easy conversation access
- **Sidepanel Conversation List**: Full conversation history with rename/delete in compact sidepanel view
- **Smart Scroll Controls**: Scroll-to-bottom button with intelligent visibility and auto-scroll behavior
- **Multi-line Input**: Textarea support with Ctrl+Enter for new lines and auto-resize functionality
- **Enhanced Copy Options**: Smart text copying with markdown stripping for clean, readable text
- **Seamless Navigation**: SPA-like transitions between chat and conversation views

### ➕ Smart Conversation Management
- **New Conversation Button**: Contextual button that only appears when there's existing conversation history
- **Fullscreen Conversation Sidebar**: Complete conversation history with sidebar navigation in fullscreen mode
- **Conversation Management**: Rename, delete, and switch between conversations with three-dot menu
- **Session-Based Storage**: Persistent conversation sessions with automatic saving and loading
- **One-Click Reset**: Instantly start fresh conversations with clean state management
- **Intelligent UI**: Smart visibility controls for better user experience
- **Event-Driven Architecture**: Clean state management across all components

### 🎨 User Experience
- **Smart Conversation Management**: Contextual "New Conversation" button that appears only when needed
- **Fullscreen Conversation Sidebar**: Complete conversation history navigation with rename/delete capabilities (Chrome only)
- **Robust Sidepanel Management**: Enhanced tab validation, smart selection, and error recovery
- **Fullscreen Mode**: Seamless switching between sidepanel and fullscreen experience (Chrome only)
- **Browser Compatibility**: Automatic Edge detection with graceful feature degradation
- **Comprehensive Documentation**: Interactive user guide with troubleshooting and FAQ
- **Enhanced Onboarding**: Welcome flow opens directly in sidepanel mode for better UX
- **Flexible Configuration**: Easy provider switching and API key management
- **Modern UI**: Clean, responsive interface with dark mode support and improved layouts

### 🔒 Security & Privacy
- **Privacy-Focused**: Secure local storage of API keys with encryption - [Privacy Policy](PRIVACY.md)
- **Local Processing**: All performance optimization happens locally
- **Streamlined Interface**: Side panel and fullscreen modes with keyboard shortcuts

## 🚀 Quick Start

### Prerequisites

- **Chrome browser (version 88+)** - Recommended for full functionality
- **Microsoft Edge (version 88+)** - Supported with limited features (sidepanel mode only)
- **No API key required initially** - Start with 5 free requests!
- API key from supported AI providers for continued use (Google Gemini recommended - free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/delight-extension.git
   cd delight-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Configuration

1. **Open the extension** (click the icon or use `Ctrl+Shift+Q`)
2. **Go to Settings** and configure your preferred AI provider(s):
   - **OpenAI**: Add your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - **Anthropic**: Add your API key from [Anthropic Console](https://console.anthropic.com/)
   - **Google Gemini**: Add your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - **Grok (X.AI)**: Add your API key from [X.AI Console](https://console.x.ai/)
   - **Groq**: Add your API key from [Groq Console](https://console.groq.com/keys)
   - **SambaNova**: Add your API key from [SambaNova Cloud](https://cloud.sambanova.ai/)
3. **Try it immediately** with 5 free requests, then add your API key for continued use

## 🛠️ Development

### Project Structure

```
delight-extension/
├── src/
│   ├── components/          # React components
│   │   ├── Chat/           # Chat interface components
│   │   ├── Summary/        # Summary panel components
│   │   └── ui/             # Reusable UI components
│   ├── services/           # Core business logic
│   │   ├── ai/             # AI service layer
│   │   │   ├── providers/  # AI provider implementations
│   │   │   └── AIService.ts # Main AI orchestration
│   │   └── config/         # Configuration management
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── pages/              # Extension pages (popup, sidepanel)
│   └── background/         # Background scripts
├── public/                 # Static assets and manifest
└── tests/                  # Test files
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run clean` - Clean build artifacts
- `npm test` - Run test suite

### Architecture

The extension uses a modular architecture with clear separation of concerns:

#### AI Service Layer
- **AIService**: Main orchestration layer managing provider interactions
- **Providers**: Individual implementations for OpenAI, Anthropic, Gemini, Grok, Groq, and SambaNova
- **Configuration**: Secure management of API keys and settings

#### UI Components
- **React + TypeScript**: Modern component-based architecture
- **Tailwind CSS**: Utility-first styling with Radix UI components
- **Responsive Design**: Works seamlessly in popup and side panel modes

#### Chrome Extension APIs
- **Manifest V3**: Modern extension architecture with service workers
- **Storage API**: Secure, encrypted storage of user preferences
- **Content Scripts**: Page interaction for summary generation

## 🔧 Configuration Options

### AI Providers

#### OpenAI
- **Models**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
- **Features**: Streaming responses, function calling, reliable performance
- **Use Cases**: General conversation, creative writing, code assistance
- **Context**: Up to 128K tokens

#### Anthropic (Claude)
- **Models**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **Features**: Large context windows, ethical AI responses, safety-focused
- **Use Cases**: Research, analysis, long-form content, complex reasoning
- **Context**: Up to 200K tokens

#### Google Gemini
- **Models**: Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini 1.0 Pro, Gemini Pro Vision
- **Features**: Ultra-fast responses, multimodal capabilities, vision support
- **Use Cases**: Real-time chat, image analysis, quick responses, high-volume usage
- **Context**: Up to 2M tokens (Gemini 1.5 Pro)

#### Grok (X.AI)
- **Models**: Grok Beta
- **Features**: Witty personality, real-time information access, humor
- **Use Cases**: Conversational AI, creative writing, engaging content, current events
- **Context**: Up to 131K tokens

#### Groq
- **Models**: Llama 3.1/3.3/4, Mixtral, Gemma, Qwen, DeepSeek
- **Features**: Ultra-fast inference, high-performance computing, low latency
- **Use Cases**: Real-time applications, high-volume processing, speed-critical tasks
- **Context**: Up to 131K tokens
- **Performance**: Industry-leading inference speed

#### SambaNova (Llama Models)
- **Models**: Llama 3.1 (8B, 70B, 405B), Llama 3.2 (1B, 3B, 11B, 90B Vision)
- **Features**: High-performance computing, open-source models, vision support
- **Use Cases**: Performance-focused tasks, research, scalable deployment
- **Context**: Up to 131K tokens

### Settings

```typescript
interface AIConfiguration {
  provider: 'openai' | 'anthropic' | 'gemini' | 'grok' | 'groq' | 'sambanova';
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}
```

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure
- **Unit Tests**: Individual component and service testing
- **Integration Tests**: End-to-end workflow testing
- **Mocked APIs**: Isolated testing without external dependencies

## 🔒 Security & Privacy

- **Local Storage**: All data stored locally in Chrome's secure storage
- **API Key Encryption**: Basic encryption for stored credentials
- **No Data Collection**: Extension doesn't collect or transmit user data
- **Secure Communication**: Direct HTTPS communication with AI providers

## 📋 Roadmap

### Current Version (1.0.1)
- ✅ **Free Trial System**: 5 free AI requests for immediate user onboarding
- ✅ **AI Tools System**: 10 specialized tools (explain, rewrite, tone changes)
- ✅ **Smart Page Attachment**: Twitter-card style previews with persistent context (sidepanel only)
- ✅ **Enhanced Browser Compatibility**: Edge support with graceful degradation
- ✅ **Complete Documentation**: User guide, privacy policy, and welcome flow
- ✅ **Multi-Provider Support**: 6 major AI providers with 25+ models
- ✅ **Streamlined Interface**: Focused sidepanel experience with fullscreen option
- ✅ **Performance Optimized**: Lightning-fast loading and memory management
- ✅ **Secure & Private**: Local storage with encryption, no data collection

### Upcoming Features
- 🔲 Advanced summary customization
- 🔲 Custom prompt templates
- 🔲 Batch processing for multiple pages
- 🔲 Export functionality for conversations
- 🔲 Additional AI providers (Cohere, Mistral)
- 🔲 Multi-language support

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure tests pass: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vercel AI SDK](https://sdk.vercel.ai/) for the excellent AI integration library
- [Radix UI](https://www.radix-ui.com/) for accessible UI components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [OpenAI](https://openai.com/) and [Anthropic](https://www.anthropic.com/) for their powerful AI models

## 🌐 Browser Compatibility

### Chrome (Recommended)
- ✅ Full feature support
- ✅ Sidepanel and fullscreen modes
- ✅ All AI tools and page attachment
- ✅ Seamless mode switching

### Microsoft Edge
- ✅ Sidepanel mode fully supported
- ⚠️ Fullscreen mode supported but may have issues
- ✅ All AI tools and page attachment
- ⚠️ Some Chrome-specific behaviors may differ

**Note**: For the best experience, we recommend using Google Chrome. Edge users will receive helpful notifications about feature limitations.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/delight-extension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/delight-extension/discussions)
- **Email**: support@delight-extension.com

---

**Made with ❤️ by the Delight team**