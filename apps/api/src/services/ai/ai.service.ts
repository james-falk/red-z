/**
 * AI Service - Main entry point for AI functionality
 * 
 * This service manages multiple AI providers and provides a unified interface.
 * It automatically selects the best available provider based on configuration.
 * 
 * ACTIVATION:
 * 1. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env
 * 2. Set AI_ENABLED=true in .env
 * 3. The service will automatically use the first configured provider
 */

import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import {
  IAIProvider,
  AIProvider,
  AICompletionRequest,
  AICompletionResponse,
  FantasyAIRequest,
  FantasyAIResponse,
} from './types';

class AIService {
  private providers: Map<AIProvider, IAIProvider> = new Map();
  private defaultProvider: IAIProvider | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.AI_ENABLED === 'true';
    this.initializeProviders();
  }

  private initializeProviders() {
    // Register all providers
    const openai = new OpenAIProvider();
    const anthropic = new AnthropicProvider();

    if (openai.isConfigured) {
      this.providers.set(AIProvider.OPENAI, openai);
      if (!this.defaultProvider) this.defaultProvider = openai;
    }

    if (anthropic.isConfigured) {
      this.providers.set(AIProvider.ANTHROPIC, anthropic);
      if (!this.defaultProvider) this.defaultProvider = anthropic;
    }

    if (this.enabled && !this.defaultProvider) {
      console.warn('⚠️  AI_ENABLED=true but no AI providers are configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env');
    }

    if (this.defaultProvider) {
      console.log(`✅ AI Service initialized with provider: ${this.defaultProvider.provider}`);
    }
  }

  get isEnabled(): boolean {
    return this.enabled && !!this.defaultProvider;
  }

  get availableProviders(): AIProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get a specific provider or the default one
   */
  getProvider(provider?: AIProvider): IAIProvider {
    if (!this.enabled) {
      throw new Error('AI Service is not enabled. Set AI_ENABLED=true in .env');
    }

    if (provider) {
      const p = this.providers.get(provider);
      if (!p) {
        throw new Error(`Provider ${provider} is not configured`);
      }
      return p;
    }

    if (!this.defaultProvider) {
      throw new Error('No AI providers configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env');
    }

    return this.defaultProvider;
  }

  /**
   * Generate a completion using the default or specified provider
   */
  async complete(request: AICompletionRequest, provider?: AIProvider): Promise<AICompletionResponse> {
    const p = this.getProvider(provider);
    return p.complete(request);
  }

  /**
   * Fantasy Football specific: Answer user questions about fantasy football content
   */
  async answerFantasyQuestion(request: FantasyAIRequest): Promise<FantasyAIResponse> {
    if (!this.isEnabled) {
      throw new Error('AI Service is not enabled');
    }

    // Build context from provided data
    let contextText = '';
    if (request.context?.contentIds && request.context.contentIds.length > 0) {
      // TODO: Fetch actual content from database
      contextText += '\n\nRelevant articles: [Content will be fetched from database]';
    }

    const systemPrompt = `You are an expert fantasy football analyst assistant. You help users understand fantasy football news, make lineup decisions, and evaluate trades.

Your responses should be:
- Concise and actionable
- Based on facts from the provided articles
- Focused on fantasy football implications
- Honest about uncertainty

If you don't have enough information to answer confidently, say so.`;

    const response = await this.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.userMessage + contextText },
      ],
      temperature: 0.7,
      maxTokens: 500,
    });

    return {
      response: response.content,
      confidence: response.finishReason === 'stop' ? 0.8 : 0.5,
    };
  }

  /**
   * Generate content recommendations based on user preferences
   */
  async generateRecommendations(userId: string, contentSample: string[]): Promise<string[]> {
    if (!this.isEnabled) {
      return []; // Fail gracefully - return empty recommendations
    }

    try {
      const response = await this.complete({
        messages: [
          {
            role: 'system',
            content: 'You are a recommendation engine. Based on content titles, suggest 3-5 relevant content IDs.',
          },
          {
            role: 'user',
            content: `User has interacted with: ${contentSample.join(', ')}. Suggest similar content.`,
          },
        ],
        temperature: 0.5,
        maxTokens: 200,
      });

      // Parse response for content IDs (basic implementation)
      return response.content.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      console.error('AI recommendation error:', error);
      return [];
    }
  }

  /**
   * Auto-tag content using AI
   */
  async suggestTags(title: string, description: string): Promise<string[]> {
    if (!this.isEnabled) {
      return []; // Fail gracefully
    }

    try {
      const response = await this.complete({
        messages: [
          {
            role: 'system',
            content: 'Extract relevant fantasy football tags (players, teams, positions, topics) from the content. Return as comma-separated list.',
          },
          {
            role: 'user',
            content: `Title: ${title}\n\nDescription: ${description}`,
          },
        ],
        temperature: 0.3,
        maxTokens: 100,
      });

      return response.content
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    } catch (error) {
      console.error('AI tagging error:', error);
      return [];
    }
  }

  /**
   * Check health of all configured providers
   */
  async checkHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    for (const [name, provider] of this.providers) {
      try {
        health[name] = await provider.checkHealth();
      } catch {
        health[name] = false;
      }
    }

    return health;
  }
}

// Export singleton instance
export const aiService = new AIService();
