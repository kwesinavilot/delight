import { GroqProvider } from './GroqProvider';
import { AIConfiguration } from '../../../types/ai';

export class GPTOSSOnlineProvider extends GroqProvider {
    constructor(config: AIConfiguration) {
        super(config);
    }

    get name(): string {
        return 'gpt-oss-online';
    }

    // Override to only show GPT-OSS models
    getAvailableModels(): string[] {
        return [
            'openai/gpt-oss-120b',
            'openai/gpt-oss-20b'
        ];
    }

    // Override default model
    getDefaultModel(): string {
        return 'openai/gpt-oss-20b';
    }
}