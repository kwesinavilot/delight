import { useEffect, useId, useMemo, useState } from 'react';
import { GatewayModel, listGatewayModels, ProviderId, providerOptions } from '../../services/config/ProviderSetup';

export default function ProviderModelPicker({ provider, value, onChange, disabled = false, recommended = [] }: {
  provider: ProviderId;
  value: string;
  onChange: (model: string) => void;
  disabled?: boolean;
  recommended?: string[];
}) {
  const listId = useId();
  const [models, setModels] = useState<GatewayModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const gatewayPrefix = providerOptions[provider].gatewayPrefix;
  useEffect(() => { setModels([]); setOpen(false); setQuery(''); setError(''); }, [provider]);
  const selected = models.find(model => model.modelId === value);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = models.filter(model => !needle || `${model.name} ${model.modelId} ${model.description}`.toLowerCase().includes(needle));
    return matches.slice(0, 40);
  }, [models, query]);
  const browse = async () => {
    setOpen(true);
    setError('');
    if (models.length) return;
    setLoading(true);
    try { setModels(await listGatewayModels(provider)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load models.'); }
    finally { setLoading(false); }
  };
  return <div className="space-y-2">
    <label className="block">Model ID
      <input list={listId} className="block w-full border rounded p-2 dark:bg-gray-800" value={value} disabled={disabled}
        onChange={event => onChange(event.target.value)} />
      <datalist id={listId}>{Array.from(new Set([...recommended, ...models.map(model => model.modelId)])).map(id => {
        const model = models.find(item => item.modelId === id);
        return <option key={id} value={id} label={model ? `${model.name} — ${model.description}` : undefined} />;
      })}</datalist>
    </label>
    {selected && <div className="rounded border bg-gray-50 dark:bg-gray-800 p-3 text-sm" aria-live="polite">
      <p className="font-medium">{selected.name}</p>
      {selected.description && <p className="text-gray-600 dark:text-gray-300 mt-1">{selected.description}</p>}
      <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600 dark:text-gray-300">
        {selected.contextWindow && <span>{selected.contextWindow.toLocaleString()} token context</span>}
        {selected.supportsReasoning && <span>Reasoning</span>}
        {selected.supportsToolCalling && <span>Tool calling</span>}
        {selected.supportsVision && <span>Image input</span>}
      </div>
    </div>}
    {gatewayPrefix ? <div>
      <button type="button" className="text-sm text-blue-600 underline disabled:opacity-50" disabled={disabled || loading} onClick={() => void browse()}>
        {loading ? 'Loading models...' : models.length ? 'Browse models' : 'Refresh model list'}
      </button>
      {/* <p className="text-xs text-gray-500 mt-1">Catalog provided by Vercel AI Gateway. Your selected provider may offer different access; test the model before saving.</p> */}
      {error && <p role="status" className="text-sm text-red-600 mt-1">{error}</p>}
      {open && models.length > 0 && <div className="mt-2 space-y-2">
        <label className="sr-only" htmlFor={`${listId}-filter`}>Filter models</label>
        <input id={`${listId}-filter`} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter by name or description" className="block w-full border rounded p-2 dark:bg-gray-800" />
        <div className="max-h-72 overflow-y-auto space-y-2" aria-label={`${providerOptions[provider].name} text models`}>
          {visible.map(model => <button type="button" key={model.id} onClick={() => { onChange(model.modelId); setOpen(false); }} className="w-full text-left rounded border p-3 hover:bg-blue-50 dark:hover:bg-gray-700">
            <span className="block font-medium">{model.name}</span>
            <span className="block text-xs text-gray-500">{model.modelId}</span>
            {model.description && <span className="block text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{model.description}</span>}
            <span className="block text-xs text-gray-500 mt-1">{[model.contextWindow ? `${model.contextWindow.toLocaleString()} token context` : '', model.supportsReasoning ? 'Reasoning' : '', model.supportsToolCalling ? 'Tool calling' : '', model.supportsVision ? 'Image input' : ''].filter(Boolean).join(' · ')}</span>
          </button>)}
          {!visible.length && <p className="text-sm text-gray-500 p-2">No models match that filter.</p>}
        </div>
        {models.length > visible.length && <p className="text-xs text-gray-500">Showing {visible.length} of {models.length}. Add a filter to narrow the list.</p>}
      </div>}
    </div> : provider === 'sambanova' ? <p className="text-xs text-gray-500">Enter a model ID from your SambaNova account or choose a suggested model.</p> : <p className="text-xs text-gray-500">Enter a model installed in your local Ollama library.</p>}
  </div>;
}
