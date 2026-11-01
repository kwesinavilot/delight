import { TaskStep } from '../../types/agents';

export class ObservedBrowser {
  constructor(private tabId: number, private signal: AbortSignal) {}

  private check() { this.signal.throwIfAborted(); }

  async observe(): Promise<any> {
    this.check();
    const tab = await chrome.tabs.get(this.tabId);
    this.check();
    if (!/^https?:/.test(tab.url || '')) return { url: tab.url, title: tab.title, elements: [], elementCount: 0, restricted: true };
    await chrome.scripting.executeScript({ target: { tabId: this.tabId }, files: ['automation-runtime.js'] });
    this.check();
    const results = await chrome.scripting.executeScript({ target: { tabId: this.tabId },
      func: () => JSON.stringify((globalThis as any).delightAutomation.observe()) });
    this.check();
    const raw = results[0]?.result;
    if (typeof raw !== 'string') throw new Error('Browser observation failed: no serialized page state');
    const state = JSON.parse(raw);
    if (!Array.isArray(state.elements) || !state.revision) throw new Error('Browser observation has invalid structure');
    return state;
  }

  async act(step: TaskStep, state: any): Promise<any> {
    this.check();
    if (step.type === 'navigate') {
      const url = new URL(step.url || '');
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Navigation requires an HTTP or HTTPS URL');
      if (url.href !== state.url) await chrome.tabs.update(this.tabId, { url: url.href });
      for (let i = 0; i < 100; i++) {
        await this.pause(200);
        const tab = await chrome.tabs.get(this.tabId);
        if (tab.status === 'complete') return 'Navigation completed';
      }
      throw new Error('Navigation timed out');
    }
    if (step.type === 'wait') { await this.pause(Math.min(5000, Math.max(100, Number(step.data?.duration) || 1000))); return 'Wait completed'; }
    if (step.type === 'analyzePage') return 'Page observed';
    if (step.type === 'scrollToPercent') {
      await chrome.scripting.executeScript({ target: { tabId: this.tabId },
        func: (percent: number) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * percent / 100),
        args: [Math.max(0, Math.min(100, Number(step.data?.percent) || 0))] });
      return 'Scrolled';
    }
    const element = state.elements.find((el: any) => el.index === step.elementIndex);
    if (!element) throw new Error('Action references an index absent from the current observation');
    this.check();
    const results = await chrome.scripting.executeScript({ target: { tabId: this.tabId },
      func: (action: TaskStep, revision: string) => (globalThis as any).delightAutomation.act(action, revision),
      args: [step, state.revision] });
    this.check();
    if (step.type !== 'click') {
      await this.pause(350);
      return results[0]?.result ?? 'Action dispatched; outcome requires observation';
    }
    // Navigation and SPA transitions can outlive the click's execution context.
    // Poll real page state instead of treating a null return as success evidence.
    let previous = '', stable = 0;
    const expectsNavigation = !!element.href;
    for (let i = 0; i < 16; i++) {
      await this.pause(500);
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
      if (next.media?.some((m: any) => !m.paused && !m.ended && m.readyState >= 2)) {
        return { outcome: 'Playback observed', url: next.url, playing: true };
      }
      const fingerprint = JSON.stringify([next.url, next.elements, next.text]);
      stable = fingerprint === previous ? stable + 1 : 0;
      previous = fingerprint;
      if (next.url !== state.url && stable >= 1) return { outcome: 'Navigation observed', url: next.url };
      if (!expectsNavigation && stable >= 2) return { outcome: 'Page settled after click', url: next.url };
    }
    return { outcome: 'No navigation or playback verified after click; choose another control or wait', url: state.url };
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
