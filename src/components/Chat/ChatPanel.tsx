import React, { useState, useEffect } from 'react';
import { PaperAirplaneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { initializeChatSession, isAIServiceReady } from '@/utils/chat';
import { AIError, AIErrorType } from '@/types/ai';
import { ConversationManager } from '@/services/chat/ConversationManager';
import { AIService } from '@/services/ai/AIService';
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
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [conversationManager, setConversationManager] = useState<ConversationManager | null>(null);

  const [isServiceReady, setIsServiceReady] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      setInitializationError(null);
      setIsLoadingHistory(true);

      // Initialize AI service
      const chatSession = await initializeChatSession();
      if (chatSession) {
        setSession(chatSession);
      }

      // Initialize conversation manager
      const manager = ConversationManager.getInstance();
      await manager.initialize();
      setConversationManager(manager);

      // Load conversation history
      await loadConversationHistory(manager);

      // Check if AI service is ready
      const ready = await isAIServiceReady();
      setIsServiceReady(ready);

      if (!ready) {
        setInitializationError('AI service is not properly configured. Please check your API keys.');
      }
    } catch (error) {
      console.error('Failed to initialize services:', error);
      setInitializationError('Failed to initialize services. Please try again.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadConversationHistory = async (manager: ConversationManager) => {
    try {
      // Try to get current session, create one if it doesn't exist
      try {
        manager.getCurrentSession();
      } catch {
        // No current session, create a new one
        await manager.createNewSession();
      }

      // Convert ChatMessage[] to Message[] for display
      const chatMessages = manager.getConversationHistory();
      const displayMessages: Message[] = chatMessages.map(msg => ({
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: msg.content
      }));

      setMessages(displayMessages);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      // Don't throw - allow the component to work without history
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !session || !isServiceReady || !conversationManager) return;

    const userMessage = input.trim();
    const newMessage: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Add user message to conversation history
      await conversationManager.addMessage({
        role: 'user',
        content: userMessage,
        provider: session.aiService?.getCurrentProviderName() || 'unknown'
      });

      // Get conversation history for context
      const conversationHistory = conversationManager.getConversationHistory();
      
      let responseContent = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      // Use AIService directly with conversation history
      const aiService = AIService.getInstance();
      await aiService.generateChatResponseWithHistory(conversationHistory, (chunk) => {
        responseContent += chunk;
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: responseContent }
        ]);
      });

      // Add assistant response to conversation history
      if (responseContent) {
        await conversationManager.addMessage({
          role: 'assistant',
          content: responseContent,
          provider: session.aiService?.getCurrentProviderName() || 'unknown'
        });
      }
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
    initializeServices();
  };

  const clearConversation = async () => {
    if (!conversationManager) return;
    
    try {
      await conversationManager.clearCurrentSession();
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear conversation:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">


      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Show loading state for conversation history */}
        {isLoadingHistory && (
          <div className="flex justify-center">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Loading conversation...</span>
              </div>
            </div>
          </div>
        )}

        {/* Show welcome hint when no messages and no errors */}
        {!isLoadingHistory && messages.length === 0 && !initializationError && (
          <>
            <WelcomeHint onDismiss={() => { }} />
            
            {/* Sample prompts */}
            {isServiceReady && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Try these prompts:</h3>
                  {conversationManager && (
                    <button
                      onClick={clearConversation}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                    >
                      Clear Chat
                    </button>
                  )}
                </div>
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

        {!isLoadingHistory && initializationError && messages.length === 0 && (
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

        {!isLoadingHistory && messages.map((message, index) => (
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

        {!isLoadingHistory && isLoading && (
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
            disabled={!isServiceReady || isLoading || isLoadingHistory}
            className={`flex-1 p-2 border rounded-lg ${!isServiceReady || isLoadingHistory ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''
              }`}
            placeholder={
              isLoadingHistory
                ? 'Loading conversation...'
                : !isServiceReady
                ? 'AI service not available...'
                : 'Type your message...'
            }
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !isServiceReady || isLoading || isLoadingHistory}
            className={`p-2 rounded-lg ${!input.trim() || !isServiceReady || isLoading || isLoadingHistory
              ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>

        {!isServiceReady && !isLoadingHistory && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Configure an AI provider in Settings to start chatting
          </p>
        )}
        
        {isLoadingHistory && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Loading conversation history...
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatPanel; 