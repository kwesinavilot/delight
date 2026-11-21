import { useEffect, useState } from 'react';
import ProviderSetupForm from './ProviderSetupForm';
import AgentModelSettings from './AgentModelSettings';
export default function OnboardingModelSetup({ onReady }: { onReady: (ready: boolean) => void }) {
  const [defaultReady, setDefaultReady] = useState(false);
  const [agentReady, setAgentReady] = useState(false);
  useEffect(() => { onReady(defaultReady && agentReady); }, [defaultReady, agentReady, onReady]);
  return <div className="max-w-xl mx-auto space-y-8">
    <section aria-label="Default chat model"><h3 className="font-semibold mb-3">Default chat model</h3><ProviderSetupForm onReady={setDefaultReady} /></section>
    <AgentModelSettings onReady={setAgentReady} />
    <p className="text-sm text-gray-500">Agents start with a 50-step limit, confirmation for recognized sensitive actions, and 20 saved tasks. Change these in Settings → Agent.</p>
  </div>;
}
