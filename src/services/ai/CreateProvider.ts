import { AIConfiguration, AIProvider } from '../../types/ai';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { GrokProvider } from './providers/GrokProvider';
import { GroqProvider } from './providers/GroqProvider';
import { SambaNovaProvider } from './providers/SambaNovaProvider';
import { OllamaProvider } from './providers/OllamaProvider';
export function createProvider(config: AIConfiguration): AIProvider {
  const classes = { openai: OpenAIProvider, deepseek: OpenAIProvider, mistral: OpenAIProvider, anthropic: AnthropicProvider, gemini: GeminiProvider, grok: GrokProvider, groq: GroqProvider, sambanova: SambaNovaProvider, ollama: OllamaProvider };
  const Provider = classes[config.provider as keyof typeof classes];
  if (!Provider) throw new Error('This AI provider is not supported.');
  return new Provider(config);
}
