import { AIConfiguration } from '../../types/ai';

const KEY = 'agentModelConfiguration';
const providers = ['openai', 'anthropic', 'gemini', 'grok', 'groq', 'sambanova', 'ollama'];
export async function loadAgentModel(): Promise<AIConfiguration | null> {
  const stored = (await chrome.storage.local.get([KEY]))[KEY];
  if (!stored) return null;
  if (!providers.includes(stored.provider) || typeof stored.model !== 'string' || !stored.model.trim() ||
      typeof stored.apiKey !== 'string' || (stored.provider !== 'ollama' && !stored.apiKey.trim())) {
    throw new Error('The saved agent model is incomplete. Test and save it again in Settings > Agent.');
  }
  return { provider: stored.provider, model: stored.model, apiKey: stored.apiKey, maxTokens: 1000, temperature: 0.7 };
}
export async function saveAgentModel(config: AIConfiguration | null): Promise<void> {
  await chrome.storage.local.set({ [KEY]: config ? { provider: config.provider, model: config.model?.trim(), apiKey: config.apiKey.trim() } : null });
}
