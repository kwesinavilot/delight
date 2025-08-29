# Delight - AI-Powered Chrome Extension

> An intelligent Chrome extension that provides AI-powered chat and page summaries using flexible LLM providers.

## 🌟 Features

- **Multi-Provider AI Support**: Choose between OpenAI (GPT models) and Anthropic (Claude models)
- **Intelligent Chat**: Interactive AI conversations with streaming responses
- **Page Summaries**: Generate summaries of web pages in different lengths (short, medium, detailed)
- **Flexible Configuration**: Easy provider switching and API key management
- **Modern UI**: Clean, responsive interface with dark mode support
- **Privacy-Focused**: Secure local storage of API keys with encryption
- **Multiple Interfaces**: Popup, side panel, and keyboard shortcuts

## 🚀 Quick Start

### Prerequisites

- Chrome browser (version 88+)
- API key from OpenAI or Anthropic (or both)

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
2. **Go to Settings** and configure your AI provider:
   - **OpenAI**: Add your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - **Anthropic**: Add your API key from [Anthropic Console](https://console.anthropic.com/)
3. **Select your preferred model** and adjust settings as needed

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
- **Providers**: Individual implementations for OpenAI and Anthropic
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
- **Models**: GPT-4o, GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
- **Features**: Streaming responses, function calling, vision (where supported)
- **Use Cases**: General conversation, creative writing, code assistance

#### Anthropic
- **Models**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Features**: Large context windows, ethical AI responses
- **Use Cases**: Research, analysis, long-form content

### Settings

```typescript
interface AIConfiguration {
  provider: 'openai' | 'anthropic';
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

### Current Version (0.4.0)
- ✅ Multi-provider AI support (OpenAI, Anthropic)
- ✅ Secure configuration management
- ✅ Core AI service architecture
- 🔄 UI integration (in progress)

### Upcoming Features
- 🔲 Advanced summary customization
- 🔲 Chat history and persistence
- 🔲 Custom prompt templates
- 🔲 Batch processing for multiple pages
- 🔲 Export functionality for conversations
- 🔲 Additional AI providers (Google, Cohere)

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

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/delight-extension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/delight-extension/discussions)
- **Email**: support@delight-extension.com

---

**Made with ❤️ by the Delight team**