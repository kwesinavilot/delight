import React, { useState } from 'react';
import { Button } from '../ui/button';
import { DOMAnalyzer, DOMAnalysisResult } from '../../services/automation/DOMAnalyzer';

export const DOMAnalysisTest: React.FC = () => {
  const [result, setResult] = useState<DOMAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const domAnalyzer = new DOMAnalyzer();

  const analyzeCurrentPage = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Get current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0]?.id;
      
      if (!tabId) {
        throw new Error('No active tab found');
      }

      const analysisResult = await domAnalyzer.analyzeTab(tabId, true);
      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearHighlights = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0]?.id;
      
      if (tabId) {
        await domAnalyzer.clearHighlights(tabId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear highlights');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <Button 
          onClick={analyzeCurrentPage} 
          disabled={isAnalyzing}
          className="flex-1"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Page'}
        </Button>
        <Button 
          onClick={clearHighlights}
          variant="outline"
        >
          Clear Highlights
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-medium text-green-800">Analysis Complete</h3>
            <p className="text-sm text-green-600 mt-1">
              Found {result.interactiveCount} interactive elements on {result.title}
            </p>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {result.elements.map((element, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded border text-sm">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                    {element.highlightIndex}
                  </span>
                  <span className="font-medium">{element.tagName}</span>
                </div>
                {element.text && (
                  <p className="text-gray-600 mt-1 truncate">{element.text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};