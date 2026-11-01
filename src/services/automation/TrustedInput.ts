/** Native input, with ownership-scoped debugger attachment and no synthetic replay. */
export async function trustedInput(tabId: number, signal: AbortSignal, input: { keys?: string; x?: number; y?: number }) {
  signal.throwIfAborted();
  const target = { tabId };
  let attached = false;
  const send = async (method: string, params: object) => {
    signal.throwIfAborted();
    await chrome.debugger.sendCommand(target, method, params);
  };
  try {
    await chrome.debugger.attach(target, '1.3');
    attached = true;
    if (input.keys) {
      const parts = input.keys.split('+');
      const keyName = parts.pop()!;
      const modifiers = parts.reduce((mask, part) => {
        const bit = ({ Alt: 1, Ctrl: 2, Meta: 4, Shift: 8 } as Record<string, number>)[part];
        if (!bit) throw new Error('Unsupported keyboard modifier');
        return mask | bit;
      }, 0);
      if ((modifiers & 6) && !/^(a|z|y|Enter|Home|End|ArrowLeft|ArrowRight|Backspace|Delete)$/i.test(keyName)) {
        throw new Error('Shortcut is outside supported page editing controls');
      }
      const names: Record<string, [string, string, number]> = {
        Enter: ['Enter', 'Enter', 13], Tab: ['Tab', 'Tab', 9], Escape: ['Escape', 'Escape', 27],
        Backspace: ['Backspace', 'Backspace', 8], Delete: ['Delete', 'Delete', 46],
        ArrowLeft: ['ArrowLeft', 'ArrowLeft', 37], ArrowUp: ['ArrowUp', 'ArrowUp', 38],
        ArrowRight: ['ArrowRight', 'ArrowRight', 39], ArrowDown: ['ArrowDown', 'ArrowDown', 40],
        Space: [' ', 'Space', 32], Home: ['Home', 'Home', 36], End: ['End', 'End', 35]
      };
      const spec = names[keyName] || (/^[a-z0-9]$/i.test(keyName)
        ? [keyName, /^[a-z]$/i.test(keyName) ? `Key${keyName.toUpperCase()}` : `Digit${keyName}`, keyName.toUpperCase().charCodeAt(0)] : null);
      if (!spec) throw new Error('Unsupported keyboard key');
      const [key, code, windowsVirtualKeyCode] = spec;
      const params = { key, code, windowsVirtualKeyCode, modifiers };
      const text = !(modifiers & 7) ? (key === 'Enter' ? '\r' : key.length === 1 ? key : undefined) : undefined;
      await send('Input.dispatchKeyEvent', { ...params, type: 'keyDown', text });
      // Release even if Stop arrived after keyDown; never leave a held key behind.
      await chrome.debugger.sendCommand(target, 'Input.dispatchKeyEvent', { ...params, type: 'keyUp' });
    } else {
      if (!Number.isFinite(input.x) || !Number.isFinite(input.y)) throw new Error('Invalid native click position');
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: input.x, y: input.y, button: 'left', clickCount: 1 });
      await chrome.debugger.sendCommand(target, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x: input.x, y: input.y, button: 'left', clickCount: 1 });
    }
    signal.throwIfAborted();
  } finally {
    if (attached) await chrome.debugger.detach(target).catch(() => {});
  }
}
