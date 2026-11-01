import { TaskStep } from '../../types/agents';
import { combineFrameObservations } from './FrameObservation';
import { trustedInput } from './TrustedInput';

export class ObservedBrowser {
  private windowId?: number;
  constructor(private tabId: number, private signal: AbortSignal) {}

  private check() { this.signal.throwIfAborted(); }

  private async tabs() {
    if (this.windowId === undefined) {
      this.windowId = (await chrome.tabs.get(this.tabId)).windowId;
      this.check();
      if (!Number.isInteger(this.windowId)) throw new Error('Could not determine the task browser window');
    }
    const tabs = await chrome.tabs.query({ windowId: this.windowId });
    this.check();
    return tabs;
  }

  private async waitForTab() {
    for (let i = 0; i < 100; i++) {
      await this.pause(200);
      const tab = await chrome.tabs.get(this.tabId);
      this.check();
      if (tab.status === 'complete') return tab;
    }
    throw new Error('Tab loading timed out');
  }

  private url(value?: string) {
    const url = new URL(value || '');
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Navigation requires an HTTP or HTTPS URL');
    return url.href;
  }

  async observe(): Promise<any> {
    this.check();
    const tabs = await this.tabs();
    const tab = tabs.find(tab => tab.id === this.tabId);
    this.check();
    const context = { tabId: this.tabId, windowId: this.windowId,
      tabs: tabs.map(tab => ({ id: tab.id, title: tab.title?.slice(0, 120), url: tab.url, active: tab.active })) };
    if (!tab) return { ...context, url: '', title: '', elements: [], elementCount: 0, restricted: true, closed: true };
    if (!/^https?:/.test(tab.url || '')) return { ...context, url: tab.url, title: tab.title, elements: [], elementCount: 0, restricted: true };
    const warnings: string[] = [];
    let allFrames = true;
    try {
      await chrome.scripting.executeScript({ target: { tabId: this.tabId, allFrames: true }, files: ['automation-runtime.js'] });
    } catch {
      this.check();
      allFrames = false;
      warnings.push('Some embedded frames could not be accessed. Only the main page was observed.');
      await chrome.scripting.executeScript({ target: { tabId: this.tabId }, files: ['automation-runtime.js'] });
    }
    this.check();
    const read = (includeFrames: boolean) => chrome.scripting.executeScript({ target: { tabId: this.tabId, allFrames: includeFrames },
      func: () => JSON.stringify((globalThis as any).delightAutomation?.observe() || null) });
    let results;
    try { results = await read(allFrames); }
    catch {
      this.check();
      warnings.push('An embedded frame changed or became inaccessible during observation.');
      results = await read(false);
    }
    this.check();
    const state = combineFrameObservations(results, warnings);
    return { ...state, ...context };
  }

