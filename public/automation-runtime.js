(() => {
  if (globalThis.delightAutomation?.version === 3) return;
  let targets = new Map();
  let signatures = new Map();
  const signature = el => JSON.stringify([el.tagName, ...['aria-label', 'href', 'type', 'role', 'title', 'placeholder', 'formaction'].map(name => el.getAttribute(name)), (el.textContent || '').slice(0, 180)]);
  let revision = '';
  const visible = el => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const collect = root => {
    const result = [];
    for (const el of root.querySelectorAll('*')) {
      result.push(el);
      if (el.shadowRoot) result.push(...collect(el.shadowRoot));
    }
    return result;
  };
  const observe = () => {
    targets = new Map();
    signatures = new Map();
    revision = crypto.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');
    const elements = [];
    for (const el of collect(document)) {
      if (elements.length >= 250) break;
      if (!el.matches('a[href],button,input:not([type=hidden]),textarea,select,[contenteditable=true],[role=button],[role=link],[role=tab],[role=textbox],[role=checkbox]') || !visible(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      const index = elements.length;
      targets.set(index, el);
      signatures.set(index, signature(el));
      elements.push({ index, tag: el.tagName.toLowerCase(), role: el.getAttribute('role'),
        label: el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || '',
        text: (el.innerText || el.textContent || '').trim().slice(0, 180),
        type: el.type || el.getAttribute('type'), form: !!el.form,
        submitControl: !!el.form && el.type === 'submit' || el.matches('button,[role=button],input[type=submit]') && /^(send|submit|save|publish|confirm|place order)\b/i.test((el.getAttribute('aria-label') || el.innerText || el.textContent || el.value || '').trim()),
        invalid: !!el.validity && !el.validity.valid,
        validationMessage: el.type === 'password' ? undefined : el.validationMessage,
        disabled: !!el.disabled, href: el.getAttribute('href'), target: el.getAttribute('target'),
        value: el.type === 'password' ? undefined : el.value });
    }
    return { revision, url: location.href, title: document.title, elementCount: elements.length, elements,
      statuses: collect(document).filter(el => visible(el) && el.matches('[role=status],[role=alert],[aria-live=polite],[aria-live=assertive]')).map(el => (el.innerText || el.textContent || '').trim().slice(0, 300)).filter(Boolean).slice(0, 20),
      text: (document.body?.innerText || '').slice(0, 6000), scrollY,
      scrollHeight: document.documentElement.scrollHeight, visualViewportHeight: innerHeight,
      media: Array.from(document.querySelectorAll('video,audio')).map(el => ({ paused: el.paused, ended: el.ended, currentTime: el.currentTime, readyState: el.readyState })) };
  };
  const target = (index, expectedRevision) => {
    if (expectedRevision !== revision) throw new Error('Stale observation; inspect the page again');
    const el = targets.get(index);
    if (!el?.isConnected || !visible(el) || el.disabled) throw new Error('Element is detached, hidden, or disabled');
    if (signature(el) !== signatures.get(index)) throw new Error('Element changed since observation; inspect the page again');
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    const root = el.getRootNode();
    const hitTest = root.elementFromPoint || document.elementFromPoint;
    const top = hitTest?.call(root, r.left + r.width / 2, r.top + r.height / 2);
    if (top && top !== el && !el.contains(top) && !top.contains(el)) throw new Error('Element is obscured; dismiss the overlay first');
    return el;
  };
  globalThis.delightAutomation = {
    version: 3, observe,
    prepare(index, expectedRevision, pointer) {
      const el = target(index, expectedRevision);
      if (el.type === 'password') throw new Error('Please enter credentials manually');
      el.focus();
      const r = el.getBoundingClientRect();
      let x = r.left + r.width / 2, y = r.top + r.height / 2;
      if (pointer) {
        let view = window;
        while (view !== view.top) {
          let frame;
          try { frame = view.frameElement; } catch { /* Cross-origin parent. */ }
          if (!frame) throw new Error('Native pointer targeting in a cross-origin frame is unavailable; use keyboard interaction');
          const rect = frame.getBoundingClientRect();
          x += rect.left + frame.clientLeft; y += rect.top + frame.clientTop;
          const hit = frame.ownerDocument.elementFromPoint(x, y);
          if (hit && hit !== frame) throw new Error('Frame is obscured');
          view = view.parent;
        }
      }
      return { x, y };
    },
    act(action, expectedRevision) {
      const el = target(action.elementIndex, expectedRevision);
      el.focus();
      if (action.type === 'click') { el.click(); return 'Clicked element'; }
      if (action.type === 'extract') return el.innerText || el.textContent || '';
      if (action.type === 'fill') {
        if (el.type === 'password') throw new Error('Please enter credentials manually');
        const value = String(action.data ?? '');
        if (el.isContentEditable) el.textContent = value;
        else {
          const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
          if (!setter) throw new Error('Element is not a text input');
          setter.call(el, value);
        }
        el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return 'Filled field';
      }
      if (action.type === 'selectDropdownOption') {
        if (!(el instanceof HTMLSelectElement)) throw new Error('Element is not a select');
        const option = Array.from(el.options).find(o => o.value === action.data || o.text === action.data);
        if (!option) throw new Error('Option not found');
        el.value = option.value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return 'Selected option';
      }
      throw new Error('Unsupported element action');
    }
  };
})();
