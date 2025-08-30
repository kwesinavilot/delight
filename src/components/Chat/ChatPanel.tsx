import React, { useState, useEffect } from 'react';
import { PaperAirplaneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { generateChatResponse, initializeChatSession, isAIServiceReady } from '@/utils/chat';
import { AIError, AIErrorType } from '@/types/ai';
import WelcomeHint from './WelcomeHint';
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
}

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  const [isServiceReady, setIsServiceReady] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    initializeAIService();
  }, []);

  const initializeAIService = async () => {
    try {
      setInitializationError(null);
      const chatSession = await initializeChatSession();

      if (chatSession) {
        setSession(chatSession);

        const ready = await isAIServiceReady();
        setIsServiceReady(ready);

        if (!ready) {
          setInitializationError('AI service is not properly configured. Please check your API keys.');
        }
      } else {
        setInitializationError('Failed to initialize AI service. Please configure an AI provider.');
      }
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      setInitializationError('Failed to initialize AI service. Please try again.');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !session || !isServiceReady) return;

    const userMessage = input.trim();
    const newMessage: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let responseContent = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      await generateChatResponse(session, userMessage, (chunk) => {
        responseContent += chunk;
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: responseContent }
        ]);
      });
    } catch (error) {
      console.error('Error getting AI response:', error);

      let errorMessage = 'An unexpected error occurred.';

      if (error instanceof AIError) {
        switch (error.type) {
          case AIErrorType.INVALID_API_KEY:
            errorMessage = 'Invalid API key. Please check your configuration.';
            break;
          case AIErrorType.RATE_LIMIT_ERROR:
            errorMessage = 'Rate limit exceeded. Please try again in a moment.';
            break;
          case AIErrorType.NETWORK_ERROR:
            errorMessage = 'Network error. Please check your connection.';
            break;
          case AIErrorType.CONFIGURATION_ERROR:
            errorMessage = 'Configuration error. Please check your AI provider settings.';
            break;
          default:
            errorMessage = error.message || 'AI service error occurred.';
        }
      }

      // Remove the empty assistant message and add error message
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'error', content: errorMessage }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const retryInitialization = () => {
    initializeAIService();
  };

  return (
    <div className="h-full flex flex-col">


      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Show welcome hint when no messages and no errors */}
        {messages.length === 0 && !initializationError && (
          <>
            <WelcomeHint onDismiss={() => { }} />
            
            {/* Sample prompts */}
            {isServiceReady && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Try these prompts:</h3>
                <div className="grid gap-2">
                  {[
                    "Summarize this page for me",
                    "What are the key points on this webpage?",
                    "Help me understand this article",
                    "Explain this content in simple terms",
                    "What's the main takeaway from this page?"
                  ].map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(prompt)}
                      className="text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors text-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {initializationError && messages.length === 0 && (
          <div className="flex justify-center">
            <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 p-4 rounded-lg max-w-md">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Service Not Available</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">{initializationError}</p>
                  <button
                    onClick={retryInitialization}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-2 underline"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user'
                ? 'bg-blue-500 text-white'
                : message.role === 'error'
                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700'
                  : 'bg-gray-200 dark:bg-gray-700'
                }`}
            >
              {message.role === 'error' && (
                <div className="flex items-center space-x-2 mb-1">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">Error</span>
                </div>
              )}
              <div className={message.role === 'error' ? 'text-sm' : ''}>
                {
                  message.role === 'assistant'
                    ? <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
                    : message.content
                }
                {/* // {message.content} */}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isServiceReady || isLoading}
            className={`flex-1 p-2 border rounded-lg ${!isServiceReady ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''
              }`}
            placeholder={
              !isServiceReady
                ? 'AI service not available...'
                : 'Type your message...'
            }
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !isServiceReady || isLoading}
            className={`p-2 rounded-lg ${!input.trim() || !isServiceReady || isLoading
              ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>

        {!isServiceReady && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Configure an AI provider in Settings to start chatting
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatPanel; 