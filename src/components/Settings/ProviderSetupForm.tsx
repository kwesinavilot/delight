import { useEffect, useRef, useState } from 'react';
import { ConfigManager } from '../../services/config/ConfigManager';
import { AIService } from '../../services/ai/AIService';
import { providerOptions, ProviderId, testProviderConfiguration } from '../../services/config/ProviderSetup';

import { saveAgentModel } from '../../services/config/AgentModel';
import { AIConfiguration } from '../../types/ai';
import ProviderModelPicker from './ProviderModelPicker';

export default function ProviderSetupForm({ onReady, purpose = 'default', initialConfiguration, onBusyChange }: { onReady: (ready: boolean) => void; purpose?: 'default' | 'agent'; initialConfiguration?: AIConfiguration; onBusyChange?: (busy: boolean) => void }) {
  const [provider, setProvider] = useState<ProviderId>((initialConfiguration?.provider as ProviderId) || 'groq');
  const [apiKey, setApiKey] = useState(initialConfiguration?.apiKey || '');
  const [model, setModel] = useState<string>(initialConfiguration?.model || providerOptions.groq.model);
  const [busy, setBusy] = useState(false);
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  const [status, setStatus] = useState('');
  const [tested, setTested] = useState(false);
  const version = useRef(0);
  useEffect(() => {
    onReady(false);
    return () => { version.current++; };
  }, [onReady]);
  const reset = () => { version.current++; setStatus(''); setTested(false); onReady(false); };
  const config = () => ({ provider, apiKey: apiKey.trim(), model: model.trim(), maxTokens: 1000, temperature: 0.7 });
  const test = async () => {
    const current = ++version.current;
    setBusy(true); setStatus('Testing your selected model...'); onReady(false);
    try {
      const value = config();
      await testProviderConfiguration(value, purpose);
      if (current !== version.current) return;
      if (purpose === 'agent') await saveAgentModel(value);
      else {
        const manager = ConfigManager.getInstance();
        await manager.initialize();
        await manager.setConfiguration(provider, value);
        await manager.setCurrentProvider(provider);
        await AIService.getInstance().refreshProviderConfiguration();
      }
      if (current !== version.current) return;
      setTested(true); onReady(true); setStatus('Connection verified. Your provider and model are ready.');
    } catch (error) {
      if (current === version.current) setStatus(error instanceof Error ? error.message : 'Connection failed.');
    } finally { if (current === version.current) setBusy(false); }
  };
  return <div className="max-w-xl mx-auto space-y-4">
    <p className="text-sm text-gray-600 dark:text-gray-300">Choose your provider, enter your own key, and test the model before starting. Provider usage charges and quotas apply.</p>
    <label className="block">AI provider
      <select className="block w-full border rounded p-2 dark:bg-gray-800" value={provider} disabled={busy}
        onChange={event => { reset(); const id = event.target.value as ProviderId; setProvider(id); setApiKey(''); setModel(providerOptions[id].model); }}>
        {Object.entries(providerOptions).map(([id, item]) => <option key={id} value={id}>{item.name}</option>)}
      </select>
    </label>
    {provider !== 'ollama' && <label className="block">API key
      <input type="password" autoComplete="off" spellCheck={false} className="block w-full border rounded p-2 dark:bg-gray-800"
        value={apiKey} disabled={busy} onChange={event => { reset(); setApiKey(event.target.value); }} />
    </label>}
    {purpose === 'agent' && provider !== 'ollama' && <button type="button" disabled={busy} className="text-sm text-blue-600 underline" onClick={async () => {
      const current = ++version.current; setBusy(true); onReady(false);
      try {
        const saved = await ConfigManager.getInstance().getProviderConfig(provider);
        if (current !== version.current) return;
        setApiKey(saved.apiKey || ''); setTested(false); setStatus(saved.apiKey ? 'Saved key loaded. Test the agent connection to save this choice.' : 'No saved key for this provider. Enter a key below.');
      } catch { if (current === version.current) setStatus('Could not load the saved provider key.'); }
      finally { if (current === version.current) setBusy(false); }
    }}>Use saved provider key</button>}
    <a href={providerOptions[provider].url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{provider === 'ollama' ? 'Set up Ollama' : 'Get a key from your provider'}</a>
    <ProviderModelPicker provider={provider} value={model} disabled={busy} recommended={providerOptions[provider].models} onChange={value => { reset(); setModel(value); }} />
    {provider === 'ollama' && <p className="text-sm">No API key is needed. Start Ollama and install the selected model on this machine before testing.</p>}
    <p className="text-sm rounded bg-blue-50 dark:bg-gray-900 p-3">Your key is stored only in this browser profile on this machine. Delight does not sync it to other devices or store it on our servers. It is sent directly to your selected AI provider to authenticate tests and AI requests.</p>
    <button type="button" className="rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-50" disabled={busy || !model.trim() || (provider !== 'ollama' && !apiKey.trim())} onClick={test}>{busy ? 'Please wait...' : tested ? 'Test again' : 'Test and save connection'}</button>
    <p role="status" aria-live="polite" className="text-sm">{status}</p>
  </div>;
}
