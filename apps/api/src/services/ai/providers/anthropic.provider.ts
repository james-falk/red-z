/**
 * Anthropic (Claude) Provider Implementation
 * 
 * NOTE: Requires ANTHROPIC_API_KEY environment variable
 * Sign up at: https://console.anthropic.com/
 * Pricing: No free tier, pay-as-you-go
 * - Claude 3.5 Sonnet: $3.00 per 1M input tokens, $15.00 per 1M output tokens
 * - Claude 3.5 Haiku: $0.80 per 1M input tokens, $4.00 per 1M output tokens
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

export class AnthropicProvider implements IAIProvider {
  readonly provider = AIProvider.ANTHROPIC;
  private apiKey: string | undefined;
  private baseUrl = 'https://api.anthropic.com/v1';
  private version = '2023-06-01';

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.isConfigured) {
      throw new Error('Anthropic API key not configured');
    }

    const model = request.model || AIModel.CLAUDE_3_5_HAIKU;
    
    // Anthropic requires system message to be separate
    const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey!,
        'anthropic-version': this.version,
      },
      body: JSON.stringify({
        model,
        messages: conversationMessages,
        system: systemMessage || undefined,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();

    return {
      content: data.content[0].text,
      finishReason: data.stop_reason === 'end_turn' ? 'stop' : data.stop_reason === 'max_tokens' ? 'length' : 'error',
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
      model: data.model,
      provider: this.provider,
    };
  }

  async generateEmbedding(_request: AIEmbeddingRequest): Promise<AIEmbeddingResponse> {
    // Anthropic doesn't provide embeddings API yet
    // For now, throw an error - in the future, we could use Voyage AI or similar
    throw new Error('Anthropic does not support embeddings. Use OpenAI or another provider.');
  }

  async checkHealth(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      // Anthropic doesn't have a simple health check endpoint
      // We'll do a minimal completion request
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey!,
          'anthropic-version': this.version,
        },
        body: JSON.stringify({
          model: AIModel.CLAUDE_3_5_HAIKU,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 10,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
