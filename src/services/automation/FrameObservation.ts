export function combineFrameObservations(results: chrome.scripting.InjectionResult[], warnings: string[] = []) {
  const frames: any[] = [];
  for (const result of results) {
    try {
      const state = typeof result.result === 'string' ? JSON.parse(result.result) : null;
      if (!state || !Array.isArray(state.elements) || !state.revision) {
        warnings.push(`Frame ${result.frameId ?? 0} could not be observed.`);
        continue;
      }
      frames.push({ ...state, frameId: result.frameId ?? 0, documentId: result.documentId });
    } catch { warnings.push(`Frame ${result.frameId ?? 0} returned invalid observation data.`); }
  }
  frames.sort((a, b) => a.frameId - b.frameId);
  const main = frames.find(frame => frame.frameId === 0);
  if (!main) throw new Error('Browser observation failed: no valid main-frame state');
  const elements: any[] = [];
  for (const frame of frames) {
    for (const element of frame.elements) {
      if (elements.length >= 500) break;
      elements.push({ ...element, index: elements.length, frameId: frame.frameId,
        frameIndex: element.index, frameRevision: frame.revision, documentId: frame.documentId, frameUrl: frame.url });
    }
  }
  return { ...main, elements, elementCount: elements.length,
    statuses: frames.flatMap(frame => frame.statuses || []),
    frames: frames.map(frame => ({ frameId: frame.frameId, url: frame.url, title: frame.title,
      elementCount: frame.elements.length, text: String(frame.text || '').slice(0, 500) })),
    media: frames.flatMap(frame => (frame.media || []).map((media: any) => ({ ...media, frameId: frame.frameId }))),
    text: frames.map(frame => `[Frame ${frame.frameId}: ${frame.url}]\n${String(frame.text || '').slice(0, 1000)}`).join('\n').slice(0, 6000),
    frameWarnings: warnings,
    truncated: frames.reduce((total, frame) => total + frame.elements.length, 0) > elements.length };
}
