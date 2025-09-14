import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageFooter from '@/components/ui/PageFooter';

interface UpdateInfo {
  previousVersion: string;
  currentVersion: string;
  updateDate: string;
}

const UpdatesPage: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    chrome.storage.local.get(['updateInfo']).then((result) => {
      if (result.updateInfo) {
        setUpdateInfo(result.updateInfo);
      } else {
        // Fallback for manual visits
        setUpdateInfo({
          previousVersion: '1.4.1',
          currentVersion: '1.4.2',
          updateDate: new Date().toISOString()
        });
      }
    });
  }, []);


  const getVersionChanges = (version: string) => {
    // Return changes based on version
    switch (version) {
      case '1.4.2':
        return {
          title: 'Enhanced Error Recovery & Network Intelligence',
          subtitle: 'Uninterrupted AI assistance with automatic retry and intelligent fallback',
          features: [
            {
              icon: (
                <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'Automatic Retry with Exponential Backoff',
              description: 'Failed requests are automatically retried with smart delays. No more interruptions from temporary network issues or provider hiccups.'
            },
            {
              icon: (
                <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              ),
              title: 'Intelligent Fallback Provider Switching',
              description: 'When your primary AI provider fails, Delight automatically switches to backup providers. Seamless AI assistance even during outages.'
            },
            {
              icon: (
                <svg className="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
              ),
              title: 'Real-time Network & Provider Monitoring',
              description: 'New Connectivity tab in Settings shows real-time network status and provider health. Test all your AI providers with one click.'
            },
            {
              icon: <CheckCircleIcon className="h-6 w-6 text-purple-500" />,
              title: 'Enhanced Reliability Features',
              description: 'All reliability features work automatically in the background. Smart error classification, network detection, and transparent recovery notifications.'
            }
          ]
        };
      case '1.4.1':
        return {
          title: 'Context Menu Integration & AI Safety',
          subtitle: 'Right-click AI assistance and comprehensive AI accuracy education',
          features: [
            {
              icon: <SparklesIcon className="h-6 w-6 text-blue-500" />,
              title: 'Right-click Context Menus',
              description: 'Instant AI assistance with right-click menus: Open Delight, Summarize page, Chat about page, Explain selection, Rewrite selection'
            },
            {
              icon: <RocketLaunchIcon className="h-6 w-6 text-green-500" />,
              title: 'Smart Auto-send & Page Context',
              description: 'Context menu actions automatically send messages and attach page content for seamless workflow'
            },
            {
              icon: <DocumentTextIcon className="h-6 w-6 text-orange-500" />,
              title: 'AI Accuracy Education',
              description: 'Comprehensive AI disclaimer and best practices guide for responsible AI usage and understanding limitations'
            }
          ]
        };
      case '1.1.2':
        return {
          title: 'Documentation & Architecture',
          subtitle: 'Enhanced technical documentation and system visualization',
          features: [
            {
              icon: <ChartBarIcon className="h-6 w-6 text-blue-500" />,
              title: 'Architecture Diagrams',
              description: 'Comprehensive system architecture visualization with mermaid diagrams showing how all components work together'
            },
            {
              icon: <DocumentTextIcon className="h-6 w-6 text-green-500" />,
              title: 'Technical Blog Content',
              description: 'Detailed technical documentation explaining Vercel AI SDK integration and system design'
            },
            {
              icon: <WrenchScrewdriverIcon className="h-6 w-6 text-purple-500" />,
              title: 'Enhanced Documentation',
              description: 'Improved technical communication and better developer onboarding materials'
            }
          ]
        };
      case '1.1.1':
        return {
          title: 'Agent Automation System',
          subtitle: 'Revolutionary multi-agent framework for web automation',
          features: [
            {
              icon: <RocketLaunchIcon className="h-6 w-6 text-orange-500" />,
              title: 'Cross-Browser Automation',
              description: 'Playwright integration for Chrome, Firefox, Safari, Edge with 25+ automation actions'
            },
            {
              icon: <SparklesIcon className="h-6 w-6 text-blue-500" />,
              title: 'Multi-Agent System',
              description: 'Planner, Navigator, and Monitor agents working together for complex web tasks'
            },
            {
              icon: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
              title: 'Natural Language Tasks',
              description: 'Describe complex web automation in plain English and watch AI agents execute them'
            }
          ]
        };
      default:
        return {
          title: 'Latest Updates',
          subtitle: 'New features and improvements',
          features: [
            {
              icon: <SparklesIcon className="h-6 w-6 text-blue-500" />,
              title: 'Performance Improvements',
              description: 'Enhanced speed and reliability across all features'
            },
            {
              icon: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
              title: 'Bug Fixes',
              description: 'Resolved various issues for a smoother experience'
            }
          ]
        };
    }
  };

  const handleContinue = () => {
    // Clear update info and close tab
    chrome.storage.local.remove(['updateInfo']);
    window.close();
  };

  if (!updateInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <SparklesIcon className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-300">Loading update information...</p>
        </div>
      </div>
    );
  }

  const changes = getVersionChanges(updateInfo.currentVersion);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Avatar>
              <AvatarImage src="/icons/delightful-1.jpg" />
              <AvatarFallback>
                <SparklesIcon className="h-8 w-8 text-blue-500" />
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delight</h1>
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Updated to v{updateInfo.currentVersion}
            </span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {changes.title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {changes.subtitle}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <div className="space-y-8">
            {changes.features.map((feature, index) => (
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

          {/* Version Info */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
              <span>Updated from v{updateInfo.previousVersion} to v{updateInfo.currentVersion}</span>
              <span>{new Date(updateInfo.updateDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex items-center space-x-2 mx-auto"
          >
            <CheckCircleIcon className="h-5 w-5" />
            <span>Continue Using Delight</span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Footer */}
        <PageFooter />
      </div>
    </div>
  );
};

export default UpdatesPage;