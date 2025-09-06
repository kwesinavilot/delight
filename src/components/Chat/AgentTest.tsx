import React, { useState } from 'react';
import { AgentMode } from './AgentMode';
import { AutomationResult } from '../../types/agents';

export const AgentTest: React.FC = () => {
  const [results, setResults] = useState<AutomationResult[]>([]);

  const handleResult = (result: AutomationResult) => {
    setResults(prev => [result, ...prev]);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="border-b pb-4">
        <h2 className="text-lg font-semibold mb-2">🤖 Agent Mode (Beta)</h2>
        <p className="text-sm text-gray-600">
          Try simple commands like: "Go to google.com and search for AI news"
        </p>
      </div>

      <AgentMode onResult={handleResult} />

      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Results:</h3>
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded-md border ${
                result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? '✅ Success' : '❌ Failed'}
                </span>
                <span className="text-xs text-gray-500">
                  {result.executionTime}ms
                </span>
              </div>
              
              {result.error && (
                <p className="text-sm text-red-600 mt-1">{result.error}</p>
              )}
              
              {result.data && (
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};