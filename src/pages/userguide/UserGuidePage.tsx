import { useState } from 'react';
import { 
  BookOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  RocketLaunchIcon,
  CogIcon,
  ChatBubbleLeftRightIcon,
  // DocumentTextIcon,
  KeyIcon,
  BoltIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  // PaperClipIcon
} from '@heroicons/react/24/outline';

const UserGuidePage: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'getting-started': true
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <RocketLaunchIcon className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Quick Setup</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Open Delight by clicking the extension icon or using <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">Ctrl+Shift+Q</kbd></li>
              <li>Go to Settings → Appearance to choose your preferred theme</li>
              <li>Go to Settings → AI Providers to configure your first AI provider</li>
              <li>Add your API key and test the connection</li>
              <li>Start chatting!</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Access Methods</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li><strong>Popup:</strong> Click the extension icon in the toolbar</li>
              <li><strong>Side Panel:</strong> Opens automatically or via context menu</li>
              <li><strong>Keyboard Shortcut:</strong> <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">Ctrl+Shift+Q</kbd> (or <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">Cmd+Shift+Q</kbd> on Mac)</li>
              <li><strong>Context Menu:</strong> Right-click on any page and select "Summarize with Delight"</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'ai-providers',
      title: 'AI Providers',
      icon: <BoltIcon className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Supported Providers</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 dark:text-white">OpenAI</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">GPT-4o, GPT-4 Turbo, GPT-3.5</p>
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800">Get API Key →</a>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 dark:text-white">Anthropic</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Claude 3.5 Sonnet, Opus, Haiku</p>
                <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800">Get API Key →</a>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 dark:text-white">Google Gemini</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gemini 2.5 Pro, Flash, Vision</p>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800">Get API Key →</a>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 dark:text-white">Grok (X.AI)</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Witty AI with real-time info</p>
                <a href="https://console.x.ai/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800">Get API Key →</a>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 dark:text-white">Groq</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ultra-fast inference (800+ tokens/sec)</p>
                <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800">Get API Key →</a>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 dark:text-white">SambaNova</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Llama models (1B-405B parameters)</p>
                <a href="https://cloud.sambanova.ai/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800">Get API Key →</a>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Configuration Steps</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Go to Settings → AI Providers</li>
              <li>Select your preferred provider by clicking the radio button</li>
              <li>Enter your API key (get it from the provider's website)</li>
              <li>Choose your preferred model from the dropdown</li>
              <li>Click "Test" to verify the connection</li>
              <li>Save your configuration</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'ai-tools',
      title: 'AI Tools & Page Attachment',
      icon: <WrenchScrewdriverIcon className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Using AI Tools</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Type your text in the input area</li>
              <li>Click the tools icon (🔧) next to the send button</li>
              <li>Choose from 10 specialized tools organized in categories:</li>
            </ol>
            <div className="ml-6 mt-2 space-y-2">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 dark:text-white">Quick Tools</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Explain:</strong> Get detailed, simplified explanations</p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 dark:text-white">Rewrite Tools</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Paraphrase, Improve, Expand, Shorten:</strong> Transform your content</p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 dark:text-white">Change Tone</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Academic, Professional, Persuasive, Casual, Funny:</strong> Adjust writing style</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Attaching Page Content</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Navigate to any webpage you want to analyze</li>
              <li>Open Delight (popup, sidepanel, or fullscreen)</li>
              <li>Click the paperclip icon (📎) next to the tools button</li>
              <li>Select "Attach Page Content" from the dropdown</li>
              <li>The page content will appear as a Twitter-card style preview</li>
              <li>Type your question or use an AI tool with the attached content</li>
              <li>The AI will use the page content as context for its response</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Pro Tips</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Combine tools with page content: Attach a page, then use "Explain" to understand complex articles</li>
              <li>Use "Improve" tool with your own writing for better clarity and flow</li>
              <li>Try "Academic" tone for research papers or "Casual" for social media posts</li>
              <li>Page content stays attached throughout your conversation for follow-up questions</li>
              <li>Tools are disabled until you configure an AI provider</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'features',
      title: 'Core Features',
      icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">AI Chat</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Real-time streaming responses from 6 major AI providers</li>
              <li>Support for 25+ different AI models</li>
              <li>Persistent chat history within sessions</li>
              <li>Markdown formatting support</li>
              <li>Error handling with helpful messages</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">AI Tools System</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li><strong>Explain Tool:</strong> Get in-depth, simplified explanations of any concept or text</li>
              <li><strong>Rewrite Tools:</strong> Paraphrase, improve, expand, or shorten your content</li>
              <li><strong>Tone Change Tools:</strong> Convert text to academic, professional, persuasive, casual, or funny tones</li>
              <li><strong>Easy Access:</strong> Click the tools icon (🔧) next to the send button</li>
              <li><strong>One-Click Selection:</strong> Choose a tool and it automatically modifies your prompt</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Smart Page Attachment</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li><strong>Attach Page Content:</strong> Click the paperclip icon (📎) to attach current webpage content</li>
              <li><strong>Twitter-Card Preview:</strong> See page title, favicon, and domain in a clean card format</li>
              <li><strong>Intelligent Extraction:</strong> Multi-strategy content extraction works on any webpage structure</li>
              <li><strong>Persistent Context:</strong> Page content remains attached throughout your conversation</li>
              <li><strong>Easy Removal:</strong> Click the × button to remove attached content anytime</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Page Summaries</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Right-click on any webpage and select "Summarize with Delight"</li>
              <li>Automatic content extraction and summarization</li>
              <li>Multiple summary lengths available</li>
              <li>Works with articles, blog posts, and documentation</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Interface Modes</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li><strong>Popup Mode:</strong> Quick access from the toolbar</li>
              <li><strong>Side Panel:</strong> Persistent panel alongside your browsing</li>
              <li><strong>Fullscreen Mode:</strong> Dedicated tab for extended conversations</li>
              <li><strong>Seamless Switching:</strong> Use maximize/minimize buttons to switch modes</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'settings',
      title: 'Settings & Configuration',
      icon: <CogIcon className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Appearance Settings</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li><strong>Light Theme:</strong> Clean, bright interface</li>
              <li><strong>Dark Theme:</strong> Easy on the eyes for low-light environments</li>
              <li><strong>System Theme:</strong> Automatically matches your system preference</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Provider Settings</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Switch between providers instantly</li>
              <li>Test connections to verify API keys</li>
              <li>Choose specific models for each provider</li>
              <li>Secure local storage of API keys</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: <KeyIcon className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Data Security</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>API keys are stored locally in your browser using Chrome's secure storage</li>
              <li>No data is sent to our servers - all communication is direct with AI providers</li>
              <li>Chat history is stored locally and never transmitted</li>
              <li>You can clear all data anytime through Chrome's extension settings</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Privacy</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>We don't collect any personal information</li>
              <li>No analytics or tracking</li>
              <li>Your conversations remain private between you and the AI provider</li>
              <li>Page content for summaries is processed directly by the AI provider</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <ExclamationTriangleIcon className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Common Issues</h4>
            
            <div className="space-y-3">
              <div className="border-l-4 border-yellow-400 pl-4">
                <h5 className="font-medium text-gray-900 dark:text-white">API Key Errors</h5>
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <li>Double-check your API key is correct and has no extra spaces</li>
                  <li>Ensure your API key has sufficient credits/quota</li>
                  <li>Verify the API key is for the correct provider</li>
                  <li>Check if your API key has the necessary permissions</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-red-400 pl-4">
                <h5 className="font-medium text-gray-900 dark:text-white">Connection Issues</h5>
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <li>Check your internet connection</li>
                  <li>Try refreshing the extension or restarting Chrome</li>
                  <li>Verify the AI provider's service status</li>
                  <li>Clear extension data and reconfigure</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-blue-400 pl-4">
                <h5 className="font-medium text-gray-900 dark:text-white">Side Panel Issues</h5>
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <li>Side panel may not work on chrome:// pages</li>
                  <li>Try opening on a regular webpage</li>
                  <li>Use the popup or fullscreen mode as alternatives</li>
                  <li>Refresh the page if the side panel doesn't appear</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Getting Help</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Check the provider's documentation for API-specific issues</li>
              <li>Visit our GitHub repository for bug reports and feature requests</li>
              <li>Contact support through the extension's Chrome Web Store page</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      icon: <QuestionMarkCircleIcon className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">Q: Do I need to pay for API access?</h5>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">A: Yes, you need to have accounts and API keys with the AI providers you want to use. Each provider has their own pricing structure.</p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">Q: Can I use multiple providers at the same time?</h5>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">A: You can configure multiple providers and switch between them, but only one can be active at a time for conversations.</p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">Q: How do AI tools work?</h5>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">A: AI tools automatically modify your prompt with specialized instructions. For example, selecting "Explain" adds "Please provide a detailed, simplified explanation of the following:" before your text.</p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">Q: Can I attach content from any website?</h5>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">A: Yes! Our intelligent content extraction works on any webpage structure - from simple blogs to complex web applications. It automatically filters out navigation, ads, and other noise.</p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">Q: Is my data secure?</h5>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">A: Yes, all data is stored locally in your browser. We don't collect or transmit any personal information.</p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">Q: Which provider is fastest?</h5>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">A: Groq typically offers the fastest inference speeds (800+ tokens/sec), while Gemini Flash is also very fast. Speed may vary based on model and current load.</p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">Q: Can I use this offline?</h5>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">A: No, the extension requires an internet connection to communicate with AI providers' APIs.</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpenIcon className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Delight User Guide</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Everything you need to know about using Delight, your AI-powered Chrome extension with 6 major providers, AI tools, and smart page attachment.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sections.map((section) => (
              <div key={section.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-500">
                        {section.icon}
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {section.title}
                      </h2>
                    </div>
                    <div className="text-gray-400">
                      {expandedSections[section.id] ? (
                        <ChevronDownIcon className="h-5 w-5" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </button>
                
                {expandedSections[section.id] && (
                  <div className="px-6 pb-6">
                    <div className="pl-8">
                      {section.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Delight v1.0.0 - AI-powered Chrome extension</p>
          <div className="flex justify-center space-x-4 mt-2">
            <button
              onClick={() => window.close()}
              className="hover:text-blue-500"
            >
              Close Guide
            </button>
            {/* <a href="https://github.com/kwesinavilot/delight" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">
              GitHub
            </a> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuidePage;