/**
 * AI Service Types
 * 
 * Provider-agnostic interfaces for AI functionality.
 * Supports multiple providers (OpenAI, Anthropic, etc.)
 */

export enum AIProvider {
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
  // Future: GEMINI, LLAMA, etc.
}

export enum AIModel {
  // OpenAI Models
  GPT_4O = 'gpt-4o',
  GPT_4O_MINI = 'gpt-4o-mini',
  GPT_4_TURBO = 'gpt-4-turbo',
  
  // Anthropic Models
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-20241022',
  CLAUDE_3_5_HAIKU = 'claude-3-5-haiku-20241022',
  CLAUDE_3_OPUS = 'claude-3-opus-20240229',
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AICompletionResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'error';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: AIProvider;
}

export interface AIEmbeddingRequest {
  text: string;
  model?: string;
}

export interface AIEmbeddingResponse {
  embedding: number[];
  model: string;
  provider: AIProvider;
}

/**
 * Base interface that all AI providers must implement
 */
export interface IAIProvider {
  readonly provider: AIProvider;
  readonly isConfigured: boolean;
  
  /**
   * Generate a text completion
   */
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
  
  /**
   * Generate embeddings for semantic search
   */
  generateEmbedding(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse>;
  
  /**
   * Check if the provider is available and configured
   */
  checkHealth(): Promise<boolean>;
}

/**
 * Fantasy Football specific AI use cases
 */
export interface FantasyAIRequest {
  userMessage: string;
  context?: {
    userId?: string;
    contentIds?: string[];
    playerNames?: string[];
    teamNames?: string[];
  };
}

export interface FantasyAIResponse {
  response: string;
  sources?: Array<{
    contentId: string;
    title: string;
    url: string;
  }>;
  confidence?: number;
}
