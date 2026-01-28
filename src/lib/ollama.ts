export interface OllamaMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export const generateOllamaResponse = async (
    messages: OllamaMessage[],
    model: string = 'llama3.2' // Default model, user can change in settings later
): Promise<string> => {
    try {
        const response = await fetch('http://127.0.0.1:11434/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                stream: false,
            }),
        });

        if (!response.ok) {
            let errorText = response.statusText;
            try {
                const errorData = await response.json();
                errorText = errorData.error || response.statusText;
            } catch (e) {
                // Fallback to status text
            }
            throw new Error(`Ollama API error: ${errorText}`);
        }

        const data = await response.json();
        return data.message.content;
    } catch (error: any) {
        console.error('Failed to connect to Ollama:', error);
        if (error.message?.includes('Not Found')) {
            return `Ollama returned 404 (Not Found). This usually means the model "${model}" isn't pulled. Please run "ollama pull ${model}" in your terminal and try again!`;
        }
        return `Connection Error: ${error.message || "I'm having trouble connecting to my local brain (Ollama). Please make sure it's running!"}`;
    }
};
