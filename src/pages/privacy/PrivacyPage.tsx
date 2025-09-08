import React from 'react';
import { 
  ShieldCheckIcon,
  LockClosedIcon,
  EyeSlashIcon,
  ServerIcon,
  KeyIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

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
                    Delight is designed with privacy as a core principle. We don't collect, store, or transmit any personal data to our servers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Collection */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <EyeSlashIcon className="h-6 w-6 text-blue-500 mr-2" />
              What We DON'T Collect
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Personal Information:</strong> We don't collect names, emails, phone numbers, or any personal identifiers</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Browsing History:</strong> We don't track which websites you visit or your browsing patterns</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Chat Content:</strong> Your conversations with AI are never sent to our servers</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Agent Automation Data:</strong> Task plans, execution logs, and automation results stay local</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Usage Analytics:</strong> We don't track how you use the extension or collect usage statistics</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Device Information:</strong> We don't collect device IDs, IP addresses, or system information</span>
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
                All your data is stored locally in your browser using Chrome's secure storage system:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <KeyIcon className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">API Keys</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Encrypted and stored locally in Chrome's secure storage. Never transmitted to our servers.
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <ServerIcon className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Settings</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your preferences (theme, provider selection) stored locally for convenience.
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
                    Task plans and execution logs stored locally. No automation data sent to our servers.
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
                <strong>Direct Communication:</strong> When you chat with AI or use agent automation, your messages go directly from your browser to the AI provider (OpenAI, Anthropic, etc.). Delight acts as a secure bridge but never stores or processes this data.
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
              <p className="text-orange-800 dark:text-orange-200 text-sm">
                <strong>Agent Automation:</strong> When you use the agent automation system, task descriptions are sent to AI providers for planning purposes only. No actual browser automation data is transmitted - all execution happens locally.
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
              The current version is effective as of <strong>September 3, 2025</strong>.
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
                <strong>Full Privacy Policy:</strong> You can view the complete, updated version of our privacy policy at{' '}
                <a 
                  href="https://docs.google.com/document/d/1KxhmeV9Fjuf7FGxhn6EipfnxGRUiVKM4v4Rz37_rdMQ/edit?usp=sharing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600 dark:hover:text-blue-100"
                >
                  this Google Doc
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Delight v1.1.2 - Privacy Policy</p>
          <div className="flex justify-center space-x-4 mt-2">
            <button
              onClick={() => window.close()}
              className="hover:text-blue-500"
            >
              Close
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

export default PrivacyPage;