export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface AIResponse {
  content: string;
  finishReason?: 'stop' | 'length' | 'tool_call';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ModelConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export interface AIProvider {
  id: string;
  name: string;
  type: 'local' | 'cloud';
  isAvailable(): Promise<boolean>;
  validate?(): Promise<boolean>; // Stricter validation (api call)
  generateResponse(
    messages: AIMessage[],
    config?: ModelConfig,
    tools?: AITool[]
  ): Promise<AIResponse>;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: string;
  requiresApiKey: boolean;
  contextWindow: number;
  strengths: string[];
}
