import PostHogService, { analyticsError } from '../PostHogService';
import { AIConfiguration } from '../../types/ai';
import { AIService } from '../ai/AIService';

export const providerOptions = {
  openai: { name: 'OpenAI', model: 'gpt-4o-mini', models: ['gpt-4o-mini', 'gpt-4o'], gatewayPrefix: 'openai/', url: 'https://platform.openai.com/api-keys' },
  anthropic: { name: 'Anthropic', model: 'claude-sonnet-4-5', models: ['claude-sonnet-4-5'], gatewayPrefix: 'anthropic/', url: 'https://console.anthropic.com/' },
  gemini: { name: 'Google Gemini', model: 'gemini-2.5-flash-lite', models: ['gemini-2.5-flash-lite', 'gemini-2.5-flash'], gatewayPrefix: 'google/', url: 'https://aistudio.google.com/app/apikey' },
  deepseek: { name: 'DeepSeek', model: 'deepseek-chat', models: ['deepseek-chat', 'deepseek-reasoner'], gatewayPrefix: 'deepseek/', url: 'https://platform.deepseek.com/api_keys' },
  mistral: { name: 'Mistral AI', model: 'mistral-small-latest', models: ['mistral-small-latest', 'mistral-large-latest'], gatewayPrefix: 'mistral/', url: 'https://console.mistral.ai/api-keys/' },
  grok: { name: 'xAI', model: 'grok-3-mini', models: ['grok-3-mini'], gatewayPrefix: 'xai/', url: 'https://console.x.ai/' },
  groq: { name: 'Groq', model: 'openai/gpt-oss-20b', models: ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'llama-3.3-70b-versatile'], gatewayPrefix: 'groq/', url: 'https://console.groq.com/keys' },
  sambanova: {
    name: 'SambaNova',
    model: 'GLM-5.3',
    models: [
      'GLM-5.3',
      'MiniMax-M3.1-Flash',
      'gemma-4-31B-it',
      'gpt-oss-120b',
    ],
    gatewayPrefix: null,
    url: 'https://cloud.sambanova.ai/',
  },
  ollama: { name: 'Ollama (local)', model: 'llama3.2', models: ['llama3.2', 'gpt-oss:20b'], gatewayPrefix: null, url: 'https://ollama.com/' }
};
export type ProviderId = keyof typeof providerOptions;

export interface GatewayModel {
  id: string;
  modelId: string;
  name: string;
  description: string;
  contextWindow?: number;
  maxTokens?: number;
  supportsReasoning: boolean;
  supportsToolCalling: boolean;
  supportsVision: boolean;
}

let gatewayCatalog: any[] | undefined;
let gatewayCatalogExpires = 0;

export async function listGatewayModels(provider: ProviderId): Promise<GatewayModel[]> {
  const prefix = providerOptions[provider].gatewayPrefix;
  if (!prefix) return [];
  if (!gatewayCatalog || Date.now() >= gatewayCatalogExpires) {
    const response = await fetch('https://ai-gateway.vercel.sh/v1/models', { credentials: 'omit', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Could not load the model catalog. Try again or enter a model ID manually.');
    const data = await response.json();
    if (!Array.isArray(data?.data)) throw new Error('The model catalog returned an unexpected response.');
    gatewayCatalog = data.data;
    gatewayCatalogExpires = Date.now() + 5 * 60 * 1000;
  }
  const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  return (gatewayCatalog || []).flatMap((model: any): GatewayModel[] => {
    if (!model || typeof model.id !== 'string' || !model.id.startsWith(prefix) || model.type !== 'language') return [];
    const modalities = model.modalities || {};
    const input = strings(modalities.input).map(value => value.toLowerCase());
    const output = strings(modalities.output).map(value => value.toLowerCase());
    const tags = strings(model.tags).map(value => value.toLowerCase());
    const parameters = strings(model.supported_parameters).map(value => value.toLowerCase());
    if (!input.includes('text') || !output.includes('text') || [...input, ...output, ...tags].some(value => /audio|video|speech|transcri/.test(value))) return [];
    const id = model.id.slice(prefix.length);
    if (!id) return [];
    return [{
      id: model.id,
      modelId: id,
      name: typeof model.name === 'string' && model.name.trim() ? model.name : id,
      description: typeof model.description === 'string' ? model.description : '',
      contextWindow: typeof model.context_window === 'number' ? model.context_window : undefined,
      maxTokens: typeof model.max_tokens === 'number' ? model.max_tokens : undefined,
      supportsReasoning: tags.some(tag => tag.includes('reason')) || parameters.some(parameter => parameter.includes('reason')),
      supportsToolCalling: tags.some(tag => tag.includes('tool-use')) || parameters.some(parameter => ['tools', 'tool_choice', 'function_call'].includes(parameter)),
      supportsVision: input.includes('image') || tags.includes('vision')
    }];
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export async function testProviderConfiguration(config: AIConfiguration, purpose: 'default' | 'agent' = 'default'): Promise<void> {
  if (!config.model?.trim() || (config.provider !== 'ollama' && !config.apiKey?.trim())) {
    throw new Error('Enter your API key and select a model first.');
  }
  const started = Date.now();
  let success = false, category = 'other';
  try {
    const valid = await AIService.getInstance().testProviderConnection(config.provider, config, true);
    if (!valid) throw new Error('The provider did not confirm the connection.');
    success = true;
  } catch (error) {
    category = analyticsError(error);
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
  } finally {
    PostHogService.track('provider_connection_tested', { purpose, provider: config.provider, model: config.model, outcome: success ? 'success' : 'failed', error_category: success ? undefined : category, duration_ms: Date.now() - started });
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
