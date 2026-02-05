import Groq from 'groq-sdk';
import { AIProvider, AIMessage, AIResponse, ModelConfig, AITool } from '../types';

export class GroqProvider implements AIProvider {
    id = 'groq';
    name = 'Groq';
    type: 'cloud' = 'cloud';

    private client: Groq | null = null;
    private model: string;
    private apiKey: string | null;

    constructor(model: string = 'llama-3.1-8b-instant', apiKey?: string) {
        this.model = model;
        this.apiKey = apiKey || process.env.NEXT_PUBLIC_GROQ_API_KEY || null;

        if (this.apiKey) {
            this.client = new Groq({
                apiKey: this.apiKey,
                dangerouslyAllowBrowser: true, // Required for client-side usage
            });
        }
    }

    async isAvailable(): Promise<boolean> {
        return this.client !== null && this.apiKey !== null;
    }

    async validate(): Promise<boolean> {
        if (!this.client) return false;
        try {
            const result = await this.client.chat.completions.create({
                messages: [{ role: 'user', content: 'ping' }],
                model: 'llama-3.1-8b-instant', // Use a known stable model for ping
                max_tokens: 1,
            });
            return !!result.choices[0];
        } catch (error) {
            return false;
        }
    }

    async generateResponse(
        messages: AIMessage[],
        config?: ModelConfig,
        tools?: AITool[]
    ): Promise<AIResponse> {
        if (!this.client) {
            throw new Error('Groq API key not configured. Please add NEXT_PUBLIC_GROQ_API_KEY to your environment.');
        }

        try {
            const completion = await this.client.chat.completions.create({
                messages: messages.map(m => ({
                    role: m.role as 'user' | 'assistant' | 'system',
                    content: m.content,
                })),
                model: this.model,
                temperature: config?.temperature ?? 0.7,
                max_tokens: config?.maxTokens ?? 8192,
                top_p: config?.topP ?? 1,
                stream: false,
            });

            const choice = completion.choices[0];
            const finishReason = choice?.finish_reason;

            return {
                content: choice?.message?.content || '',
                finishReason: (finishReason === 'stop' || finishReason === 'length') ? finishReason : 'stop',
                usage: {
                    promptTokens: completion.usage?.prompt_tokens || 0,
                    completionTokens: completion.usage?.completion_tokens || 0,
                    totalTokens: completion.usage?.total_tokens || 0,
                },
            };
        } catch (error: any) {
            if (error.message.includes('decommissioned')) {
                throw new Error(`Model "${this.model}" has been decommissioned by Groq. Please use a newer model like "llama-3.1-8b-instant".`);
            }
            throw new Error(`Groq API error: ${error.message}`);
        }
    }
}
