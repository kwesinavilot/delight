import { useEffect, useRef, useState } from 'react';
import { ConfigManager } from '../../services/config/ConfigManager';
import { AIService } from '../../services/ai/AIService';
import { listGeminiModels, providerOptions, ProviderId, testProviderConfiguration } from '../../services/config/ProviderSetup';

export default function ProviderSetupForm({ onReady }: { onReady: (ready: boolean) => void }) {
  const [provider, setProvider] = useState<ProviderId>('groq');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState<string>(providerOptions.groq.model);
  const [models, setModels] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
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
      await testProviderConfiguration(value);
      if (current !== version.current) return;
      const manager = ConfigManager.getInstance();
      await manager.initialize();
      await manager.setConfiguration(provider, value);
      await manager.setCurrentProvider(provider);
      await AIService.getInstance().refreshProviderConfiguration();
      if (current !== version.current) return;
      setTested(true); onReady(true); setStatus('Connection verified. Your provider and model are ready.');
    } catch (error) {
      if (current === version.current) setStatus(error instanceof Error ? error.message : 'Connection failed.');
    } finally { if (current === version.current) setBusy(false); }
  };
  const loadModels = async () => {
    const current = ++version.current;
    setBusy(true); setStatus('Loading available Gemini models...');
    try {
      const available = await listGeminiModels(apiKey);
      if (current !== version.current) return;
      setModels(available); setStatus(available.length ? 'Models loaded. Choose one and test the connection.' : 'No text-generation models were returned. Enter a model ID manually.');
    } catch (error) {
      if (current === version.current) setStatus(error instanceof Error ? error.message : 'Could not load models.');
    } finally { if (current === version.current) setBusy(false); }
  };
  return <div className="max-w-xl mx-auto space-y-4">
    <p className="text-sm text-gray-600 dark:text-gray-300">Choose your provider, enter your own key, and test the model before starting. Provider usage charges and quotas apply.</p>
    <label className="block">AI provider
      <select className="block w-full border rounded p-2 dark:bg-gray-800" value={provider} disabled={busy}
        onChange={event => { reset(); const id = event.target.value as ProviderId; setProvider(id); setApiKey(''); setModel(providerOptions[id].model); setModels([]); }}>
        {Object.entries(providerOptions).map(([id, item]) => <option key={id} value={id}>{item.name}</option>)}
      </select>
    </label>
    {provider !== 'ollama' && <label className="block">API key
      <input type="password" autoComplete="off" spellCheck={false} className="block w-full border rounded p-2 dark:bg-gray-800"
        value={apiKey} disabled={busy} onChange={event => { reset(); setApiKey(event.target.value); }} />
    </label>}
    <a href={providerOptions[provider].url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{provider === 'ollama' ? 'Set up Ollama' : 'Get a key from your provider'}</a>
    <label className="block">Model ID
      <input list="setup-models" className="block w-full border rounded p-2 dark:bg-gray-800" value={model} disabled={busy}
        onChange={event => { reset(); setModel(event.target.value); }} />
      <datalist id="setup-models">{Array.from(new Set([...providerOptions[provider].models, ...models])).map(id => <option key={id} value={id} />)}</datalist>
    </label>
    {provider === 'gemini' && <>
      <button type="button" className="text-blue-600 underline disabled:opacity-50" disabled={busy || !apiKey.trim()} onClick={loadModels}>Load models for this Gemini key</button>
      <p className="text-sm">Model access and free-tier quotas depend on your Google project. A quota error does not mean your key is invalid. You can also enter a model ID from AI Studio.</p>
    </>}
    {provider === 'ollama' && <p className="text-sm">No API key is needed. Start Ollama and install the selected model on this machine before testing.</p>}
    <p className="text-sm rounded bg-blue-50 dark:bg-gray-900 p-3">Your key is stored only in this browser profile on this machine. Delight does not sync it to other devices or store it on our servers. It is sent directly to your selected AI provider to authenticate tests and AI requests.</p>
    <button type="button" className="rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-50" disabled={busy || !model.trim() || (provider !== 'ollama' && !apiKey.trim())} onClick={test}>{busy ? 'Please wait...' : tested ? 'Test again' : 'Test and save connection'}</button>
    <p role="status" aria-live="polite" className="text-sm">{status}</p>
  </div>;
}
