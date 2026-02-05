import { AIProvider, AIMessage, AIResponse, ModelConfig, AITool, ModelInfo } from './types';
import { OllamaProvider } from './providers/ollama';
import { GroqProvider } from './providers/groq';

export const AVAILABLE_MODELS: ModelInfo[] = [
    // Local Models
    {
        id: 'ollama-llama3.2',
        name: 'Llama 3.2',
        provider: 'ollama',
        description: 'Fast, private, runs locally',
        icon: '🔒',
        requiresApiKey: false,
        contextWindow: 8192,
        strengths: ['Privacy', 'Offline', 'Free'],
    },

    // Groq Models
    {
        id: 'groq-llama3.1',
        name: 'Llama 3.1 8B',
        provider: 'groq',
        description: 'Instant speed (8B)',
        icon: '🚀',
        requiresApiKey: true,
        contextWindow: 128000,
        strengths: ['Instant', 'Chat', 'Efficiency'],
    },
    {
        id: 'groq-gpt-oss',
        name: 'GPT-OSS 20B',
        provider: 'groq',
        description: 'Google open model',
        icon: '🤖',
        requiresApiKey: true,
        contextWindow: 8192,
        strengths: ['Open Source', 'General'],
    },
];

export class AIAdapter {
    private providers: Map<string, AIProvider> = new Map();

    constructor() {
        // Initialize providers
        this.providers.set('ollama', new OllamaProvider('llama3.2'));
        this.providers.set('groq', new GroqProvider('llama-3.1-8b-instant'));
    }

    getProvider(modelId: string): AIProvider {
        const modelInfo = AVAILABLE_MODELS.find(m => m.id === modelId);

        if (!modelInfo) {
            throw new Error(`Unknown model: ${modelId}`);
        }

        const provider = modelInfo.provider;

        switch (provider) {
            case 'ollama':
                const ollamaModel = modelId.replace('ollama-', '');
                return new OllamaProvider(ollamaModel);

            case 'groq':
                const groqModel = modelId === 'groq-llama3.1' ? 'llama-3.1-8b-instant' : 'openai/gpt-oss-20b';
                return new GroqProvider(groqModel);

            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    async generateResponse(
        modelId: string,
        messages: AIMessage[],
        config?: ModelConfig,
        tools?: AITool[]
    ): Promise<AIResponse> {
        const provider = this.getProvider(modelId);

        // Check if provider is available
        const isAvailable = await provider.isAvailable();

        if (!isAvailable) {
            if (provider.type === 'cloud') {
                console.warn(`${provider.name} not available, falling back to Ollama`);
                const ollamaProvider = new OllamaProvider('llama3.2');
                return ollamaProvider.generateResponse(messages, config, tools);
            }
            throw new Error(`${provider.name} is not available. Please ensure it's running.`);
        }

        return provider.generateResponse(messages, config, tools);
    }

    async checkModelAvailability(modelId: string): Promise<boolean> {
        try {
            const provider = this.getProvider(modelId);
            // Use strict validation if available
            if (provider.validate) {
                return await provider.validate();
            }
            return await provider.isAvailable();
        } catch (error) {
            return false;
        }
    }

    getAvailableModels(): ModelInfo[] {
        return AVAILABLE_MODELS;
    }

    getModelInfo(modelId: string): ModelInfo | undefined {
        return AVAILABLE_MODELS.find(m => m.id === modelId);
    }
}

// Export singleton instance
export const aiAdapter = new AIAdapter();
