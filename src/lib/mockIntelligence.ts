import { Task } from './store';
import { generateOllamaResponse, OllamaMessage } from './ollama';

export type ResponseType = 'CHAT' | 'TASK' | 'MEMORY';

export interface AIResponse {
    type: ResponseType;
    text: string;
    data?: any;
}

export const processInput = async (
    input: string,
    userName: string,
    aiName: string,
    history: { role: 'user' | 'ai'; text: string }[] = []
): Promise<AIResponse> => {
    const lowercaseInput = input.toLowerCase();

    // 1. Intent Parsing: Delete/Remove Tasks (Priority)
    if (
        lowercaseInput.includes('delete task') ||
        lowercaseInput.includes('remove task') ||
        lowercaseInput.includes('clear task')
    ) {
        return {
            type: 'TASK',
            text: `I'll look for that directive to remove it for you, ${userName}.`,
            data: { action: 'delete', query: input.replace(/delete task |remove task |clear task /gi, '').trim() }
        };
    }

    // 2. Intent Parsing: Task Creation
    if (
        lowercaseInput.includes('remind') ||
        lowercaseInput.includes('schedule') ||
        lowercaseInput.includes('buy') ||
        lowercaseInput.includes('todo') ||
        lowercaseInput.includes('wake me up') ||
        lowercaseInput.includes('alarm') ||
        lowercaseInput.includes('add')
    ) {
        const taskTitle = input.replace(/remind me to |schedule |buy |todo |wake me up at |alarm for |add /gi, '').trim();
        return {
            type: 'TASK',
            text: `Of course, ${userName}. I've added "${taskTitle || input}" to your list. — ${aiName}`,
            data: { action: 'create', title: taskTitle || input }
        };
    }

    // 3. Intent Parsing: Identity
    if (
        lowercaseInput.includes('your name') ||
        lowercaseInput.includes('who are you') ||
        lowercaseInput.includes('who is this')
    ) {
        return {
            type: 'CHAT',
            text: `I am ${aiName}, your personal AI companion. It's a pleasure to assist you, ${userName}.`
        };
    }

    // 4. Intent Parsing: Memory
    if (
        lowercaseInput.includes('i love') ||
        lowercaseInput.includes('i hate') ||
        lowercaseInput.includes('remember that')
    ) {
        return {
            type: 'MEMORY',
            text: `Noted, ${userName}. I'll remember that for you.`,
            data: { text: input }
        };
    }

    // 5. Default Greetings (Local)
    const greetings = ['hello', 'hi', 'hey'];
    if (greetings.some(g => lowercaseInput === g || lowercaseInput.startsWith(g + ' '))) {
        return {
            type: 'CHAT',
            text: `Hello ${userName}! How can I help you today? — ${aiName}`
        };
    }

    // 6. Fallback to Ollama for complex/knowledge queries
    const ollamaHistory: OllamaMessage[] = [
        {
            role: 'system',
            content: `You are ${aiName}, a loyal, supportive, and intelligent AI companion to ${userName}.
      Keep your responses concise, friendly, and helpful. Always address the user as ${userName}.`
        },
        ...history.map(h => ({
            role: h.role === 'user' ? 'user' as const : 'assistant' as const,
            content: h.text
        })),
        { role: 'user', content: input }
    ];

    try {
        const llmResponse = await generateOllamaResponse(ollamaHistory);
        return {
            type: 'CHAT',
            text: llmResponse
        };
    } catch (error) {
        return {
            type: 'CHAT',
            text: `I understand, ${userName}. Tell me more about that. — ${aiName}`
        };
    }
};
