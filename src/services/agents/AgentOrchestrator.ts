import { TaskPlan, TaskStep, AutomationResult } from '../../types/agents';
import { PlannerAgent } from './PlannerAgent';
import { ObservedBrowser } from '../automation/ObservedBrowser';

interface Callbacks {
  onPlanCreated?: (steps: TaskStep[]) => void;
  onStepStart?: (index: number, step: TaskStep) => void;
  onStepComplete?: (index: number, step: TaskStep, result: any) => void;
  onStepError?: (index: number, step: TaskStep, error: string) => void;
  onProgress?: (message: string) => void;
}
export class AgentOrchestrator {
  private static instance: AgentOrchestrator;
  private controller: AbortController | null = null;
  private currentTask: TaskPlan | null = null;
  private progressCallback?: (progress: any) => void;
  static getInstance() { return this.instance ||= new AgentOrchestrator(); }
  async initialize() {}
  setProgressCallback(callback: (progress: any) => void) { this.progressCallback = callback; }
  getCurrentTask() { return this.currentTask; }
  isTaskExecuting() { return !!this.controller && !this.controller.signal.aborted; }
  async stopCurrentTask() {
    this.controller?.abort();
    this.controller = null;
    if (this.currentTask) this.currentTask.status = 'failed';
  }
  async executeTask(input: string, callbacks: Callbacks = {}): Promise<AutomationResult> {
    if (this.isTaskExecuting()) throw new Error('Another task is running. Stop it before starting a new task.');
    const started = Date.now();
    const taskId = `task_${started}`;
    const controller = new AbortController();
    this.controller = controller;
    const signal = controller.signal;
    const steps: TaskStep[] = [];
    const task: TaskPlan = { id: taskId, description: input, steps, estimatedDuration: 0, status: 'executing' };
    this.currentTask = task;
    const progress = (stage: string, message: string) => {
      signal.throwIfAborted();
      this.progressCallback?.({ stage, message });
      callbacks.onProgress?.(message);
    };
    try {
      const planner = new PlannerAgent();
      progress('initializing', 'Checking the selected AI provider...');
      await planner.initialize();
      signal.throwIfAborted();
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active browser tab');
      const browser = new ObservedBrowser(tab.id, signal);
      const history: any[] = [];
      let failures = 0, repeated = 0, previousFingerprint = '';
      for (let i = 0; i < 30; i++) {
        progress('observing', 'Inspecting the current page...');
        const state = await browser.observe();
        progress('planning', 'Choosing the next action from the current page...');
        const decision = await planner.decide(input, state, history, signal);
        signal.throwIfAborted();
        if (decision.done) {
          if (decision.success !== true) throw new Error(decision.evidence || decision.description);
          if (/\b(play|playing)\b/i.test(input) && /youtube\.com/.test(state.url) &&
              !state.media?.some((m: any) => !m.paused && !m.ended && m.readyState >= 2)) throw new Error('Playback was not verified');
          task.status = 'completed';
          return { taskId, success: true, data: { evidence: decision.evidence, history }, executionTime: Date.now() - started };
        }
        const step: TaskStep = { ...decision.action!, id: `${taskId}_${i}`, status: 'pending' };
        const fingerprint = JSON.stringify([state.url, state.elements, step.type, step.url, step.elementIndex, step.data]);
        repeated = fingerprint === previousFingerprint ? repeated + 1 : 0;
        previousFingerprint = fingerprint;
        if (repeated >= 2) throw new Error('The same action made no observable progress three times');
        steps.push(step);
        callbacks.onPlanCreated?.([...steps]);
        callbacks.onStepStart?.(i, step);
        progress('executing', step.description);
        try {
          step.status = 'running';
          const result = await browser.act(step, state);
          signal.throwIfAborted();
          step.status = 'completed';
          failures = 0;
          history.push({ action: step.type, description: step.description, result });
          callbacks.onStepComplete?.(i, step, { success: true, result });
        } catch (error) {
          signal.throwIfAborted();
          const message = error instanceof Error ? error.message : String(error);
          step.status = 'failed';
          history.push({ action: step.type, error: message });
          callbacks.onStepError?.(i, step, message);
          if (++failures >= 3) throw new Error(`Three actions failed: ${message}`);
        }
      }
      throw new Error('Action limit reached before task completion was verified');
    } catch (error) {
      task.status = 'failed';
      return { taskId, success: false, error: signal.aborted ? 'Task stopped by user' : error instanceof Error ? error.message : String(error), executionTime: Date.now() - started };
    } finally {
      if (this.controller === controller) this.controller = null;
    }
  }
}
