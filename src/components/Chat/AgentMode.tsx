import React, { useState } from 'react';
import { AgentOrchestrator } from '../../services/agents/AgentOrchestrator';
import { AutomationResult } from '../../types/agents';

interface AgentModeProps {
  onResult: (result: AutomationResult) => void;
}

export const AgentMode: React.FC<AgentModeProps> = ({ onResult }) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [input, setInput] = useState('');

  const orchestrator = AgentOrchestrator.getInstance();

  const handleExecute = async () => {
    if (!input.trim() || isExecuting) return;

    setIsExecuting(true);
    setProgress(null);

    orchestrator.setProgressCallback(setProgress);

    try {
      await orchestrator.initialize();
      const result = await orchestrator.executeTask(input);
      onResult(result);
    } catch (error) {
      onResult({
        taskId: `error_${Date.now()}`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0
      });
    } finally {
      setIsExecuting(false);
      setProgress(null);
    }
  };

  const handleStop = async () => {
    await orchestrator.stopCurrentTask();
    setIsExecuting(false);
    setProgress(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe what you want to automate..."
          className="flex-1 px-3 py-2 border rounded-md"
          disabled={isExecuting}
        />
        {isExecuting ? (
          <button
            onClick={handleStop}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={handleExecute}
            disabled={!input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            Execute
          </button>
        )}
      </div>

      {progress && (
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="font-medium capitalize">{progress.stage}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{progress.message}</p>
          {progress.currentStep && (
            <p className="text-xs text-gray-500">Step: {progress.currentStep}</p>
          )}
        </div>
      )}
    </div>
  );
};