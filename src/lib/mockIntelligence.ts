import { Task, Persona } from './store';
import { aiAdapter } from './ai/adapter';
import { AIMessage } from './ai/types';

export type ResponseType = 'CHAT' | 'TASK' | 'MEMORY';

export interface AIResponse {
    type: ResponseType;
    text: string;
    data?: any;
}

export const processInput = async (
    input: string,
    userName: string,
    activePersona: string | Persona, // Accept either string (legacy/fallback) or Persona object
    history: { role: 'user' | 'ai'; text: string }[] = [],
    selectedModel: string = 'ollama-llama3.2'
): Promise<AIResponse> => {
    const lowercaseInput = input.toLowerCase();

    // Resolve persona details
    const aiName = typeof activePersona === 'string' ? activePersona : activePersona.name;
    const personaObj = typeof activePersona === 'string' ? null : activePersona;

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
            text: `Of course, ${userName}. I've added "${taskTitle || input}" to your list.`,
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
            text: `Hello ${userName}! How can I help you today?`
        };
    }

    // 6. Fallback to AI Adapter for complex/knowledge queries

    // Construct System Prompt based on Persona
    let systemPrompt = '';

    if (personaObj && personaObj.systemPrompt) {
        // Use custom system prompt if available
        systemPrompt = personaObj.systemPrompt;

        // Append user name instruction if not present
        if (!systemPrompt.includes(userName)) {
            systemPrompt += `\n\nAlways address the user as ${userName}.`;
        }
    } else {
        // Default system prompt builder based on relationship mode
        const relationshipMode = personaObj?.relationshipMode || 'Strict Professional';

        systemPrompt = `You are ${aiName}, a loyal, supportive, and intelligent AI companion to ${userName}.
Relationship Mode: ${relationshipMode}.

Keep your responses concise, friendly, and helpful. Always address the user as ${userName}.`;
    }

    // Add Formatting Instructions (Universal)
    systemPrompt += `\n\nIMPORTANT: Format your responses using Markdown:
- Use **bold** for emphasis
- Use \`code\` for inline code or technical terms
- Use code blocks with language specification for code examples (e.g., \`\`\`python)
- Use bullet points or numbered lists when explaining multiple items
- Use headings (##) to organize longer responses
- Keep responses well-structured and easy to read`;

    const messages: AIMessage[] = [
        {
            role: 'system',
            content: systemPrompt
        },
        ...history.map(h => ({
            role: h.role === 'user' ? 'user' as const : 'assistant' as const,
            content: h.text
        })),
        { role: 'user', content: input }
    ];

    try {
        const response = await aiAdapter.generateResponse(selectedModel, messages);
        return {
            type: 'CHAT',
            text: response.content
        };
    } catch (error: any) {
        console.error('AI generation error:', error);
        return {
            type: 'CHAT',
            text: `I'm having trouble connecting to my AI brain. ${error.message || 'Please check your configuration.'}`
        };
    }
};
