import { AIProvider, AIMessage, AIResponse, ModelConfig, AITool } from '../types';

export class OllamaProvider implements AIProvider {
    id = 'ollama';
    name = 'Ollama';
    type: 'local' = 'local';

    private baseUrl: string;
    private model: string;

    constructor(model: string = 'llama3.2', baseUrl: string = 'http://127.0.0.1:11434') {
        this.model = model;
        this.baseUrl = baseUrl;
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                signal: AbortSignal.timeout(2000),
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async generateResponse(
        messages: AIMessage[],
        config?: ModelConfig,
        tools?: AITool[]
    ): Promise<AIResponse> {
        // Validate connection first
        if (!await this.isAvailable()) {
            throw new Error('Ollama connection failed. Is Ollama running?');
        }

        try {
            const requestBody = {
                model: this.model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content,
                })),
                stream: false,
                options: {
                    temperature: config?.temperature || 0.7,
                    num_ctx: 8192,
                }
            };

            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                if (errorText.includes('not found')) {
                    throw new Error(`Model "${this.model}" not found. Run "ollama pull ${this.model}" in your terminal.`);
                }
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data = await response.json();

            return {
                content: data.message.content,
                finishReason: data.done ? 'stop' : 'length',
                usage: {
                    promptTokens: data.prompt_eval_count || 0,
                    completionTokens: data.eval_count || 0,
                    totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
                }
            };
        } catch (error: any) {
            if (error.message.includes('fetch failed')) {
                throw new Error('Ollama connection refused. Make sure Ollama is running on port 11434.');
            }
            if (error.message.includes('not found')) {
                throw new Error(`Model "${this.model}" not found. Please run: ollama pull ${this.model}`);
            }
            throw new Error(`Ollama error: ${error.message}`);
        }
    }
}
