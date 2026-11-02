import React from 'react';
import { 
  ShieldCheckIcon,
  LockClosedIcon,
  EyeSlashIcon,
  ServerIcon,
  KeyIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import PageFooter from '@/components/ui/PageFooter';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <ShieldCheckIcon className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your privacy is important to us. Learn how Delight handles your data with complete transparency.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-8">
          
          {/* Overview */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Privacy Overview</h2>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">Privacy-First Design</h3>
                  <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                    API keys and saved history are stored in this browser profile. AI requests go directly to the provider you select. Optional usage analytics is off unless you enable it in Settings.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Collection */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <EyeSlashIcon className="h-6 w-6 text-blue-500 mr-2" />
              Data Handling
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Personal Information:</strong> Messages, selected text, page context, and task instructions may contain personal information. Only send information you are comfortable sharing with your chosen AI provider.</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Browser Context:</strong> Agent requests include URLs, tab titles, visible page text, accessible embedded-frame controls, and recent action outcomes to choose the next action.</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Chat Content:</strong> Your conversations with AI are never sent to our servers</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Agent History:</strong> The latest 20 tasks, summaries, events, outcomes, and recovery checkpoints are saved locally. Relevant instructions and recent outcomes are also sent to the selected AI provider.</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Optional Usage Analytics:</strong> Disabled by default. If enabled in Settings, PostHog receives feature events, provider/model choices, extension version, a pseudonymous identifier, and basic browser/device metadata, but not prompts, page contents, task text, or API keys. Disable it at any time.</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Third-party Connections:</strong> Your selected AI provider, and PostHog if enabled, receive network requests and may observe your IP address. Their retention policies apply; disabling analytics does not delete previously received events.</span>
              </li>
            </ul>
          </div>

          {/* Local Storage */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <LockClosedIcon className="h-6 w-6 text-green-500 mr-2" />
              Local Data Storage
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Saved extension data is kept in browser storage. Chrome does not provide an application-managed encrypted vault here; protect access to your browser profile. Theme preferences may use browser sync.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <KeyIcon className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">API Keys</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Stored in this browser profile on this machine, without browser sync. Never stored on Delight servers. Sent directly to your selected provider to authenticate requests.
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <ServerIcon className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Settings</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Provider settings and analytics consent stay local; theme preferences may sync with your browser account.
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Agent Tasks</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Up to 20 tasks, event summaries, outcomes, and recovery checkpoints (tab URL/identity and uncertainty flags) are stored locally. Typed field payloads and full DOM snapshots are not checkpointed. Task text and generated summaries may still contain sensitive information. Delete saved tasks in Agent mode.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Provider Communication */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">AI Provider Communication</h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                <strong>Direct Communication:</strong> Messages and requested page context go directly from your browser to your selected AI provider, using your key for authentication. Delight processes this data locally and may save chat/task history on this machine; it does not route AI requests through a Delight server.
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
              <p className="text-orange-800 dark:text-orange-200 text-sm">
                <strong>Agent Automation:</strong> The selected provider receives task instructions, current tab/frame observations, visible text and control values (excluding password fields), and recent outcomes. These can include private information on signed-in pages. Actions execute locally through Chrome scripting and, for native input, the debugger API. Only start automation on pages you intend to share with that provider. Restart recovery is explicit, never automatic background execution.
              </p>
            </div>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <h3 className="font-semibold text-gray-900 dark:text-white">How it works:</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>You type a message in Delight</li>
                <li>Delight sends it directly to your chosen AI provider using your API key</li>
                <li>The AI provider processes your request and sends the response back</li>
                <li>Delight displays the response to you</li>
                <li>Your conversation history is stored locally in your browser only</li>
              </ol>
            </div>
          </div>

          {/* Third-Party Privacy */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Third-Party Privacy Policies</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              When you use AI providers through Delight, their respective privacy policies apply to the data you send them:
            </p>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <a href="https://openai.com/privacy/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <span>OpenAI Privacy Policy</span>
                <span className="text-blue-500">→</span>
              </a>
              <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <span>Anthropic Privacy Policy</span>
                <span className="text-blue-500">→</span>
              </a>
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <span>Google Privacy Policy</span>
                <span className="text-blue-500">→</span>
              </a>
              <a href="https://x.ai/privacy" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <span>X.AI Privacy Policy</span>
                <span className="text-blue-500">→</span>
              </a>
            </div>
          </div>

          {/* Data Control */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrashIcon className="h-6 w-6 text-red-500 mr-2" />
              Your Data Control
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                You have complete control over your data:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to Delete Your Data:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>Right-click on the Delight extension icon</li>
                  <li>Select "Manage extension"</li>
                  <li>Click "Remove from Chrome" to delete all stored data</li>
                  <li>Or go to Chrome Settings → Privacy → Site Settings → All sites → chrome-extension://[extension-id] → Clear data</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Updates */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Policy Updates</h2>
            <p className="text-gray-700 dark:text-gray-300">
              If we make changes to this privacy policy, we'll update this page and notify users through the extension. 
              The current in-extension version is effective as of <strong>November 1, 2026</strong>.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Questions?</h2>
            <p className="text-gray-700 dark:text-gray-300">
              If you have questions about this privacy policy or how Delight handles data, please contact us through:
            </p>
            <ul className="mt-2 space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Chrome Web Store support page</li>
              <li>• GitHub repository issues</li>
              <li>• Extension feedback form</li>
            </ul>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                <strong>Public Policy Copy:</strong> A separately maintained copy is available at{' '}
                <a 
                  href="https://docs.google.com/document/d/1KxhmeV9Fjuf7FGxhn6EipfnxGRUiVKM4v4Rz37_rdMQ/edit?usp=sharing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600 dark:hover:text-blue-100"
                >
                  this Google Doc
                </a>
                . This bundled policy describes the current implementation; the public copy must be kept consistent before a store submission.
              </p>
            </div>
          </div>
        </div>

        <PageFooter />
      </div>
    </div>
  );
};

export default PrivacyPage;
