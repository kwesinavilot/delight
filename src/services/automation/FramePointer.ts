/** Translate an observed frame-local point through each embedding viewport.
 * Parent scripts identify the sending Window, never a URL or guessed frame index.
 * The short-lived bridge is packaged code; page messages cannot execute commands.
 */
export async function framePointer(tabId: number, target: chrome.scripting.InjectionTarget,
  index: number, revision: string, url: string, signal: AbortSignal, frameId = 0): Promise<{ x: number; y: number }> {
  const token = crypto.randomUUID();
  signal.throwIfAborted();
  if (frameId === 0) {
    const [prepared] = await chrome.scripting.executeScript({ target,
      func: (index: number, revision: string, url: string) => {
        if (location.href !== url) throw new Error('Frame navigated; observe again');
        const point = (globalThis as any).delightAutomation.prepare(index, revision, true);
        if (point.x < 0 || point.y < 0 || point.x >= innerWidth || point.y >= innerHeight) throw new Error('Target center is outside its viewport');
        return point;
      }, args: [index, revision, url] });
    signal.throwIfAborted();
    if (!Number.isFinite(prepared?.result?.x) || !Number.isFinite(prepared?.result?.y)) throw new Error('Native pointer target could not be prepared');
    return prepared.result;
  }
  try {
    await chrome.scripting.executeScript({ target: { tabId, allFrames: true },
      func: (token: string) => {
        const bridges = (globalThis as any).__delightPointerBridges ||= {};
        const record: any = {};
        const elements = (root: Document | ShadowRoot): Element[] => Array.from(root.querySelectorAll('*')).flatMap(el =>
          [el, ...(el.shadowRoot ? elements(el.shadowRoot) : [])]);
        const accept = (event: MessageEvent) => {
          const data = event.data;
          if (!data || data.delightPointer !== token || !event.source || event.source === window) return;
          const frame = elements(document).find(el => el instanceof HTMLIFrameElement && el.contentWindow === event.source) as HTMLIFrameElement | undefined;
          if (!frame) return;
          const rect = frame.getBoundingClientRect();
          const style = getComputedStyle(frame);
          const reject = (error: string) => forward({ error });
          // Rotations/skews/perspective need polygon targeting, not a guessed center.
          for (let ancestor: Element | null = frame; ancestor; ancestor = ancestor.parentElement || (ancestor.getRootNode() as ShadowRoot).host || null) {
            const computed = getComputedStyle(ancestor);
            if (computed.transform !== 'none' || computed.perspective !== 'none') { reject('Transformed frame requires manual interaction'); return; }
          }
          if (data.error) { reject(String(data.error)); return; }
          if (!(rect.width > 0 && rect.height > 0 && data.width > 0 && data.height > 0) ||
              !Number.isFinite(data.x) || !Number.isFinite(data.y) || data.x < 0 || data.y < 0 || data.x >= data.width || data.y >= data.height) {
            reject('Frame point is outside its viewport'); return;
          }
          const sx = rect.width / frame.offsetWidth, sy = rect.height / frame.offsetHeight;
          const x = rect.left + (frame.clientLeft + data.x * frame.clientWidth / data.width) * sx;
          const y = rect.top + (frame.clientTop + data.y * frame.clientHeight / data.height) * sy;
          const root = frame.getRootNode() as Document | ShadowRoot;
          const hit = (root as any).elementFromPoint?.(x, y) || document.elementFromPoint(x, y);
          if (hit !== frame || x < 0 || y < 0 || x >= innerWidth || y >= innerHeight || style.visibility === 'hidden') {
            reject('Embedding frame is obscured or outside the viewport'); return;
          }
          forward({ x, y });
        };
        const forward = (point: any) => {
          if (window === window.top) record.result = point;
          else window.parent.postMessage({ ...point, delightPointer: token, width: innerWidth, height: innerHeight }, '*');
        };
        record.cleanup = () => { window.removeEventListener('message', accept); clearTimeout(record.timer); delete bridges[token]; };
        record.timer = setTimeout(record.cleanup, 4000);
        bridges[token] = record;
        window.addEventListener('message', accept);
      }, args: [token] });
    signal.throwIfAborted();
    await chrome.scripting.executeScript({ target,
      func: (token: string, index: number, revision: string, url: string) => {
        if (location.href !== url) throw new Error('Frame navigated; observe again');
        const point = (globalThis as any).delightAutomation.prepare(index, revision, false);
        if (point.x < 0 || point.y < 0 || point.x >= innerWidth || point.y >= innerHeight) throw new Error('Target center is outside its viewport');
        if (window === window.top) (globalThis as any).__delightPointerBridges[token].result = point;
        else window.parent.postMessage({ ...point, delightPointer: token, width: innerWidth, height: innerHeight }, '*');
      }, args: [token, index, revision, url] });
    for (let i = 0; i < 30; i++) {
      signal.throwIfAborted();
      const [read] = await chrome.scripting.executeScript({ target: { tabId, frameIds: [0] },
        func: (token: string) => (globalThis as any).__delightPointerBridges?.[token]?.result, args: [token] });
      signal.throwIfAborted();
      if (read?.result?.error) throw new Error(read.result.error);
      if (Number.isFinite(read?.result?.x) && Number.isFinite(read?.result?.y)) return read.result;
      await new Promise<void>((resolve, reject) => {
        const abort = () => { clearTimeout(timer); reject(new Error('Task stopped by user')); };
        const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 50);
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) abort();
      });
    }
    throw new Error('Frame geometry changed or an ancestor frame is inaccessible; observe again');
  } finally {
    await chrome.scripting.executeScript({ target: { tabId, allFrames: true },
      func: (token: string) => (globalThis as any).__delightPointerBridges?.[token]?.cleanup(), args: [token] }).catch(() => {});
  }
}
