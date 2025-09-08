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
  const [isPlanning, setIsPlanning] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [currentPlan, setCurrentPlan] = useState<TaskStep[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
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
    setIsPlanning(true);
    setLogs([]);
    setCurrentPlan([]);
    setCurrentStep(-1);
    setCompletedSteps(new Set());

    try {
      addLog('info', 'System', `Starting task: "${input}"`);
      
      const result = await orchestratorRef.current.executeTask(input, {
        onPlanCreated: (plan) => {
          setCurrentPlan(plan);
          setIsPlanning(false);
          addLog('thinking', 'Planner', `Created execution plan with ${plan.length} steps`, plan);
        },
        onStepStart: (stepIndex, step) => {
          setCurrentStep(stepIndex);
          addLog('info', 'Navigator', `Step ${stepIndex + 1}: ${step.description}`);
        },
        onStepComplete: (stepIndex, _step, result) => {
          setCompletedSteps(prev => new Set([...prev, stepIndex]));
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
      setIsPlanning(false);
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
        {/* Planning Spinner */}
        {isPlanning && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-600 dark:text-blue-400">Creating execution plan...</span>
            </div>
          </div>
        )}

        {/* Interleaved Logs and Steps */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

          {/* Show execution plan after it's created */}
          {currentPlan.length > 0 && logs.some(log => log.agent === 'Planner') && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                📋 Execution Plan ({currentPlan.length} steps)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentPlan.map((step, index) => {
                  const isCompleted = completedSteps.has(index);
                  const isRunning = index === currentStep;
                  
                  return (
                    <div
                      key={index}
                      className={`text-xs p-2 rounded border flex items-center gap-2 transition-colors ${
                        isCompleted
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                          : isRunning
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <span className="text-green-600 dark:text-green-400">✅</span>
                        ) : isRunning ? (
                          <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                        ) : (
                          <span className="text-gray-400">⏸️</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{index + 1}. {step.type}</div>
                        <div className="truncate" title={step.description}>{step.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
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