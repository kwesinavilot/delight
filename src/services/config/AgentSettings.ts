export interface AgentSettings {
  maximumTurns: number; customInstructions: string;
  confirmSensitiveActions?: boolean; pageAccess?: 'starting-tab' | 'browser-tabs'; historyLimit?: number;
}
export const DEFAULT_AGENT_SETTINGS: AgentSettings = { maximumTurns: 50, customInstructions: '', confirmSensitiveActions: true, pageAccess: 'browser-tabs', historyLimit: 20 };
export function normalizeAgentSettings(value: Partial<AgentSettings> = {}): AgentSettings {
  return {
    maximumTurns: Number.isSafeInteger(value.maximumTurns) && value.maximumTurns! > 0 ? value.maximumTurns! : 50,
    customInstructions: typeof value.customInstructions === 'string' ? value.customInstructions.slice(0, 1500) : '',
    confirmSensitiveActions: value.confirmSensitiveActions !== false,
    pageAccess: value.pageAccess === 'starting-tab' ? 'starting-tab' : 'browser-tabs',
    historyLimit: [0, 10, 20, 50, 100].includes(value.historyLimit!) ? value.historyLimit : 20
  };
}
export async function loadAgentSettings(): Promise<AgentSettings> {
  const stored = await chrome.storage.local.get(['agentSettings']);
  return normalizeAgentSettings(stored.agentSettings || {});
}
export async function saveAgentSettings(settings: AgentSettings): Promise<void> {
  if (!Number.isSafeInteger(settings.maximumTurns) || settings.maximumTurns < 1) throw new Error('Maximum turns must be a positive whole number.');
  if (settings.customInstructions.length > 1500) throw new Error('Custom instructions must be 1,500 characters or fewer.');
  await chrome.storage.local.set({ agentSettings: normalizeAgentSettings(settings) });
}
