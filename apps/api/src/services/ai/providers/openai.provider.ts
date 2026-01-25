/**
 * OpenAI Provider Implementation
 * 
 * NOTE: Requires OPENAI_API_KEY environment variable
 * Sign up at: https://platform.openai.com/
 * Pricing: $5 free credits for new accounts (expires in 3 months), then pay-as-you-go
 * - GPT-4o: $2.50 per 1M input tokens, $10.00 per 1M output tokens
 * - GPT-4o-mini: $0.150 per 1M input tokens, $0.600 per 1M output tokens
 */

import {
  IAIProvider,
  AIProvider,
  AICompletionRequest,
  AICompletionResponse,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
  AIModel,
} from '../types';

export class OpenAIProvider implements IAIProvider {
  readonly provider = AIProvider.OPENAI;
  private apiKey: string | undefined;
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.isConfigured) {
      throw new Error('OpenAI API key not configured');
    }

    const model = request.model || AIModel.GPT_4O_MINI;
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json() as any;
    const choice = data.choices[0];

    return {
      content: choice.message.content,
      finishReason: choice.finish_reason === 'stop' ? 'stop' : choice.finish_reason === 'length' ? 'length' : 'error',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      model: data.model,
      provider: this.provider,
    };
  }

  async generateEmbedding(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse> {
    if (!this.isConfigured) {
      throw new Error('OpenAI API key not configured');
    }

    const model = request.model || 'text-embedding-3-small';
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: request.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json() as any;

    return {
      embedding: data.data[0].embedding,
      model: data.model,
      provider: this.provider,
    };
  }

  async checkHealth(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
