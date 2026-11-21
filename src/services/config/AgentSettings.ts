export interface AgentSettings { maximumTurns: number; customInstructions: string; }
export const DEFAULT_AGENT_SETTINGS: AgentSettings = { maximumTurns: 50, customInstructions: '' };
export function normalizeAgentSettings(value: Partial<AgentSettings> = {}): AgentSettings {
  return {
    maximumTurns: Number.isSafeInteger(value.maximumTurns) && value.maximumTurns! > 0 ? value.maximumTurns! : 50,
    customInstructions: typeof value.customInstructions === 'string' ? value.customInstructions.slice(0, 1500) : ''
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
