import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { PaperAirplaneIcon, StopIcon } from '@heroicons/react/24/outline';
import { AgentOrchestrator } from '../../services/agents/AgentOrchestrator';
import { TaskStep } from '../../types/agents';

interface AgentPageProps {
  onBack: () => void;
}

interface AgentLog {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'thinking';
  agent: string;
  message: string;
  details?: any;
}

const AgentPage: React.FC<AgentPageProps> = ({ onBack }) => {
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [currentPlan, setCurrentPlan] = useState<TaskStep[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const orchestratorRef = useRef<AgentOrchestrator | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    orchestratorRef.current = AgentOrchestrator.getInstance();
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (type: AgentLog['type'], agent: string, message: string, details?: any) => {
    const log: AgentLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      agent,
      message,
      details
    };
    setLogs(prev => [...prev, log]);
    
    // Also log to console
    const consoleMessage = `[${agent}] ${message}`;
    switch (type) {
      case 'error':
        console.error('🤖 Agent:', consoleMessage, details);
        break;
      case 'success':
        console.log('✅ Agent:', consoleMessage, details);
        break;
      case 'thinking':
        console.log('🧠 Agent:', consoleMessage, details);
        break;
      default:
        console.log('ℹ️ Agent:', consoleMessage, details);
    }
  };

  const executeTask = async () => {
    if (!input.trim() || !orchestratorRef.current) return;

    setIsExecuting(true);
    setLogs([]);
    setCurrentPlan([]);
    setCurrentStep(-1);

    try {
      addLog('info', 'System', `Starting task: "${input}"`);
      
      const result = await orchestratorRef.current.executeTask(input, {
        onPlanCreated: (plan) => {
          setCurrentPlan(plan);
          addLog('thinking', 'Planner', `Created execution plan with ${plan.length} steps`, plan);
        },
        onStepStart: (stepIndex, step) => {
          setCurrentStep(stepIndex);
          addLog('info', 'Navigator', `Step ${stepIndex + 1}: ${step.description}`);
        },
        onStepComplete: (stepIndex, _step, result) => {
          addLog('success', 'Navigator', `Completed step ${stepIndex + 1}`, result);
        },
        onStepError: (stepIndex, step, error) => {
          addLog('error', 'Navigator', `Failed step ${stepIndex + 1}: ${error}`, { step, error });
        },
        onProgress: (message) => {
          addLog('info', 'Monitor', message);
        }
      });

      if (result.success) {
        addLog('success', 'System', 'Task completed successfully!', result);
      } else {
        addLog('error', 'System', `Task failed: ${result.error}`, result);
      }
    } catch (error) {
      addLog('error', 'System', `Execution error: ${error}`, error);
    } finally {
      setIsExecuting(false);
      setCurrentStep(-1);
    }
  };

  const stopExecution = () => {
    // TODO: Implement stop functionality in orchestrator
    setIsExecuting(false);
    setCurrentStep(-1);
    addLog('info', 'System', 'Execution stopped by user');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      executeTask();
    }
  };

  const getLogIcon = (type: AgentLog['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'thinking': return '🧠';
      default: return 'ℹ️';
    }
  };

  const getLogColor = (type: AgentLog['type']) => {
    switch (type) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'thinking': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back
          </Button>
          <h1 className="text-lg font-semibold">🤖 Agent Automation</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Execution Plan */}
        {currentPlan.length > 0 && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-medium mb-2">🧠 Execution Plan</h3>
            <div className="space-y-1">
              {currentPlan.map((step, index) => (
                <div
                  key={index}
                  className={`text-xs p-2 rounded flex items-center gap-2 ${
                    index === currentStep
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : index < currentStep
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <span className="font-mono">
                    {index < currentStep ? '✅' : index === currentStep ? '⏳' : '⏸️'}
                  </span>
                  <span className="font-medium">{index + 1}.</span>
                  <span>{step.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {logs.length === 0 && !isExecuting && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <div className="text-4xl mb-4">🤖</div>
              <p className="text-lg font-medium mb-2">Agent Automation</p>
              <p className="text-sm">
                Describe a task you want me to perform on web pages.<br />
                I can navigate, click, fill forms, and extract information.
              </p>
            </div>
          )}

          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 text-sm">
              <span className="text-lg flex-shrink-0">{getLogIcon(log.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs text-gray-500 dark:text-gray-400">
                    {log.agent}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className={`${getLogColor(log.type)}`}>
                  {log.message}
                </div>
                {log.details && (
                  <details className="mt-1">
                    <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isExecuting}
              className="flex-1 min-h-[60px] max-h-32 resize-none bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 border border-gray-200 dark:border-gray-700 rounded"
              placeholder="Describe what you want me to do... (e.g., 'Go to Google and search for AI news')"
              rows={2}
            />
            <Button
              onClick={isExecuting ? stopExecution : executeTask}
              disabled={!input.trim() && !isExecuting}
              variant={isExecuting ? "destructive" : "default"}
              size="icon"
              className="self-end"
            >
              {isExecuting ? (
                <StopIcon className="h-5 w-5" />
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPage;