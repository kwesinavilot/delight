import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ConversationManager } from '@/services/chat/ConversationManager';
// import { AIService } from '@/services/ai/AIService';

interface ProviderSwitchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: string;
  targetProvider: string;
  targetProviderName: string;
  onConfirm: (options: {
    preserveContext: boolean;
    convertContext: boolean;
    createNewSession: boolean;
  }) => Promise<void>;
}

interface SwitchRecommendations {
  canPreserveContext: boolean;
  shouldConvertContext: boolean;
  warnings: string[];
  recommendations: string[];
  estimatedTokensAfterSwitch?: number;
}

const ProviderSwitchDialog: React.FC<ProviderSwitchDialogProps> = ({
  isOpen,
  onClose,
  currentProvider,
  targetProvider,
  targetProviderName,
  onConfirm
}) => {
  const [recommendations, setRecommendations] = useState<SwitchRecommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'preserve' | 'new' | 'clear'>('preserve');
  const [convertContext, setConvertContext] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && currentProvider !== targetProvider) {
      loadRecommendations();
    }
  }, [isOpen, currentProvider, targetProvider]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const conversationManager = ConversationManager.getInstance();
      const recs = await conversationManager.getProviderSwitchRecommendations(targetProvider);
      setRecommendations(recs);
      
      // Set default option based on recommendations
      if (!recs.canPreserveContext) {
        setSelectedOption('new');
      } else if (recs.warnings.length > 2) {
        setSelectedOption('new');
      }
      
      setConvertContext(recs.shouldConvertContext);
    } catch (error) {
      console.error('Failed to load switch recommendations:', error);
      setRecommendations({
        canPreserveContext: false,
        shouldConvertContext: false,
        warnings: ['Unable to analyze context compatibility'],
        recommendations: ['Consider starting a new conversation']
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const options = {
        preserveContext: selectedOption === 'preserve',
        convertContext: selectedOption === 'preserve' && convertContext,
        createNewSession: selectedOption === 'new'
      };
      
      await onConfirm(options);
      onClose();
    } catch (error) {
      console.error('Failed to switch provider:', error);
      // Error handling is done in parent component
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Switch to {targetProviderName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Analyzing context...</span>
            </div>
          ) : recommendations ? (
            <>
              {/* Warnings */}
              {recommendations.warnings.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                        Potential Issues
                      </h4>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                        {recommendations.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {recommendations.recommendations.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Recommendations
                      </h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        {recommendations.recommendations.map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  How would you like to switch?
                </h4>

                {/* Preserve Context Option */}
                {recommendations.canPreserveContext && (
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="switchOption"
                      value="preserve"
                      checked={selectedOption === 'preserve'}
                      onChange={(e) => setSelectedOption(e.target.value as 'preserve')}
                      className="mt-1 h-4 w-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Keep current conversation
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Continue with the same conversation history in {targetProviderName}
                      </div>
                      
                      {/* Context conversion option */}
                      {selectedOption === 'preserve' && recommendations.shouldConvertContext && (
                        <div className="mt-2 ml-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={convertContext}
                              onChange={(e) => setConvertContext(e.target.checked)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Convert message format for {targetProviderName}
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  </label>
                )}

                {/* New Session Option */}
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="switchOption"
                    value="new"
                    checked={selectedOption === 'new'}
                    onChange={(e) => setSelectedOption(e.target.value as 'new')}
                    className="mt-1 h-4 w-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Start fresh conversation
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Begin a new conversation with {targetProviderName} (current conversation will be saved)
                    </div>
                  </div>
                </label>
              </div>

              {/* Token estimate */}
              {recommendations.estimatedTokensAfterSwitch && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Estimated tokens after switch: {recommendations.estimatedTokensAfterSwitch}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-gray-600 dark:text-gray-400">
              Unable to load recommendations
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing || loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Switching...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                <span>Switch Provider</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderSwitchDialog;