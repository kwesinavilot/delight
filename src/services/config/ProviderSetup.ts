import { AIConfiguration } from '../../types/ai';
import { AIService } from '../ai/AIService';

export const providerOptions = {
  openai: { name: 'OpenAI', model: 'gpt-4o-mini', models: ['gpt-4o-mini', 'gpt-4o'], url: 'https://platform.openai.com/api-keys' },
  anthropic: { name: 'Anthropic', model: 'claude-sonnet-4-5', models: ['claude-sonnet-4-5'], url: 'https://console.anthropic.com/' },
  gemini: { name: 'Google Gemini', model: 'gemini-2.5-flash-lite', models: ['gemini-2.5-flash-lite', 'gemini-2.5-flash'], url: 'https://aistudio.google.com/app/apikey' },
  grok: { name: 'xAI', model: 'grok-3-mini', models: ['grok-3-mini'], url: 'https://console.x.ai/' },
  groq: { name: 'Groq', model: 'openai/gpt-oss-20b', models: ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'llama-3.3-70b-versatile'], url: 'https://console.groq.com/keys' },
  sambanova: { name: 'SambaNova', model: 'DeepSeek-V3.1', models: ['DeepSeek-V3.1'], url: 'https://cloud.sambanova.ai/' },
  ollama: { name: 'Ollama (local)', model: 'llama3.2', models: ['llama3.2', 'gpt-oss:20b'], url: 'https://ollama.com/' }
};
export type ProviderId = keyof typeof providerOptions;

export async function testProviderConfiguration(config: AIConfiguration): Promise<void> {
  if (!config.model?.trim() || (config.provider !== 'ollama' && !config.apiKey?.trim())) {
    throw new Error('Enter your API key and select a model first.');
  }
  try {
    const valid = await AIService.getInstance().testProviderConnection(config.provider, config, true);
    if (!valid) throw new Error('The provider did not confirm the connection.');
  } catch (error) {
    const cause = error as any;
    const message = String(cause?.message || 'Connection failed');
    if (cause?.type === 'rate_limit_error' || /429|quota|rate.?limit/i.test(message)) {
      throw new Error('The provider quota or rate limit was reached. This does not mean the key is invalid. Check this model’s quota in your provider account and try later.');
    }
    if (cause?.type === 'invalid_api_key' || /401|403|permission|invalid.*key/i.test(message)) {
      throw new Error('The provider rejected access. Check the key, API restrictions, project permissions, and model access.');
    }
    if (/404|not found|not supported/i.test(message)) throw new Error('This model is unavailable for your key. Choose a model listed in your provider account.');
    if (/abort|timeout/i.test(message)) throw new Error('The connection test timed out. Check your connection and try again.');
    // Never surface raw SDK errors that may embed request headers or keys.
    throw new Error('Connection failed. Check your network, key, model ID, region, and provider account access.');
  }
}

export async function listGeminiModels(key: string): Promise<string[]> {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', {
    headers: { 'x-goog-api-key': key.trim() }, signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(response.status === 429 ? 'Model listing is rate-limited. Try later or enter a model ID manually.' : 'Could not list models. Check your Gemini key and API restrictions, or enter a model ID manually.');
  const data = await response.json();
  return (data.models || []).filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m: any) => String(m.name).replace(/^models\//, ''));
}
