import {
  ExclamationTriangleIcon,
  // InformationCircleIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  AcademicCapIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import PageFooter from '@/components/ui/PageFooter';

const AccuracyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <ShieldCheckIcon className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Understanding AI Accuracy in Delight</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Learn about AI limitations, best practices, and how to use Delight responsibly for the best results.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 space-y-8">
            <h3 className="dark:text-red-200 font-medium items-center mb-0 text-center text-red-800 text-sm">Delight is designed to assist and support human decision-making, not replace it.</h3>

            <div className="space-y-6 text-gray-700 dark:text-gray-300">
              <p>
                In an attempt to be a helpful assistant, Delight can occasionally produce responses that are incorrect or misleading.
              </p>

              <p>
                This is known as "hallucinating" information, and it's a byproduct of some of the current limitations of frontier Generative AI models used by Delight. For example, in some subject areas, AI models might not have been trained on the most-up-to-date information and may get confused when prompted about current events. Another example is that Delight can display quotes that may look authoritative or sound convincing, but are not grounded in fact. In other words, Delight can write things that might look correct but are very mistaken.
              </p>

              <p>
                Users should not rely on Delight as a singular source of truth and should carefully scrutinize any high-stakes advice given by Delight.
              </p>

              <p>
                When working with web search results or page content, users should review Delight's cited sources. Original websites may contain important context or details not included in Delight's synthesis. Additionally, the quality of Delight's responses depends on the underlying sources it references, so checking original content helps you identify any information that might be misinterpreted without the full context.
              </p>

              <p>
                You can use the feedback mechanisms or contact support if a particular response was unhelpful or concerning.
              </p>
            </div>

            {/* Common Issues */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Common Issues to Watch For</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Outdated Information</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">AI models may not have the most current data</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">False Citations</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Generated quotes or references that sound authoritative but are incorrect</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Confident Errors</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Incorrect information presented with apparent certainty</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Context Misunderstanding</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Misinterpreting the intent or context of your question</p>
                </div>
              </div>
            </div>

            {/* Best Practices */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <LightBulbIcon className="h-6 w-6 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Best Practices</h2>
              </div>
              <div className="border-l-4 border-green-400 bg-green-50 dark:bg-green-900/20 p-4 rounded-r-lg">
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start space-x-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Cross-reference important information with reliable sources</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Be especially cautious with medical, legal, or financial advice</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Use Delight as a starting point, not the final authority</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>When in doubt, consult human experts or official sources</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* High-Stakes Information */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">High-Stakes Information</h2>
              </div>
              <div className="border-l-4 border-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-r-lg">
                <p className="font-medium text-red-800 dark:text-red-200 mb-3">Never rely solely on Delight for:</p>
                <ul className="space-y-1 text-red-700 dark:text-red-300">
                  <li>• Medical diagnoses or treatment decisions</li>
                  <li>• Legal advice or interpretation</li>
                  <li>• Financial investment decisions</li>
                  <li>• Safety-critical procedures</li>
                  <li>• Academic citations without verification</li>
                </ul>
              </div>
            </div>

            {/* Improving Accuracy */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <AcademicCapIcon className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Improving Accuracy</h2>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-3">To get better results from Delight:</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Provide clear, specific questions</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Ask for sources when possible</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Break complex questions into smaller parts</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Specify the type of response you need</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <PageFooter />
      </div>
    </div>
  );
};

export default AccuracyPage;