import React, { useState } from 'react';
import {
  SparklesIcon,
  RocketLaunchIcon,
  CogIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const WelcomePage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const providers = [
    { name: 'OpenAI', icon: '🤖', description: 'GPT-4o, GPT-4 Turbo - Industry standard' },
    { name: 'Anthropic', icon: '🧠', description: 'Claude 3.5 Sonnet - Ethical AI' },
    { name: 'Google Gemini', icon: '🔍', description: '1.5 Pro/Flash - Ultra-fast responses' },
    { name: 'Grok (X.AI)', icon: '😄', description: 'Witty personality, real-time info' },
    { name: 'Groq', icon: '⚡', description: 'Ultra-fast inference (800+ tokens/sec)' },
    { name: 'SambaNova', icon: '🦙', description: 'Llama models (1B-405B parameters)' }
  ];

  const features = [
    {
      icon: <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-500" />,
      title: 'Official Provider SDKs',
      description: 'Migrated to official Groq and SambaNova SDKs for better reliability and streaming performance'
    },
    {
      icon: <DocumentTextIcon className="h-8 w-8 text-green-500" />,
      title: 'Expanded Model Support',
      description: '30+ AI models including new Moonshot Kimi, Compound Beta, DeepSeek V3.1, and Llama 3.3 variants'
    },
    {
      icon: <BoltIcon className="h-8 w-8 text-yellow-500" />,
      title: 'Enhanced Performance',
      description: 'Improved streaming performance, better error handling, and reasoning model support'
    },
    {
      icon: <CogIcon className="h-8 w-8 text-purple-500" />,
      title: 'Better Reliability',
      description: 'Resolved connection issues, improved provider initialization, and enhanced error recovery'
    }
  ];

  const steps = [
    {
      title: 'Welcome to Delight 4.7!',
      subtitle: 'Provider SDK upgrades with enhanced performance',
      content: (
        <div className="text-center">
          <div className="mb-8">
            <SparklesIcon className="h-24 w-24 text-blue-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to Delight 4.7!
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Provider SDK upgrades with enhanced streaming performance, expanded model support, and improved reliability.
              Chat with AI, manage conversations seamlessly, and boost your productivity with 6 major providers and 30+ models.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {providers.map((provider) => (
              <div key={provider.name} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl mb-2">{provider.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{provider.name}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{provider.description}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Powerful Features',
      subtitle: 'Everything you need for AI-powered productivity',
      content: (
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Quick Setup',
      subtitle: 'Get started in just a few steps',
      content: (
        <div className="max-w-2xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Choose Your AI Provider
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Select from OpenAI, Anthropic, Google Gemini, Grok, Groq, or SambaNova based on your needs.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Add Your API Key
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Securely store your API key from your chosen provider. We encrypt and store it locally.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Start Chatting!
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Use the popup, side panel, or keyboard shortcut (Ctrl+Shift+Q) to start your AI conversations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGetStarted = async () => {
    // Mark welcome as completed and open in sidepanel mode
    chrome.storage.sync.set({ welcomeCompleted: true });
    
    // Try to find existing valid tab first
    const tabs = await chrome.tabs.query({});
    let targetTab = tabs.find(tab => 
      tab.url && 
      !tab.url.startsWith('chrome://') && 
      !tab.url.startsWith('chrome-extension://')
    );

    // If no valid tab exists, create a new blank one
    if (!targetTab) {
      targetTab = await chrome.tabs.create({ active: true });
    } else {
      await chrome.tabs.update(targetTab.id!, { active: true });
    }
    
    if (targetTab.id) {
      // Open sidepanel on the target tab
      await chrome.sidePanel.open({ tabId: targetTab.id });
      await chrome.sidePanel.setOptions({
        tabId: targetTab.id,
        path: 'sidepanel.html',
        enabled: true
      });
    }
    
    window.close();
  };

  const handleSkip = () => {
    // Mark welcome as completed
    chrome.storage.sync.set({ welcomeCompleted: true });
    window.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <RocketLaunchIcon className="h-8 w-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delight</h1>
            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">v4.7.0</span>
          </div>

          {/* Progress indicator */}
          <div className="flex justify-center space-x-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${index === currentStep
                    ? 'bg-blue-500'
                    : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {steps[currentStep].subtitle}
              </p>
            </div>

            <div className="mb-8">
              {steps[currentStep].content}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
            >
              Skip for now
            </button>

            <div className="flex space-x-4">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                >
                  Previous
                </button>
              )}

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleGetStarted}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium flex items-center space-x-2"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Get Started</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
          <p>Need help? Check out our documentation or contact support.</p>
          <div className="flex justify-center space-x-4 mt-2">
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                chrome.tabs.create({ 
                  url: chrome.runtime.getURL('src/pages/userguide/index.html'),
                  active: true 
                });
              }}
              className="hover:text-blue-500"
            >
              User Guide
            </a>
            <a href="#" className="hover:text-blue-500">Support</a>
            <a href="#" className="hover:text-blue-500">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;