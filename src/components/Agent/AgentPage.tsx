import { useEffect, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, ArrowUp, Bot, Check, ChevronDown, Globe, Loader2, Paperclip, Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import { AgentOrchestrator } from '../../services/agents/AgentOrchestrator';
import { agentHistory } from '../../services/agents/AgentHistory';

const suggestions = [
  ['Research a topic', 'Research a topic and summarize the key findings with sources.'],
  ['Compare options', 'Compare products or services and help me choose the best option.'],
  ['Work on this page', 'Review the attached page and help me complete a task on it.'],
  ['Find information', 'Find information online and organize it into a clear summary.'],
];
type PageAttachment = { tabId: number; title: string; url: string };

export default function AgentPage({ onBack }: { onBack: () => void }) {
  const snapshot = useSyncExternalStore(agentHistory.subscribe, agentHistory.getSnapshot);
  const [input, setInput] = useState('');
  const [selectedId, setSelectedId] = useState<string>();
  const [attachment, setAttachment] = useState<PageAttachment>();
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const selected = snapshot.tasks.find(task => task.id === selectedId);
  const active = snapshot.tasks.filter(task => task.status === 'running' || task.status === 'paused');
  const runtime = selected && AgentOrchestrator.forTask(selected.id);
  useEffect(() => { void agentHistory.initialize(); }, []);

  const attachPage = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id === undefined || !/^https?:/.test(tab.url || '')) throw new Error('Open a website to attach its page.');
      setAttachment({ tabId: tab.id, title: tab.title || 'Current page', url: tab.url! });
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not attach page.'); }
  };
  const execute = async (recoverId?: string) => {
    if (starting || !snapshot.loaded || (!recoverId && !input.trim())) return;
    setStarting(true); setError('');
    try {
      const agent = AgentOrchestrator.create();
      const prompt = input.trim();
      const tab = recoverId ? undefined : attachment || await chrome.tabs.create({ url: 'about:blank', active: false });
      const tabId = tab && ('tabId' in tab ? tab.tabId : tab.id);
      if (!recoverId && tabId === undefined) throw new Error('Could not open a tab for this agent.');
      const pending = recoverId ? agent.resumeSavedTask(recoverId) : agent.executeTask(prompt, {}, undefined, { tabId: tabId! });
      if (!recoverId) { setInput(''); setAttachment(undefined); }
      // executeTask registers its ID synchronously, before provider work begins.
      const id = recoverId || agent.getCurrentTask()?.id;
      setSelectedId(id);
      setStarting(false);
      void pending.catch(cause => setError(cause instanceof Error ? cause.message : 'Could not run agent.'));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not start agent.'); }
    finally { setStarting(false); }
  };

  return <div className="flex h-full flex-col bg-background text-foreground">
    <header className="flex items-center justify-between border-b p-3 gap-2">
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
      <span className="flex items-center gap-2 font-medium"><Bot className="h-4 w-4" />Agent</span>
      <Button variant="ghost" size="sm" onClick={() => { setSelectedId(undefined); setShowHistory(false); }}><Plus className="h-4 w-4 mr-1" />New</Button>
    </header>
    <div className="px-4 py-2 border-b flex items-center gap-2">
      <button type="button" className="text-xs text-muted-foreground hover:text-foreground" aria-expanded={showHistory} onClick={() => setShowHistory(!showHistory)}>
        {active.length ? `${active.length} active` : 'Recent agents'} <ChevronDown className="inline h-3 w-3" />
      </button>
      {active.length > 0 && <span className="h-2 w-2 rounded-full bg-green-500" aria-label="Agents active" />}
    </div>
    {showHistory && <section aria-label="Agent runs" className="max-h-48 overflow-y-auto border-b p-2 space-y-1">
      {!snapshot.tasks.length && <p className="p-2 text-xs text-muted-foreground">Your agents will appear here.</p>}
      {snapshot.tasks.map(task => <div key={task.id} className="flex items-center gap-1">
        <button type="button" aria-pressed={task.id === selectedId} onClick={() => { setSelectedId(task.id); setShowHistory(false); }} className="flex-1 min-w-0 text-left rounded-lg p-2 hover:bg-muted aria-pressed:bg-muted">
          <span className="block truncate text-sm">{task.input}</span><span className="text-xs text-muted-foreground capitalize">{task.status}</span>
        </button>
        {!['running', 'paused'].includes(task.status) && <Button variant="ghost" size="sm" aria-label={`Delete ${task.input}`} onClick={() => { void agentHistory.remove(task.id); }}><X className="h-3 w-3" /></Button>}
      </div>)}
    </section>}
    <main className="flex-1 overflow-y-auto px-5 py-6">
      {!selected ? <div className="mx-auto max-w-xl flex min-h-full flex-col justify-center">
        <div className="mb-7"><Bot className="h-9 w-9 mb-4 text-primary" /><h1 className="text-2xl font-semibold tracking-tight">What can I do for you?</h1><p className="text-sm text-muted-foreground mt-2">Give an agent a task and let it take care of the steps.</p></div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{suggestions.map(([title, prompt]) => <button type="button" key={title} onClick={() => setInput(prompt)} className="rounded-xl border p-4 text-left text-sm hover:bg-muted transition-colors">{title}</button>)}</div>
        {active.length > 0 && <button className="text-sm text-primary text-left mt-6" onClick={() => setShowHistory(true)}>{active.length} agent{active.length === 1 ? ' is' : 's are'} working. View runs <span aria-hidden="true">→</span></button>}
      </div> : <div className="mx-auto max-w-xl space-y-5">
        <div className="ml-8 rounded-2xl bg-muted px-4 py-3 whitespace-pre-wrap break-words text-sm">{selected.input}</div>
        <details key={selected.id} className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-muted-foreground py-2">
            {selected.status === 'running' && <Loader2 className="h-4 w-4 animate-spin" />}
            {selected.status === 'running' ? 'Thinking' : selected.status === 'paused' ? 'Paused' : `Worked for ${Math.max(1, Math.round(((selected.endedAt || Date.now()) - selected.startedAt) / 1000))}s`}
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="rounded-xl border p-3 mt-2 space-y-3 text-sm">
            {selected.steps.map(step => <div key={step.id} className="flex gap-2"><span className="shrink-0">{step.status === 'completed' ? <Check className="h-4 w-4 text-green-600" /> : '•'}</span><span>{step.description}<span className="text-xs text-muted-foreground ml-2">{step.status}</span></span></div>)}
            {selected.events.map(event => <p key={event.id} className={event.kind === 'error' ? 'text-red-600 text-xs' : 'text-muted-foreground text-xs'}>{event.message}</p>)}
          </div>
        </details>
        {selected.result && <p role="status" className="whitespace-pre-wrap break-words leading-relaxed text-sm">{selected.result}</p>}
        {runtime && <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { void (selected.status === 'paused' ? runtime.resumeCurrentTask() : runtime.pauseCurrentTask()); }}>{selected.status === 'paused' ? 'Resume' : 'Pause'}</Button>
          <Button variant="ghost" size="sm" onClick={() => { void runtime.stopCurrentTask(); }}>Stop</Button>
        </div>}
        {selected.status === 'interrupted' && selected.checkpoint?.version === 1 && <Button variant="outline" size="sm" disabled={starting} onClick={() => { void execute(selected.id); }}>Resume saved task</Button>}
      </div>}
    </main>
    <footer className="p-4 space-y-2">
      {(error || snapshot.storageError) && <p role="alert" className="text-sm text-red-600">{error || snapshot.storageError}</p>}
      <div className="rounded-2xl border bg-background shadow-sm p-3 focus-within:ring-1 focus-within:ring-primary">
        {attachment && <div className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1 mb-2 text-xs"><Globe className="h-3 w-3 shrink-0" /><span className="truncate" title={attachment.url}>{attachment.title}</span><button type="button" aria-label="Remove attached page" onClick={() => setAttachment(undefined)} className="ml-auto"><X className="h-3 w-3" /></button></div>}
        <textarea aria-label="Browser task" rows={3} value={input} placeholder="What would you like the agent to do?" className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground" onChange={event => setInput(event.target.value)} onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void execute(); }
        }} />
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => { void attachPage(); }} title="Attach current page" aria-label="Attach current page"><Paperclip className="h-4 w-4 mr-1" />Attach page</Button>
          <Button size="sm" disabled={!input.trim() || !snapshot.loaded || starting} onClick={() => { void execute(); }}>Run<ArrowUp className="h-4 w-4 ml-1" /></Button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground px-1">Agents share page content with your selected AI provider. Without an attachment, an agent opens a new tab. Runs continue while you use Delight; closing the panel interrupts them.</p>
    </footer>
  </div>;
}
