import { TaskPlan, TaskStep, AutomationResult } from '../../types/agents';
import { PlannerAgent } from './PlannerAgent';
import { ObservedBrowser } from '../automation/ObservedBrowser';
import { agentHistory } from './AgentHistory';

interface Callbacks {
  onPlanCreated?: (steps: TaskStep[]) => void;
  onStepStart?: (index: number, step: TaskStep) => void;
  onStepComplete?: (index: number, step: TaskStep, result: any) => void;
  onStepError?: (index: number, step: TaskStep, error: string) => void;
  onProgress?: (message: string) => void;
}
interface RunControl {
  taskId: string;
  controller: AbortController;
  pauseRequested: boolean;
  planning?: AbortController;
  wake?: () => void;
}
export class AgentOrchestrator {
  private static instance: AgentOrchestrator;
  private run: RunControl | null = null;
  private currentTask: TaskPlan | null = null;
  private progressCallback?: (progress: any) => void;
  static getInstance() { return this.instance ||= new AgentOrchestrator(); }
  async initialize() {}
  setProgressCallback(callback: (progress: any) => void) { this.progressCallback = callback; }
  getCurrentTask() { return this.currentTask; }
  isTaskExecuting() { return !!this.run && !this.run.controller.signal.aborted; }
  async pauseCurrentTask() {
    const run = this.run;
    if (!run || run.controller.signal.aborted || run.pauseRequested) return;
    run.pauseRequested = true;
    run.planning?.abort();
    if (this.currentTask?.id === run.taskId) this.currentTask.status = 'paused';
    await agentHistory.initialize();
    if (this.run !== run || !run.pauseRequested) return;
    agentHistory.event(run.taskId, 'Task paused. Resume to continue.');
    await agentHistory.pause(run.taskId);
  }
  async resumeCurrentTask() {
    const run = this.run;
    if (!run || run.controller.signal.aborted || !run.pauseRequested) return;
    run.pauseRequested = false;
    if (this.currentTask?.id === run.taskId) this.currentTask.status = 'executing';
    const saved = agentHistory.resume(run.taskId);
    agentHistory.event(run.taskId, 'Task resumed. Inspecting the current page again.');
    run.wake?.();
    await saved;
  }
  private async checkpoint(run: RunControl) {
    const signal = run.controller.signal;
    signal.throwIfAborted();
    const wasPaused = run.pauseRequested;
    while (run.pauseRequested) {
      await agentHistory.pause(run.taskId);
      signal.throwIfAborted();
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => { signal.removeEventListener('abort', aborted); if (run.wake === wake) run.wake = undefined; };
        const aborted = () => { cleanup(); reject(new Error('Task stopped by user')); };
        const wake = () => { cleanup(); resolve(); };
        run.wake = wake;
        signal.addEventListener('abort', aborted, { once: true });
        if (signal.aborted) aborted();
        else if (!run.pauseRequested) wake();
      });
    }
    signal.throwIfAborted();
    return wasPaused;
  }
  async stopCurrentTask() {
    const taskId = this.run?.taskId;
    this.run?.controller.abort();
    this.run = null;
    if (this.currentTask) this.currentTask.status = 'failed';
    if (taskId) await agentHistory.finish(taskId, 'cancelled', 'Task cancelled. Actions already dispatched cannot be undone.');
  }
  async executeTask(input: string, callbacks: Callbacks = {}): Promise<AutomationResult> {
    if (this.isTaskExecuting()) throw new Error('Another task is running or paused. Resume or stop it before starting a new task.');
    const started = Date.now();
    const taskId = `task_${crypto.randomUUID()}`;
    const controller = new AbortController();
    const run: RunControl = { taskId, controller, pauseRequested: false };
    this.run = run;
    const signal = controller.signal;
    const steps: TaskStep[] = [];
    const task: TaskPlan = { id: taskId, description: input, steps, estimatedDuration: 0, status: 'executing' };
    this.currentTask = task;
    const progress = (stage: string, message: string) => {
      signal.throwIfAborted();
      agentHistory.event(taskId, message);
      this.progressCallback?.({ stage, message });
      callbacks.onProgress?.(message);
    };
    try {
      await agentHistory.start(taskId, input);
      signal.throwIfAborted();
      const planner = new PlannerAgent();
      progress('initializing', 'Checking the selected AI provider...');
      await planner.initialize();
      signal.throwIfAborted();
      await this.checkpoint(run);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active browser tab');
      const browser = new ObservedBrowser(tab.id, signal);
      const history: any[] = [];
      let failures = 0, repeated = 0, previousFingerprint = '';
      for (let i = 0; i < 30;) {
        await this.checkpoint(run);
        progress('observing', 'Inspecting the current page...');
        const state = await browser.observe();
        if (await this.checkpoint(run)) continue;
        progress('planning', 'Choosing the next action from the current page...');
        if (run.pauseRequested) { await this.checkpoint(run); continue; }
        let decision;
        const planning = new AbortController();
        const abortPlanning = () => planning.abort();
        signal.addEventListener('abort', abortPlanning, { once: true });
        run.planning = planning;
        try {
          decision = await planner.decide(input, state, history, planning.signal);
        } catch (error) {
          signal.throwIfAborted();
          if (planning.signal.aborted || run.pauseRequested) { await this.checkpoint(run); continue; }
          const message = error instanceof Error ? error.message : String(error);
          const cause = error as any;
          if (cause?.type === 'rate_limit_error' || /429|quota|rate.?limit|too many requests/i.test(message)) {
            progress('rate-limited', 'The selected provider is rate-limiting requests. Browser actions are paused; wait for quota to recover before retrying.');
            throw new Error('Selected provider rate limit reached. Wait for quota to recover, then retry the task.');
          }
          throw error;
        } finally {
          signal.removeEventListener('abort', abortPlanning);
          if (run.planning === planning) run.planning = undefined;
        }
        signal.throwIfAborted();
        if (planning.signal.aborted || await this.checkpoint(run)) continue;
        if (decision.done) {
          if (decision.success !== true) throw new Error(decision.evidence || decision.description);
          if (/\b(play|playing)\b/i.test(input) && /youtube\.com/.test(state.url) &&
              !state.media?.some((m: any) => !m.paused && !m.ended && m.readyState >= 2)) throw new Error('Playback was not verified');
          task.status = 'completed';
          await agentHistory.finish(taskId, 'completed', decision.evidence || 'Task completed.');
          return { taskId, success: true, data: { evidence: decision.evidence, history }, executionTime: Date.now() - started };
        }
        const step: TaskStep = { ...decision.action!, id: `${taskId}_${i}`, status: 'pending' };
        const fingerprint = JSON.stringify([state.tabId, state.url, state.elements.map(({ frameRevision: _revision, ...element }: any) => element), step.type, step.url, step.tabId, step.elementIndex, step.data]);
        repeated = fingerprint === previousFingerprint ? repeated + 1 : 0;
        previousFingerprint = fingerprint;
        if (repeated >= 2) throw new Error('The same action made no observable progress three times');
        steps.push(step);
        agentHistory.steps(taskId, steps);
        callbacks.onPlanCreated?.([...steps]);
        callbacks.onStepStart?.(i, step);
        progress('executing', step.description);
        try {
          step.status = 'running';
          agentHistory.steps(taskId, steps);
          const result = await browser.act(step, state);
          signal.throwIfAborted();
          step.status = 'completed';
          agentHistory.steps(taskId, steps);
          agentHistory.event(taskId, `Completed: ${step.description}`, 'success');
          failures = 0;
          history.push({ action: step.type, description: step.description, result });
          callbacks.onStepComplete?.(i, step, { success: true, result });
        } catch (error) {
          signal.throwIfAborted();
          const message = error instanceof Error ? error.message : String(error);
          step.status = 'failed';
          agentHistory.steps(taskId, steps);
          agentHistory.event(taskId, message, 'error');
          history.push({ action: step.type, error: message });
          callbacks.onStepError?.(i, step, message);
          if (++failures >= 3) throw new Error(`Three actions failed: ${message}`);
        }
        i++;
      }
      throw new Error('Action limit reached before task completion was verified');
    } catch (error) {
      task.status = 'failed';
      await agentHistory.finish(taskId, signal.aborted ? 'cancelled' : 'failed', signal.aborted ? 'Task cancelled.' : error instanceof Error ? error.message : String(error));
      return { taskId, success: false, error: signal.aborted ? 'Task stopped by user' : error instanceof Error ? error.message : String(error), executionTime: Date.now() - started };
    } finally {
      if (this.run === run) this.run = null;
    }
  }
}
