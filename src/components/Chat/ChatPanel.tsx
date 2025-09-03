import React, { useState, useEffect, useRef } from 'react';
import { PaperAirplaneIcon, ExclamationTriangleIcon, DocumentDuplicateIcon, ArrowPathIcon, StopIcon, ChevronDownIcon, WrenchScrewdriverIcon, PaperClipIcon } from '@heroicons/react/24/solid';
import { Button } from "@/components/ui/button";

import { initializeChatSession, isAIServiceReady } from '@/utils/chat';
import { AIError, AIErrorType } from '@/types/ai';

import { AIService } from '@/services/ai/AIService';
import { PageContextService } from '@/services/PageContextService';
// import { TrialService } from '@/services/TrialService';
import { AI_TOOLS, AITool, TOOL_CATEGORIES } from '@/types/tools';
import WelcomeHint from './WelcomeHint';
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
}

interface ChatPanelProps {
  isFullscreen?: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isFullscreen = false }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [copiedStates, setCopiedStates] = useState<Record<number, boolean>>({});

  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const attachDropdownRef = useRef<HTMLDivElement>(null);

  const [isServiceReady, setIsServiceReady] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [isGettingPageContext, setIsGettingPageContext] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showAttachDropdown, setShowAttachDropdown] = useState(false);
  const [attachedPageContext, setAttachedPageContext] = useState<any>(null);
  const [trialStatus, setTrialStatus] = useState<{
    isTrialMode: boolean;
    remainingRequests: number;
    totalRequests: number;
  }>({ isTrialMode: false, remainingRequests: 0, totalRequests: 5 });

  useEffect(() => {
    initializeServices();
    checkForPendingSummarization();
    loadTrialStatus();

    // Initialize prompts once
    const allPrompts = [
      // Executive/Business
      "Draft a professional email for this situation",
      "Create a meeting agenda for this topic",
      "Generate action items and next steps",
      "Write a brief executive summary",
      "Create talking points for a presentation",
      "Draft a project proposal outline",
      "Generate strategic recommendations",
      "Create a stakeholder communication plan",
      "Draft quarterly goals and objectives",

      // AI/ML Engineers & Data Scientists
      "Explain this ML algorithm or concept",
      "Generate Python code for data analysis",
      "Create a model evaluation framework",
      "Design an experiment for A/B testing",
      "Optimize this machine learning pipeline",
      "Generate SQL queries for data extraction",
      "Create data visualization recommendations",
      "Draft a technical architecture document",
      "Analyze dataset patterns and insights",
      "Generate feature engineering ideas",

      // Software Development
      "Review this code for best practices",
      "Debug this error or issue",
      "Optimize this algorithm or function",
      "Generate unit tests for this code",
      "Create API documentation",
      "Design a database schema",
      "Refactor this code for better performance",
      "Generate deployment scripts",
      "Create a technical specification",

      // Cybersecurity
      "Analyze this security vulnerability",
      "Create a security assessment checklist",
      "Generate incident response procedures",
      "Design security controls framework",
      "Create penetration testing scenarios",
      "Draft security policy guidelines",
      "Analyze threat intelligence data",

      // Cloud Engineering
      "Design a cloud architecture solution",
      "Optimize cloud infrastructure costs",
      "Create deployment automation scripts",
      "Generate monitoring and alerting setup",
      "Design disaster recovery procedures",
      "Create infrastructure as code templates",
      "Analyze cloud performance metrics",

      // UX/UI Design
      "Analyze user experience patterns",
      "Generate design system guidelines",
      "Create user journey mapping",
      "Design accessibility improvements",
      "Generate usability testing scenarios",
      "Create wireframe specifications",
      "Analyze user feedback and insights",

      // Digital Marketing
      "Generate SEO optimization strategies",
      "Create content marketing ideas",
      "Analyze social media performance",
      "Generate email campaign content",
      "Create conversion optimization plan",
      "Design marketing automation workflows",
      "Analyze competitor marketing strategies",

      // Product Management
      "Create user story requirements",
      "Generate product roadmap priorities",
      "Analyze market research findings",
      "Create feature specification document",
      "Generate product metrics dashboard",
      "Design user acceptance criteria",
      "Create competitive feature analysis",

      // Renewable Energy
      "Analyze energy efficiency metrics",
      "Generate sustainability recommendations",
      "Create renewable energy project plan",
      "Design energy optimization strategies",
      "Analyze environmental impact data",

      // Automation
      "Generate automation workflow ideas",
      "Create process optimization plan",
      "Design robotic process automation",
      "Generate testing automation scripts",
      "Create workflow efficiency analysis"
    ];

    // Randomly select 5 prompts once
    const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
    setSelectedPrompts(shuffled.slice(0, 5));

    // Listen for storage changes to refresh when settings are updated
    const handleStorageChange = (changes: any) => {
      if (changes.aiSettings) {
        console.log('AI settings changed, refreshing...');
        retryInitialization();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Listen for new conversation events
    const handleNewConversation = () => {
      setMessages([]);
      setStreamingContent('');
      setInput('');
      console.log('Reset chat for new conversation');
    };

    // Listen for session loading events
    const handleLoadSession = async (event: any) => {
      const { sessionId } = event.detail;
      await loadSession(sessionId);
    };

    window.addEventListener('newConversation', handleNewConversation);
    window.addEventListener('loadSession', handleLoadSession);

    // Click outside handler for dropdowns
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setShowToolsDropdown(false);
      }
      if (attachDropdownRef.current && !attachDropdownRef.current.contains(event.target as Node)) {
        setShowAttachDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      window.removeEventListener('newConversation', handleNewConversation);
      window.removeEventListener('loadSession', handleLoadSession);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadTrialStatus = async () => {
    try {
      const aiService = AIService.getInstance();
      const status = await aiService.getTrialStatus();
      setTrialStatus(status);
    } catch (error) {
      console.error('Failed to load trial status:', error);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!showScrollButton) {
      scrollToBottom();
    }
  }, [messages, streamingContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 200;
    setShowScrollButton(!isAtBottom);
  };

  const initializeServices = async () => {
    setInitializationError(null);
    setIsLoadingHistory(true);

    try {
      // Initialize AI service first
      const aiService = AIService.getInstance();
      await aiService.initialize();

      // Check if AI service is ready
      const ready = await isAIServiceReady();
      setIsServiceReady(ready);

      if (!ready) {
        setInitializationError('No AI provider is configured. Please configure an API key.');
        return;
      }

      // Load existing conversation history quickly
      await loadConversationHistory();

      // Initialize chat session if AI is ready
      const chatSession = await initializeChatSession();
      if (chatSession) {
        setSession(chatSession);
      }

    } catch (error) {
      console.error('Failed to initialize services:', error);
      setInitializationError('No AI provider is configured. Please configure an API key.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadConversationHistory = async () => {
    try {
      // Quick load from Chrome storage
      const result = await chrome.storage.local.get(['quickChatHistory']);
      const history = result.quickChatHistory || [];
      
      // Limit to last 20 messages for performance
      const recentHistory = history.slice(-20);
      setMessages(recentHistory);
      
      if (recentHistory.length > 0) {
        console.log(`Loaded ${recentHistory.length} recent messages`);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      // Continue without history
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const result = await chrome.storage.local.get(['chatSessions']);
      const sessions = result.chatSessions || {};
      const session = sessions[sessionId];
      
      if (session) {
        setMessages(session.messages || []);
        setStreamingContent('');
        setInput('');
        console.log(`Loaded session ${sessionId} with ${session.messages?.length || 0} messages`);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };



  const sendMessage = async () => {
    if (!input.trim() || !session || !isServiceReady) return;

    let userMessage = input.trim();
    
    // Add attached page context
    if (attachedPageContext) {
      const pageContent = await PageContextService.analyzePageForAI(attachedPageContext);
      userMessage = `${userMessage}\n\nPage Context:\n${pageContent}`;
    }
    
    // Apply tool prompt if selected
    if (selectedTool) {
      userMessage = `${selectedTool.prompt}\n\n${userMessage}`;
    }
    
    const newMessage: Message = { role: 'user', content: input.trim() }; // Show original input in UI
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setSelectedTool(null); // Clear tool after use
    setIsLoading(true);

    // Create abort controller for cancellation
    const controller = new AbortController();
    setAbortController(controller);

    try {
      let responseContent = '';
      setStreamingContent('');

      // Convert current messages to simple format for AI
      const contextMessages = messages.concat([{ role: 'user', content: userMessage }]).map((msg, index) => ({
        id: `msg_${Date.now()}_${index}`,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: Date.now()
      }));

      // Use chat response with history
      const aiService = AIService.getInstance();
      await aiService.generateChatResponseWithHistory(contextMessages, (chunk) => {
        if (controller.signal.aborted) {
          throw new Error('Request cancelled by user');
        }
        responseContent += chunk;
        setStreamingContent(responseContent);
      });

      // Add the complete message to UI
      const assistantMessage = { role: 'assistant' as const, content: responseContent };
      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');

      // Save to quick history (async, non-blocking)
      const updatedMessages = [...messages, newMessage, assistantMessage];
      saveToQuickHistory(updatedMessages);
      saveToSession(updatedMessages);
      
      // Refresh trial status after successful request
      await loadTrialStatus();

    } catch (error) {
      console.error('Error getting AI response:', error);

      let errorMessage = 'An unexpected error occurred.';

      if (error instanceof Error && (error.message === 'Request cancelled by user' || error.message.includes('aborted'))) {
        // Don't show error for intentional cancellation, just clean up
        setStreamingContent('');
        return;
      } else if (error instanceof AIError && (error.message?.includes('Request cancelled by user') || error.message?.includes('aborted'))) {
        // Handle AIError wrapping the cancellation
        setStreamingContent('');
        return;
      } else if (error instanceof AIError) {
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
      } else if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
        const errorMsg = (error as any).message;
        if (errorMsg.includes('Developer instruction is not enabled')) {
          errorMessage = 'This model does not support the requested operation. Try switching to a different model.';
        } else if (errorMsg.includes('image-generation')) {
          errorMessage = 'This model is designed for image generation, not text chat. Please select a text model.';
        } else if (errorMsg.includes('not supported')) {
          errorMessage = 'This operation is not supported by the current model. Please try a different model.';
        } else {
          errorMessage = errorMsg;
        }
      }

      // Add error message to UI only (not to conversation history)
      setMessages(prev => [...prev, { role: 'error', content: errorMessage }]);
      setStreamingContent('');
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const stopResponse = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      if (isLoading) {
        stopResponse();
      } else {
        sendMessage();
      }
    }
  };

  const retryInitialization = async () => {
    // Force AI service to reinitialize after configuration changes
    try {
      const aiService = AIService.getInstance();
      await aiService.initialize();
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
    }
    initializeServices();
  };



  const copyToClipboard = async (text: string, messageIndex: number, asMarkdown = false) => {
    try {
      // For AI responses, convert markdown to plain text unless specifically requested as markdown
      let textToCopy = text;
      if (!asMarkdown && text.includes('```') || text.includes('**') || text.includes('*')) {
        // Simple markdown to text conversion
        textToCopy = text
          .replace(/```[\s\S]*?```/g, (match) => match.replace(/```\w*\n?/g, '').replace(/```/g, ''))
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/#{1,6}\s/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      }
      
      await navigator.clipboard.writeText(textToCopy);
      setCopiedStates(prev => ({ ...prev, [messageIndex]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [messageIndex]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const retryMessage = async (messageIndex: number) => {
    if (!session || !isServiceReady) return;

    // Find the user message that we want to retry
    const userMessage = messages[messageIndex - 1];
    if (!userMessage || userMessage.role !== 'user') return;

    // Remove the assistant response from UI
    const messagesUpToUser = messages.slice(0, messageIndex);
    setMessages(messagesUpToUser);
    setIsLoading(true);

    try {
      let responseContent = '';
      setStreamingContent('');

      // Convert messages to simple format for AI
      const contextMessages = messagesUpToUser.map((msg, index) => ({
        id: `msg_${Date.now()}_${index}`,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: Date.now()
      }));

      // Use chat response with history
      const aiService = AIService.getInstance();
      await aiService.generateChatResponseWithHistory(contextMessages, (chunk) => {
        responseContent += chunk;
        setStreamingContent(responseContent);
      });

      // Add the complete message to UI
      const assistantMessage = { role: 'assistant' as const, content: responseContent };
      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');

      // Save to quick history (async, non-blocking)
      const updatedMessages = [...messagesUpToUser, assistantMessage];
      saveToQuickHistory(updatedMessages);
      saveToSession(updatedMessages);

    } catch (error) {
      console.error('Error retrying AI response:', error);
      setMessages(prev => [...prev, { role: 'error', content: 'Failed to retry. Please try again.' }]);
      setStreamingContent('');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick save to Chrome storage (non-blocking)
  const saveToQuickHistory = async (messages: Message[]) => {
    try {
      // Only save last 50 messages to keep storage light
      const recentMessages = messages.slice(-50);
      await chrome.storage.local.set({ quickChatHistory: recentMessages });
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  };

  const saveToSession = async (messages: Message[]) => {
    try {
      const result = await chrome.storage.local.get(['chatSessions']);
      const sessions = result.chatSessions || {};
      
      // Create or update current session
      const sessionId = `session_${Date.now()}`;
      const session = {
        id: sessionId,
        messages: messages,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        provider: 'current',
        title: messages.find(m => m.role === 'user')?.content?.slice(0, 30) + '...' || 'New Chat'
      };
      
      sessions[sessionId] = session;
      await chrome.storage.local.set({ chatSessions: sessions });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const getPageContext = async (format: 'detailed' | 'summary' | 'minimal' = 'detailed') => {
    setIsGettingPageContext(true);
    console.log('Getting page context with format:', format);
    
    try {
      const context = await PageContextService.getCurrentPageContext();
      console.log('Page context result:', context);
      
      if (context) {
        setAttachedPageContext(context);
        setShowAttachDropdown(false);
      } else {
        setMessages(prev => [...prev, { 
          role: 'error', 
          content: 'No content found on this page. Try refreshing the page and try again.' 
        }]);
      }
    } catch (error) {
      console.error('Failed to get page context:', error);
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: `Failed to extract page content: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }]);
    } finally {
      setIsGettingPageContext(false);
    }
  };

  const checkForPendingSummarization = async () => {
    try {
      const result = await chrome.storage.local.get(['pendingSummarization']);
      const pending = result.pendingSummarization;
      
      if (pending && Date.now() - pending.timestamp < 10000) { // Within 10 seconds
        // Clear the pending request
        await chrome.storage.local.remove(['pendingSummarization']);
        
        // Start new conversation
        setMessages([]);
        setStreamingContent('');
        setInput('');
        
        // Show loading message
        setMessages([{
          role: 'assistant',
          content: '🔄 Analyzing page content and generating summary...'
        }]);
        
        // Get page content and summarize
        await summarizePage();
      }
    } catch (error) {
      console.error('Failed to check pending summarization:', error);
    }
  };

  const summarizePage = async () => {
    if (!session || !isServiceReady) return;
    
    setIsLoading(true);
    
    try {
      const context = await PageContextService.getCurrentPageContext();
      if (!context) {
        setMessages([{
          role: 'error',
          content: 'Could not extract page content for summarization.'
        }]);
        return;
      }

      const prompt = `Please provide a comprehensive summary of this webpage:\n\n${await PageContextService.analyzePageForAI(context)}\n\nProvide:\n1. A brief overview (2-3 sentences)\n2. Key points or main topics\n3. Important details or insights\n4. Any actionable information`;
      
      let responseContent = '';
      setStreamingContent('');
      setMessages([]);

      const contextMessages = [{
        id: `msg_${Date.now()}`,
        role: 'user' as const,
        content: prompt,
        timestamp: Date.now()
      }];

      const aiService = AIService.getInstance();
      await aiService.generateChatResponseWithHistory(contextMessages, (chunk) => {
        responseContent += chunk;
        setStreamingContent(responseContent);
      });

      const assistantMessage = { role: 'assistant' as const, content: responseContent };
      setMessages([assistantMessage]);
      setStreamingContent('');

      saveToQuickHistory([assistantMessage]);
      saveToSession([assistantMessage]);

    } catch (error) {
      console.error('Summarization failed:', error);
      setMessages([{
        role: 'error',
        content: 'Failed to generate summary. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">


      {/* Messages area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto space-y-4 relative ${isFullscreen ? 'px-12 py-8' : 'px-4 py-6'}`}
      >
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
              <div className={`mt-6 ${isFullscreen ? 'max-w-2xl mx-auto' : ''}`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Let's start from here:</h3>
                  {/* <button
                    onClick={clearConversation}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                  >
                    Clear Chat
                  </button> */}
                </div>
                <div className="grid gap-2">
                  {selectedPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => setInput(prompt)}
                      className="text-left p-3 h-auto justify-start text-sm"
                    >
                      {prompt}
                    </Button>
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
                  <Button
                    variant="link"
                    size="sm"
                    onClick={retryInitialization}
                    className="text-xs mt-2 p-0 h-auto"
                  >
                    Retry Connection
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoadingHistory && messages.map((message, index) => (
          <div key={index} className="space-y-2">
            <div
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg relative group ${message.role === 'user'
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
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code: (props: any) => {
                            const { inline, className, children, ...rest } = props;
                            return inline ? (
                              <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...rest}>
                                {children}
                              </code>
                            ) : (
                              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto">
                                <code className={className} {...rest}>
                                  {children}
                                </code>
                              </pre>
                            )
                          }
                        }}
                      >
                        {message.content}
                      </Markdown>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>

                {/* Copy button for user messages */}
                {message.role === 'user' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(message.content, index, false)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto hover:bg-blue-600"
                    title={copiedStates[index] ? 'Copied!' : 'Copy prompt'}
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Copy and Retry buttons for assistant messages - only show when response is complete */}
            {message.role === 'assistant' && message.content && !isLoading && (
              <div className="flex justify-start">
                <div className="flex space-x-2 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(message.content, index, false)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs h-auto"
                    title={copiedStates[index] ? 'Copied as text!' : 'Copy as text'}
                  >
                    <DocumentDuplicateIcon className="h-3 w-3" />
                    <span>{copiedStates[index] ? 'Copied!' : 'Copy Text'}</span>
                  </Button>
                  {/* <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(message.content, index, true)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs h-auto text-gray-500"
                    title="Copy as markdown"
                  >
                    <span>MD</span>
                  </Button> */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => retryMessage(index)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs h-auto"
                    title="Retry"
                  >
                    <ArrowPathIcon className="h-3 w-3" />
                    <span>Retry</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Streaming response */}
        {!isLoadingHistory && isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-gray-200 dark:bg-gray-700 p-3 rounded-lg">
              {streamingContent ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: (props: any) => {
                        const { inline, className, children, ...rest } = props;
                        return inline ? (
                          <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...rest}>
                            {children}
                          </code>
                        ) : (
                          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto">
                            <code className={className} {...rest}>
                              {children}
                            </code>
                          </pre>
                        )
                      }
                    }}
                  >
                    {streamingContent}
                  </Markdown>
                  <div className="inline-flex items-center ml-1">
                    <div className="animate-pulse w-2 h-4 bg-gray-400 dark:bg-gray-500 rounded"></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span>Thinking...</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <div className="absolute bottom-4 right-4">
            <Button
              onClick={scrollToBottom}
              size="sm"
              variant="secondary"
              className="rounded-full shadow-lg"
              title="Scroll to bottom"
            >
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-4">

        
        {/* Selected tool badge */}
        {selectedTool && (
          <div className="mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm">
              <span>{selectedTool.label}</span>
              <button
                onClick={() => setSelectedTool(null)}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded p-0.5"
                title="Remove tool"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Attached page preview */}
        {attachedPageContext && (
          <div className="mb-2">
            <div className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm w-full">
              <img 
                src={`https://www.google.com/s2/favicons?domain=${new URL(attachedPageContext.url).hostname}&sz=16`}
                alt="Site favicon"
                className="w-4 h-4 flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{attachedPageContext.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{new URL(attachedPageContext.url).hostname}</div>
              </div>
              <button
                onClick={() => setAttachedPageContext(null)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1 flex-shrink-0"
                title="Remove page context"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Input area */}
        <div className="space-y-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isServiceReady || isLoading || isLoadingHistory}
            className="w-full min-h-[60px] max-h-32 resize-none bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={
              isLoadingHistory
                ? 'Loading conversation...'
                : !isServiceReady
                  ? 'AI service not available...'
                  : selectedTool
                    ? `${selectedTool.description}...`
                    : 'Type your message... (Enter to send, Ctrl+Enter for new line)'
            }
            rows={2}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
          
          {/* Button row */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {/* Tools dropdown */}
              <div className="relative" ref={toolsDropdownRef}>
                <Button
                  onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                  variant={selectedTool ? "default" : "outline"}
                  size="icon"
                  disabled={!isServiceReady}
                  className={`${selectedTool ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  title={isServiceReady ? "AI Tools" : "Configure AI provider to use tools"}
                >
                  <WrenchScrewdriverIcon className="h-4 w-4" />
                </Button>
              
                {/* Tools dropdown */}
                {showToolsDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    {Object.entries(TOOL_CATEGORIES).map(([category, label]) => (
                      <div key={category}>
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                          {label}
                        </div>
                        {AI_TOOLS.filter(tool => tool.category === category).map(tool => (
                          <button
                            key={tool.id}
                            onClick={() => {
                              setSelectedTool(tool);
                              setShowToolsDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                          >
                            <div className="font-medium">{tool.label}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{tool.description}</div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Attach page content dropdown */}
              {isServiceReady && !isFullscreen && (
                <div className="relative" ref={attachDropdownRef}>
                  <Button
                    onClick={() => setShowAttachDropdown(!showAttachDropdown)}
                    variant={attachedPageContext ? "default" : "outline"}
                    size="icon"
                    disabled={isGettingPageContext || isLoading}
                    className={`${attachedPageContext ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    title="Attach Page Content"
                  >
                    <PaperClipIcon className="h-4 w-4" />
                  </Button>
                  
                  {/* Attach dropdown */}
                  {showAttachDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => getPageContext('detailed')}
                        disabled={isGettingPageContext}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm border-b border-gray-100 dark:border-gray-700"
                      >
                        <div className="font-medium">{isGettingPageContext ? 'Extracting...' : 'Attach Page Content'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Extract and attach current page content</div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <Button
              onClick={isLoading ? stopResponse : sendMessage}
              disabled={(!input.trim() && !isLoading) || !isServiceReady || isLoadingHistory}
              size="icon"
              variant={isLoading ? "destructive" : "default"}
              title={isLoading ? "Stop response" : "Send message"}
            >
              {isLoading ? (
                <StopIcon className="h-5 w-5" />
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {!isServiceReady && !isLoadingHistory && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Configure an AI provider in Settings to start chatting
          </p>
        )}
        
        {trialStatus.isTrialMode && (
          <div className="mt-2 text-center">
            <p className="text-xs font-medium">
              {trialStatus.remainingRequests <= 0 ? (
                <span className="text-red-600 dark:text-red-400">☹️ Trial mode: You've used up all your trial requests</span>
              ) : (
                <span className={trialStatus.remainingRequests <= 2 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                  🎁 Trial mode: {trialStatus.remainingRequests}/{trialStatus.totalRequests} trial requests remaining
                </span>
              )}
            </p>
            {trialStatus.remainingRequests <= 2 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                <span className="font-medium">To continue using Delight, please set up your own API key in Settings.</span><br/>
                <a className="underline" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                  Google Gemini has a free tier of up to 1,500 requests per day.
                </a>
              </p>
            )}
          </div>
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