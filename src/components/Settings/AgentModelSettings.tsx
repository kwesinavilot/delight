import { useEffect, useState } from 'react';
import { AIConfiguration } from '../../types/ai';
import { loadAgentModel, saveAgentModel } from '../../services/config/AgentModel';
import ProviderSetupForm from './ProviderSetupForm';
const noop = (_ready: boolean) => {};

export default function AgentModelSettings({ onReady = noop }: { onReady?: (ready: boolean) => void }) {
  const [same, setSame] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [config, setConfig] = useState<AIConfiguration>();
  const [error, setError] = useState('');
  useEffect(() => {
    let mounted = true;
    onReady(false);
    void loadAgentModel().then(saved => {
      if (!mounted) return;
      setConfig(saved || undefined); setSame(!saved); setLoaded(true); onReady(true);
    }).catch(() => { if (mounted) { setLoaded(true); setSame(false); setError('Could not load the saved agent model. Test and save a model, or choose the default.'); } });
    return () => { mounted = false; };
  }, [onReady]);
  const choose = async (useSame: boolean) => {
    setBusy(true); setError(''); onReady(false);
    try {
      if (useSame) await saveAgentModel(null);
      setSame(useSame); onReady(useSame);
    } catch { setError('Could not save your agent model choice. Try again.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-3" aria-label="Agent model">
    <h3 className="font-semibold">Use the same model for agents?</h3>
    <p className="text-sm text-gray-500">Agents use your default chat model unless you choose a different provider or model here.</p>
    <label className="flex gap-2 items-center"><input type="radio" name="agent-model-choice" checked={same} disabled={!loaded || busy} onChange={() => { void choose(true); }} />Use the same model</label>
    <label className="flex gap-2 items-center"><input type="radio" name="agent-model-choice" checked={!same} disabled={!loaded || busy} onChange={() => { void choose(false); }} />Choose a different model</label>
    {loaded && !same && <ProviderSetupForm purpose="agent" initialConfiguration={config} onReady={onReady} onBusyChange={setBusy} />}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </section>;
}
