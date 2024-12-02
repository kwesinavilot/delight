import React, { useState } from 'react';

type SummaryLength = 'short' | 'medium' | 'detailed';

const SummaryPanel: React.FC = () => {
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const generateSummary = async (length: SummaryLength) => {
    setIsLoading(true);
    setSummaryLength(length);

    try {
      // TODO: Implement actual summary generation
      const response = "This is a placeholder summary. AI integration coming soon!";
      setSummary(response);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex space-x-2 mb-4">
        {(['short', 'medium', 'detailed'] as SummaryLength[]).map((length) => (
          <button
            key={length}
            onClick={() => generateSummary(length)}
            className={`px-4 py-2 rounded-lg ${
              summaryLength === length
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            {length.charAt(0).toUpperCase() + length.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="animate-pulse">Generating summary...</div>
        ) : (
          <div className="prose dark:prose-invert">
            {summary || 'Click a button above to generate a summary'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryPanel; 