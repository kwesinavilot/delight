import React, { useState } from 'react';
import {
  SparklesIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  WrenchScrewdriverIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const WelcomePage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const providers = [
    {
      name: 'OpenAI',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
          <path d="M21.55 10.004a5.416 5.416 0 00-.478-4.501c-1.217-2.09-3.662-3.166-6.05-2.66A5.59 5.59 0 0010.831 1C8.39.995 6.224 2.546 5.473 4.838A5.553 5.553 0 001.76 7.496a5.487 5.487 0 00.691 6.5 5.416 5.416 0 00.477 4.502c1.217 2.09 3.662 3.165 6.05 2.66A5.586 5.586 0 0013.168 23c2.443.006 4.61-1.546 5.361-3.84a5.553 5.553 0 003.715-2.66 5.488 5.488 0 00-.693-6.497v.001zm-8.381 11.558a4.199 4.199 0 01-2.675-.954c.034-.018.093-.05.132-.074l4.44-2.53a.71.71 0 00.364-.623v-6.176l1.877 1.069c.02.01.033.029.036.05v5.115c-.003 2.274-1.87 4.118-4.174 4.123zM4.192 17.78a4.059 4.059 0 01-.498-2.763c.032.02.09.055.131.078l4.44 2.53c.225.13.504.13.73 0l5.42-3.088v2.138a.068.068 0 01-.027.057L9.9 19.288c-1.999 1.136-4.552.46-5.707-1.51h-.001zM3.023 8.216A4.15 4.15 0 015.198 6.41l-.002.151v5.06a.711.711 0 00.364.624l5.42 3.087-1.876 1.07a.067.067 0 01-.063.005l-4.489-2.559c-1.995-1.14-2.679-3.658-1.53-5.63h.001zm15.417 3.54l-5.42-3.088L14.896 7.6a.067.067 0 01.063-.006l4.489 2.557c1.998 1.14 2.683 3.662 1.529 5.633a4.163 4.163 0 01-2.174 1.807V12.38a.71.71 0 00-.363-.623zm1.867-2.773a6.04 6.04 0 00-.132-.078l-4.44-2.53a.731.731 0 00-.729 0l-5.42 3.088V7.325a.068.068 0 01.027-.057L14.1 4.713c2-1.137 4.555-.46 5.707 1.513.487.833.664 1.809.499 2.757h.001zm-11.741 3.81l-1.877-1.068a.065.065 0 01-.036-.051V6.559c.001-2.277 1.873-4.122 4.181-4.12.976 0 1.92.338 2.671.954-.034.018-.092.05-.131.073l-4.44 2.53a.71.71 0 00-.365.623l-.003 6.173v.002zm1.02-2.168L12 9.25l2.414 1.375v2.75L12 14.75l-2.415-1.375v-2.75z" />
        </svg>
      ),
      description: 'GPT-4o, GPT-4 Turbo - Industry standard'
    },
    {
      name: 'Anthropic',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24">
          <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill="#D97757" />
        </svg>
      ),
      description: 'Claude 3.5 Sonnet - Ethical AI'
    },
    {
      name: 'Google Gemini',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24">
          <path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#4285F4" />
        </svg>
      ),
      description: '1.5 Pro/Flash - Ultra-fast responses'
    },
    {
      name: 'Grok (X.AI)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
          <path d="M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815" />
        </svg>
      ),
      description: 'Witty personality, real-time info'
    },
    {
      name: 'Groq',
      icon: (
        <svg width="24" height="24" viewBox="0 0 80 30" fill="#F55036" xmlns="http://www.w3.org/2000/svg" className="hover:fill-[#F55036]">
          <path d="M47.7883.05664c-5.5135 0-9.9914 4.47795-9.9914 9.99146 0 5.5134 4.4779 9.9914 9.9914 9.9914 5.5135 0 9.9914-4.478 9.9914-9.9914 0-5.51351-4.4779-9.977466-9.9914-9.99146Zm0 16.23256c-3.4424 0-6.2411-2.7987-6.2411-6.2411 0-3.44246 2.7987-6.24118 6.2411-6.24118s6.2411 2.79872 6.2411 6.24118c0 3.4424-2.7987 6.2411-6.2411 6.2411ZM10.0759.000524C4.56244-.05545.056498 4.38052.000524 9.894-.05545 15.4075 4.38052 19.9274 9.894 19.9694h3.4704v-3.7363h-3.2885c-3.44241.042-6.26912-2.7148-6.3111-6.1712-.04198-3.44241 2.71476-6.26911 6.17118-6.31109h.13992c3.4424 0 6.2552 2.79872 6.2552 6.24114v9.19375c0 3.4145-2.7848 6.1992-6.1992 6.2412-1.63726 0-3.19055-.6717-4.33803-1.8332l-2.64479 2.6448c1.83316 1.8472 4.32402 2.8967 6.92682 2.9247h.1399c5.4436-.084 9.8236-4.492 9.8515-9.9355V9.74007C19.9274 4.32454 15.5054.000524 10.0899.000524h-.014ZM79.9987 28.744V9.79671c-.14-5.41552-4.562-9.739545-9.9775-9.739545C64.5077.00119 59.9878 4.43716 59.9458 9.95064c-.0559 5.51346 4.38 10.03336 9.8935 10.07536h3.4704v-3.7363h-3.2885c-3.4424.042-6.2691-2.7147-6.3111-6.1711-.042-3.44247 2.7148-6.26917 6.1712-6.31115h.1399c3.4425 0 6.2552 2.79872 6.2552 6.24115V28.716l3.7223.042v-.014ZM22.9202 20.0255h3.7223v-9.9914c0-3.44245 2.7988-6.24117 6.2412-6.24117 1.1335 0 2.197.30786 3.1206.83962l1.8751-3.24652C36.4101.532423 34.7029.05664 32.8977.05664c-5.5135 0-9.9915 4.47795-9.9915 9.99146v9.9914l.014-.014Z" />
        </svg>
      ),
      description: 'Ultra-fast inference (800+ tokens/sec)'
    },
    {
      name: 'SambaNova',
      icon: (
        <img
          src="https://sambanova.ai/hs-fs/hubfs/sn-new-gray-logo.png?width=200&height=44&name=sn-new-gray-logo.png"
          alt="SambaNova"
          className="h-6 w-auto"
        />
      ),
      description: 'Llama models (1B-405B parameters)'
    },
    {
      name: 'GPT-OSS Offline',
      icon: (
        <img
          src="https://ollama.com/public/gpt-oss.png"
          alt="GPT-OSS via Ollama"
          className="h-6 w-auto"
        />
      ),
      description: 'OpenAI open models via Ollama (local)'
    },
    {
      name: 'GPT-OSS Online',
      icon: (
        <svg width="24" height="24" viewBox="0 0 80 30" fill="#F55036" xmlns="http://www.w3.org/2000/svg" className="hover:fill-[#F55036]">
          <path d="M47.7883.05664c-5.5135 0-9.9914 4.47795-9.9914 9.99146 0 5.5134 4.4779 9.9914 9.9914 9.9914 5.5135 0 9.9914-4.478 9.9914-9.9914 0-5.51351-4.4779-9.977466-9.9914-9.99146Zm0 16.23256c-3.4424 0-6.2411-2.7987-6.2411-6.2411 0-3.44246 2.7987-6.24118 6.2411-6.24118s6.2411 2.79872 6.2411 6.24118c0 3.4424-2.7987 6.2411-6.2411 6.2411ZM10.0759.000524C4.56244-.05545.056498 4.38052.000524 9.894-.05545 15.4075 4.38052 19.9274 9.894 19.9694h3.4704v-3.7363h-3.2885c-3.44241.042-6.26912-2.7148-6.3111-6.1712-.04198-3.44241 2.71476-6.26911 6.17118-6.31109h.13992c3.4424 0 6.2552 2.79872 6.2552 6.24114v9.19375c0 3.4145-2.7848 6.1992-6.1992 6.2412-1.63726 0-3.19055-.6717-4.33803-1.8332l-2.64479 2.6448c1.83316 1.8472 4.32402 2.8967 6.92682 2.9247h.1399c5.4436-.084 9.8236-4.492 9.8515-9.9355V9.74007C19.9274 4.32454 15.5054.000524 10.0899.000524h-.014ZM79.9987 28.744V9.79671c-.14-5.41552-4.562-9.739545-9.9775-9.739545C64.5077.00119 59.9878 4.43716 59.9458 9.95064c-.0559 5.51346 4.38 10.03336 9.8935 10.07536h3.4704v-3.7363h-3.2885c-3.4424.042-6.2691-2.7147-6.3111-6.1711-.042-3.44247 2.7148-6.26917 6.1712-6.31115h.1399c3.4425 0 6.2552 2.79872 6.2552 6.24115V28.716l3.7223.042v-.014ZM22.9202 20.0255h3.7223v-9.9914c0-3.44245 2.7988-6.24117 6.2412-6.24117 1.1335 0 2.197.30786 3.1206.83962l1.8751-3.24652C36.4101.532423 34.7029.05664 32.8977.05664c-5.5135 0-9.9915 4.47795-9.9915 9.99146v9.9914l.014-.014Z" />
        </svg>
      ),
      description: 'OpenAI open models via Groq (hosted)'
    }
  ];

  const features = [
    {
      icon: (
        <svg className="h-8 w-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: '🤖 Agent Automation',
      description: 'Revolutionary multi-agent system for complex web automation. Describe tasks in natural language and watch AI agents plan and execute them step-by-step'
    },
    {
      icon: <WrenchScrewdriverIcon className="h-8 w-8 text-blue-500" />,
      title: 'AI Tools System',
      description: '10 specialized tools for explaining, rewriting (paraphrase, improve, expand, shorten), and tone changes (academic, professional, persuasive, casual, funny)'
    },
    {
      icon: <PaperClipIcon className="h-8 w-8 text-green-500" />,
      title: 'Smart Page Attachment',
      description: 'Attach webpage content with Twitter-card previews. Intelligent content extraction from any page structure with persistent context'
    },
    {
      icon: <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-500" />,
      title: 'Multi-Provider AI',
      description: '8 major AI providers with 27+ models: OpenAI, Anthropic, Gemini, Grok, Groq, SambaNova, and GPT-OSS (Online/Offline) for every use case'
    }
  ];

  const steps = [
    {
      title: 'Welcome to Delight 1.2.0!',
      subtitle: 'Agent Automation & GPT-OSS Integration',
      content: (
        <div className="text-center">
          <div className="mb-8">
            <SparklesIcon className="h-24 w-24 text-blue-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to Delight 1.2.0!
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4">
              Revolutionary agent automation system with GPT-OSS integration! Multi-agent framework for complex web tasks, OpenAI's open reasoning models, enhanced AI tools and smart page attachment.
              Chat with AI, automate web tasks, and boost your productivity with 8 major providers and 27+ models.
            </p>
            {/* <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-green-800 dark:text-green-200 font-medium text-center">
                🎁 <strong>Start instantly!</strong> You have 5 free AI requests to try all features. After that, get your own free Gemini API key in just 2 minutes.
              </p>
            </div> */}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {providers.map((provider) => (
              <div key={provider.name} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-center mb-2 text-gray-700 dark:text-gray-300">
                  {typeof provider.icon === 'string' ? (
                    <div className="text-2xl">{provider.icon}</div>
                  ) : (
                    provider.icon
                  )}
                </div>
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
                  Try It Now (5 Free Requests)
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Start chatting immediately with our built-in trial. No setup required! Works with all AI tools and page attachment.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Choose Your AI Provider
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Go to Settings and select from OpenAI, Anthropic, Google Gemini, Grok, Groq, SambaNova, or GPT-OSS (Online/Offline) and a model based on your needs and preference.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Add Your API Key
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Securely store your API key from your chosen provider. We encrypt and store it locally.<br />
                  You can get a free API key from Google Gemini in just 2 minutes and get up to 1,500 requests/day!
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Explore All Features!
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Use sidepanel or keyboard shortcut (Ctrl+Shift+Q). Try agent automation, AI tools for explaining, rewriting, tone changes, plus attach page content for context.
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
            <Avatar>
              <AvatarImage src="/icons/delightful-1.jpg" />
              <AvatarFallback>
                <RocketLaunchIcon className="h-8 w-8 text-blue-500" />
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delight</h1>
            <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">v1.2.0 GPT-OSS</span>
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
            <a href="mailto:andrewsankomahene@gmail.com" className="hover:text-blue-500">Support</a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                chrome.tabs.create({
                  url: chrome.runtime.getURL('src/pages/privacy/index.html'),
                  active: true
                });
              }}
              className="hover:text-blue-500"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;