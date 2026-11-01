import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button } from '../ui/button';
import { AgentOrchestrator } from '../../services/agents/AgentOrchestrator';
import { agentHistory } from '../../services/agents/AgentHistory';

export default function AgentPage({ onBack }: { onBack: () => void }) {
  const snapshot = useSyncExternalStore(agentHistory.subscribe, agentHistory.getSnapshot);
  const [input, setInput] = useState('');
  const [selectedId, setSelectedId] = useState<string>();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const mounted = useRef(true);
  const runSerial = useRef(0);
  const bottom = useRef<HTMLDivElement>(null);
  const orchestrator = AgentOrchestrator.getInstance();
  const active = snapshot.tasks.find(task => task.status === 'running');
  const selected = snapshot.tasks.find(task => task.id === selectedId) || snapshot.tasks[0];
  const busy = !!active || submitting;

  useEffect(() => {
    mounted.current = true;
    void agentHistory.initialize();
    return () => {
      mounted.current = false;
      runSerial.current++;
      void orchestrator.stopCurrentTask();
    };
  }, [orchestrator]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest' }); }, [selected?.events.length]);

  const execute = async () => {
    if (!input.trim() || busy || !snapshot.loaded) return;
    const serial = ++runSerial.current;
    setSubmitting(true); setError(''); setSelectedId(undefined);
    try {
      // History updates come from the runtime, so completion and cancellation
      // are retained even if this component unmounts while awaiting a provider.
      await orchestrator.executeTask(input.trim());
    } catch (cause) {
      if (mounted.current && serial === runSerial.current) setError(cause instanceof Error ? cause.message : 'Could not start task.');
    } finally {
      if (mounted.current && serial === runSerial.current) setSubmitting(false);
    }
  };

  return <div className="flex flex-col h-full">
    <header className="flex items-center justify-between p-4 border-b dark:border-gray-700">
      <Button variant="ghost" size="sm" onClick={onBack}>Back</Button>
      <h1 className="text-lg font-semibold">Agent Automation</h1>
    </header>
    <div className="p-3 border-b dark:border-gray-700 space-y-2">
      <label className="block text-sm">Task history
        <select aria-label="Task history" className="w-full border rounded p-2 dark:bg-gray-800"
          value={selected?.id || ''} disabled={!snapshot.loaded || !snapshot.tasks.length}
          onChange={event => setSelectedId(event.target.value)}>
          {!snapshot.tasks.length && <option value="">{snapshot.loaded ? 'No saved tasks' : 'Loading history...'}</option>}
          {snapshot.tasks.map(task => <option key={task.id} value={task.id}>{task.status} — {task.input.slice(0, 90)}</option>)}
        </select>
      </label>
      <div className="flex gap-3 text-xs">
        <button type="button" className="underline disabled:opacity-40" disabled={!selected || selected.status === 'running'}
          onClick={() => { if (selected) void agentHistory.remove(selected.id); }}>Delete selected task</button>
        <button type="button" className="underline disabled:opacity-40" disabled={!snapshot.tasks.some(task => task.status !== 'running')}
          onClick={() => { void agentHistory.clear(); }}>Clear saved history</button>
      </div>
      <p className="text-xs text-gray-500">Last 20 tasks are saved on this machine. Leaving Agent mode cancels the active task.</p>
      {snapshot.storageError && <p role="alert" className="text-sm text-red-600">{snapshot.storageError}</p>}
    </div>
    <main className="flex-1 overflow-y-auto p-4 space-y-4">
      {selected ? <>
        <div>
          <h2 className="font-medium break-words">{selected.input}</h2>
          <p className="text-sm capitalize" role="status">{selected.status}</p>
          <p className="text-xs text-gray-500">{new Date(selected.startedAt).toLocaleString()}</p>
        </div>
        {selected.steps.length > 0 && <section aria-label="Task actions" className="border rounded p-3 dark:border-gray-700">
          <h3 className="font-medium text-sm mb-2">Actions ({selected.steps.length})</h3>
          <ol className="space-y-2 text-sm">
            {selected.steps.map((step, index) => <li key={step.id}>
              <span className="font-medium">{index + 1}. {step.description}</span>
              <span className="ml-2 text-xs text-gray-500">{step.status}</span>
            </li>)}
          </ol>
        </section>}
        <section aria-label="Task activity" className="space-y-2">
          {selected.events.map(event => <div key={event.id} className="text-sm">
            <span className="text-xs text-gray-500 mr-2">{new Date(event.timestamp).toLocaleTimeString()}</span>
            <span className={event.kind === 'error' ? 'text-red-600' : event.kind === 'success' ? 'text-green-600' : ''}>{event.message}</span>
          </div>)}
        </section>
        {selected.result && <div className="rounded border p-3 dark:border-gray-700">
          <h3 className="text-sm font-medium">{selected.status === 'completed' ? 'Result' : 'Task outcome'}</h3>
          <p className="text-sm whitespace-pre-wrap break-words">{selected.result}</p>
        </div>}
      </> : <p className="text-sm text-gray-500">Describe a task to navigate, search, interact with pages, or extract information.</p>}
      <div ref={bottom} />
    </main>
    <div className="p-4 border-t dark:border-gray-700 space-y-2">
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <textarea aria-label="Browser task" className="flex-1 rounded border p-2 bg-transparent dark:border-gray-700" rows={2}
          value={input} disabled={busy || !snapshot.loaded} placeholder="Describe a browser task..."
          onChange={event => setInput(event.target.value)} onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) { event.preventDefault(); void execute(); }
          }} />
        {busy ? <Button variant="destructive" onClick={() => { runSerial.current++; setSubmitting(false); void orchestrator.stopCurrentTask(); }}>Stop</Button>
          : <Button disabled={!input.trim() || !snapshot.loaded} onClick={() => { void execute(); }}>Run</Button>}
      </div>
    </div>
  </div>;
}