  async act(step: TaskStep, state: any): Promise<any> {
    this.check();
    if (step.type === 'newTab') {
      const url = this.url(step.url);
      await this.tabs();
      this.check();
      const tab = await chrome.tabs.create({ windowId: this.windowId, url, active: true });
      this.check();
      if (tab.id === undefined) throw new Error('New tab did not return a tab ID');
      this.tabId = tab.id;
      await this.waitForTab();
      return { outcome: 'Opened new tab', tabId: this.tabId, url };
    }
    if (step.type === 'switchTab') {
      if (!Number.isInteger(step.tabId) || !state.tabs?.some((tab: any) => tab.id === step.tabId)) {
        throw new Error('Choose a tab ID listed in the current observation');
      }
      const tabs = await this.tabs();
      if (!tabs.some(tab => tab.id === step.tabId)) throw new Error('That tab has closed or moved to another window');
      this.check();
      await chrome.tabs.update(step.tabId!, { active: true });
      this.check();
      this.tabId = step.tabId!;
      await this.waitForTab();
      return { outcome: 'Switched tab', tabId: this.tabId };
    }
    if (step.type === 'navigate') {
      const url = this.url(step.url);
      if (url !== state.url) await chrome.tabs.update(this.tabId, { url });
      await this.waitForTab();
      return 'Navigation completed';
    }
    if (step.type === 'wait') { await this.pause(Math.min(5000, Math.max(100, Number(step.data?.duration) || 1000))); return 'Wait completed'; }
    if (step.type === 'analyzePage') return 'Page observed';
    if (step.type === 'verify') {
      const data = step.data || {};
      const field = state.elements?.find((el: any) => el.index === data.elementIndex);
      const verified = data.kind === 'text' ? typeof data.text === 'string' && !!data.text.trim() && String(state.text || '').includes(data.text)
        : data.kind === 'url' ? typeof data.url === 'string' && state.url === data.url
        : data.kind === 'field' ? typeof data.value === 'string' && field?.value === data.value
        : data.kind === 'media' ? state.media?.some((m: any) => !m.paused && !m.ended && m.readyState >= 2) : false;
      if (!verified) throw new Error('Requested outcome is not present in the current observation');
      return { verified: true, kind: data.kind, outcome: 'Outcome observed' };
    }
    if (step.type === 'scrollToPercent') {
      const frameId = step.data?.frameId ?? 0;
      if (!Number.isInteger(frameId) || !state.frames?.some((frame: any) => frame.frameId === frameId)) {
        throw new Error('Choose a frame ID listed in the current observation');
      }
      await chrome.scripting.executeScript({ target: { tabId: this.tabId, frameIds: [frameId] },
        func: (percent: number) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * percent / 100),
        args: [Math.max(0, Math.min(100, Number(step.data?.percent) || 0))] });
      return 'Scrolled';
    }
    if (state.tabId !== undefined && state.tabId !== this.tabId) throw new Error('Tab changed; observe it again before acting');
    const element = state.elements.find((el: any) => el.index === step.elementIndex);
    if (!element) throw new Error('Action references an index absent from the current observation');
    const submitting = element.submitControl || (element.form && element.type === 'submit') ||
      (step.type === 'sendKeys' && step.data?.keys === 'Enter' && element.form && element.tag !== 'textarea');
    this.check();
    const sourceTabId = this.tabId;
    const target: chrome.scripting.InjectionTarget = element.documentId
      ? { tabId: this.tabId, documentIds: [element.documentId] }
      : { tabId: this.tabId, frameIds: [element.frameId ?? 0] };
    const frameStep = { ...step, elementIndex: element.frameIndex ?? step.elementIndex };
    const revision = element.frameRevision ?? state.revision;
    const dispatch = async () => {
      if (step.type === 'sendKeys' || step.type === 'trustedClick') {
        if (step.type === 'sendKeys' && (typeof step.data?.keys !== 'string' || !step.data.keys)) throw new Error('sendKeys requires data.keys');
        const prepared = await chrome.scripting.executeScript({ target,
          func: (index: number, expected: string, url: string, pointer: boolean) => {
            if (location.href !== url) throw new Error('Frame navigated; observe again');
            return (globalThis as any).delightAutomation.prepare(index, expected, pointer);
          }, args: [frameStep.elementIndex!, revision, element.frameUrl || state.url, step.type === 'trustedClick'] });
        this.check();
        if (!prepared[0]?.result) throw new Error('Native input target could not be prepared');
        await trustedInput(this.tabId, this.signal, step.type === 'sendKeys' ? { keys: step.data.keys } : prepared[0].result);
        return [];
      }
      return chrome.scripting.executeScript({ target,
      func: (action: TaskStep, expectedRevision: string, expectedUrl?: string) => {
        const runtime = (globalThis as any).delightAutomation;
        if (!runtime || (expectedUrl && location.href !== expectedUrl)) throw new Error('Frame changed or navigated; observe again before acting');
        return runtime.act(action, expectedRevision);
      }, args: [frameStep, revision, element.frameUrl || state.url] });
    };
    if (!['click', 'trustedClick', 'sendKeys'].includes(step.type)) {
      const results = await dispatch();
      this.check();
      await this.pause(350);
      return results[0]?.result ?? 'Action dispatched; outcome requires observation';
    }
    await this.tabs();
    let linkUrl: string | undefined;
    try { if (element.href) linkUrl = new URL(element.href, element.frameUrl || state.url).href; } catch { /* Not a navigable link. */ }
    const opened = new Map<number, chrome.tabs.Tab>();
    const onCreated = (tab: chrome.tabs.Tab) => {
      if (tab.id !== undefined && tab.windowId === this.windowId) opened.set(tab.id, tab);
    };
    chrome.tabs.onCreated.addListener(onCreated);
    try {
    await dispatch();
    this.check();
    // Navigation and SPA transitions can outlive the click's execution context.
    // Poll real page state instead of treating a null return as success evidence.
    let previous = '', stable = 0;
    const expectsNavigation = !!element.href;
    for (let i = 0; i < 16; i++) {
      await this.pause(500);
      if (opened.size) {
        const candidates = (await this.tabs()).filter(tab => tab.id !== undefined && opened.has(tab.id) && (
          tab.openerTabId === sourceTabId || opened.get(tab.id)?.openerTabId === sourceTabId ||
          (element.target === '_blank' && !!linkUrl && (tab.url === linkUrl || tab.pendingUrl === linkUrl))
        ));
        const target = candidates.length === 1 ? candidates[0] : candidates.find(tab => tab.active);
        if (target?.id !== undefined) {
          this.check();
          await chrome.tabs.update(target.id, { active: true });
          this.check();
          this.tabId = target.id;
          await this.waitForTab();
          return { outcome: 'Followed tab opened by clicked link', tabId: this.tabId, url: target.url,
            ...(submitting ? { submission: 'navigation-observed' } : {}) };
        }
      }
      const tab = await chrome.tabs.get(this.tabId);
      this.check();
      if (tab.status === 'loading') continue;
      let next;
      try { next = await this.observe(); }
      catch (error) {
        this.check();
        if (i === 15) throw error;
        continue;
      }
      if (submitting) {
        const invalid = next.elements?.filter((el: any) => el.frameId === element.frameId && el.invalid);
        if (invalid?.length) return { outcome: 'Submission blocked by field validation; correct the fields before retrying', submission: 'validation-error', errors: invalid.map((el: any) => ({ index: el.index, message: el.validationMessage })) };
        const confirmation = next.statuses?.find((text: string) => !state.statuses?.includes(text));
        if (confirmation) return { outcome: 'New status observed after submission; inspect it before declaring success', submission: 'status-observed', evidence: confirmation };
        if (next.url !== state.url) return { outcome: 'Navigation observed after submission', submission: 'navigation-observed', url: next.url };
        if (i === 15) return { outcome: 'Submission outcome unverified. Do not repeat automatically; ask the user or inspect confirmation.', submission: 'unverified' };
        continue;
      }
      if (next.media?.some((m: any) => !m.paused && !m.ended && m.readyState >= 2)) {
        return { outcome: 'Playback observed', url: next.url, playing: true };
      }
      const fingerprint = JSON.stringify([next.url, next.elements.map(({ frameRevision: _revision, ...element }: any) => element), next.text]);
      stable = fingerprint === previous ? stable + 1 : 0;
      previous = fingerprint;
      if (next.url !== state.url && stable >= 1) return { outcome: 'Navigation observed', url: next.url };
      if (!expectsNavigation && stable >= 2) return { outcome: 'Page settled after click', url: next.url };
    }
    return { outcome: 'No navigation or playback verified after click; choose another control or wait', url: state.url };
    } finally {
      chrome.tabs.onCreated.removeListener(onCreated);
    }
  }

  async pause(ms: number): Promise<void> {
    this.check();
    await new Promise<void>((resolve, reject) => {
      const aborted = () => { clearTimeout(timer); reject(new Error('Task stopped by user')); };
      const timer = setTimeout(() => { this.signal.removeEventListener('abort', aborted); resolve(); }, ms);
      this.signal.addEventListener('abort', aborted, { once: true });
    });
    this.check();
  }
}
