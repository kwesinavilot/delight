import { TaskStep } from '../../types/agents';

export type RunStatus = 'running' | 'completed' | 'failed' | 'cancelled' | 'interrupted';
export interface HistoryEvent { id: string; timestamp: number; message: string; kind: 'info' | 'success' | 'error'; }
export interface TaskHistory {
  id: string; input: string; startedAt: number; endedAt?: number; status: RunStatus;
  steps: TaskStep[]; events: HistoryEvent[]; result?: string;
}
interface Snapshot { tasks: TaskHistory[]; loaded: boolean; storageError?: string; }
const KEY = 'agentTaskHistoryV1';

export class AgentHistory {
  private snapshot: Snapshot = { tasks: [], loaded: false };
  private listeners = new Set<() => void>();
  private loading?: Promise<void>;
  private writes = Promise.resolve();
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(tasks: TaskHistory[], persist = true) {
    this.snapshot = { ...this.snapshot, tasks: tasks.slice(0, 20) };
    this.listeners.forEach(listener => listener());
    if (persist) {
      const value = JSON.parse(JSON.stringify(this.snapshot.tasks));
      this.writes = this.writes.then(async () => {
        try { await chrome.storage.local.set({ [KEY]: value }); }
        catch {
          this.snapshot = { ...this.snapshot, storageError: 'Task history could not be saved. It is available in this session only.' };
          this.listeners.forEach(listener => listener());
        }
      });
    }
  }
  initialize(): Promise<void> {
    return this.loading ||= (async () => {
      try {
        const data = (await chrome.storage.local.get([KEY]))[KEY];
        const tasks: TaskHistory[] = Array.isArray(data) ? data.filter(task =>
          task && typeof task.id === 'string' && typeof task.input === 'string' &&
          Array.isArray(task.steps) && Array.isArray(task.events) &&
          ['running', 'completed', 'failed', 'cancelled', 'interrupted'].includes(task.status)) : [];
        this.snapshot = { ...this.snapshot, loaded: true };
        this.publish(tasks.map(task => task.status === 'running' ? {
          ...task, status: 'interrupted', endedAt: Date.now(),
          result: 'The assistant closed before this task finished. Start a new task to continue.',
          steps: task.steps.map(step => step.status === 'running' ? { ...step, status: 'failed' } : step)
        } : task));
      } catch {
        this.snapshot = { tasks: [], loaded: true, storageError: 'Saved task history could not be loaded.' };
        this.listeners.forEach(listener => listener());
      }
    })();
  }
  async start(id: string, input: string) {
    await this.initialize();
    this.publish([{ id, input, status: 'running', startedAt: Date.now(), steps: [], events: [] }, ...this.snapshot.tasks]);
  }
  private update(id: string, change: (task: TaskHistory) => TaskHistory) {
    this.publish(this.snapshot.tasks.map(task => task.id === id && task.status === 'running' ? change(task) : task));
  }
  event(id: string, message: string, kind: HistoryEvent['kind'] = 'info') {
    this.update(id, task => ({ ...task, events: [...task.events, {
      id: crypto.randomUUID(), timestamp: Date.now(), message: message.slice(0, 3000), kind
    }].slice(-200) }));
  }
  steps(id: string, steps: TaskStep[]) {
    // Keep action summaries and status, not typed field contents, page snapshots,
    // provider configuration, or API credentials.
    this.update(id, task => ({ ...task, steps: steps.map(step => ({
      id: step.id, type: step.type, description: step.description, status: step.status
    })) }));
  }
  async finish(id: string, status: Exclude<RunStatus, 'running'>, result: string) {
    this.update(id, task => ({ ...task, status, endedAt: Date.now(), result: result.slice(0, 5000),
      steps: task.steps.map(step => step.status === 'running' ? { ...step, status: 'failed' } : step) }));
    await this.flush();
  }
  async remove(id: string) {
    await this.initialize();
    this.publish(this.snapshot.tasks.filter(task => task.id !== id || task.status === 'running'));
    await this.flush();
  }
  async clear() {
    await this.initialize();
    this.publish(this.snapshot.tasks.filter(task => task.status === 'running'));
    await this.flush();
  }
  flush() { return this.writes; }
}
export const agentHistory = new AgentHistory();
