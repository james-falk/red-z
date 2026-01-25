# AI Service Framework

Provider-agnostic AI infrastructure for the Fantasy Red Zone platform.

## 🎯 Overview

This framework provides a unified interface for multiple AI providers (OpenAI, Anthropic, etc.) and implements fantasy football-specific use cases.

## 🚀 Quick Start

### 1. Choose a Provider

**OpenAI (Recommended for testing)**
- Sign up: https://platform.openai.com/
- Cost: $5 free credits for new accounts (expires in 3 months)
- After free credits: Pay-as-you-go
  - GPT-4o-mini: $0.15 per 1M input tokens (cheapest)
  - GPT-4o: $2.50 per 1M input tokens

**Anthropic (Claude)**
- Sign up: https://console.anthropic.com/
- Cost: No free tier, pay-as-you-go only
  - Claude 3.5 Haiku: $0.80 per 1M input tokens (cheapest)
  - Claude 3.5 Sonnet: $3.00 per 1M input tokens

### 2. Add Environment Variables

Add to `apps/api/.env`:

```bash
# Enable AI features
AI_ENABLED=true

# Choose ONE or BOTH providers
OPENAI_API_KEY=sk-...          # Get from platform.openai.com
ANTHROPIC_API_KEY=sk-ant-...   # Get from console.anthropic.com
```

### 3. That's It!

The service auto-configures based on available API keys. It will use the first configured provider as default.

## 📖 Usage Examples

### Basic Completion

```typescript
import { aiService } from './services/ai/ai.service';

const response = await aiService.complete({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  temperature: 0.7,
  maxTokens: 500
});

console.log(response.content);
```

### Fantasy Football Question

```typescript
const answer = await aiService.answerFantasyQuestion({
  userMessage: "Should I start Josh Allen or Patrick Mahomes this week?",
  context: {
    userId: "user123",
    contentIds: ["content1", "content2"] // Related articles
  }
});

console.log(answer.response);
```

### Content Recommendations

```typescript
const recommendations = await aiService.generateRecommendations(
  userId,
  ["Article about Josh Allen", "CMC injury update"]
);
```

### Auto-Tagging

```typescript
const tags = await aiService.suggestTags(
  "Josh Allen throws 4 TDs in victory",
  "Buffalo Bills quarterback Josh Allen..."
);
// Returns: ["Josh Allen", "Buffalo Bills", "Quarterback", "Touchdown"]
```

## 🏗️ Architecture

```
ai/
├── types.ts                    # Shared types and interfaces
├── ai.service.ts              # Main service (use this!)
├── providers/
│   ├── openai.provider.ts     # OpenAI implementation
│   └── anthropic.provider.ts  # Anthropic implementation
└── README.md                  # This file
```

## 🔌 Provider Selection

The service automatically selects providers based on configuration:

```typescript
// Use default provider (first configured)
await aiService.complete(request);

// Use specific provider
await aiService.complete(request, AIProvider.OPENAI);
await aiService.complete(request, AIProvider.ANTHROPIC);

// Check what's available
console.log(aiService.availableProviders); // ['OPENAI', 'ANTHROPIC']
console.log(aiService.isEnabled);          // true/false
```

## 💰 Cost Estimation

**Example: 1000 daily chat messages**
- Average message: ~200 tokens input, ~300 tokens output
- Daily tokens: 500K total
- Monthly cost with GPT-4o-mini: ~$0.38/month
- Monthly cost with GPT-4o: ~$10.25/month
- Monthly cost with Claude 3.5 Haiku: ~$2.40/month

**Recommendation**: Start with GPT-4o-mini or Claude 3.5 Haiku for cost efficiency.

## 🎓 Future Enhancements

- [ ] Streaming responses for real-time chat
- [ ] Function calling for structured data extraction
- [ ] Embeddings for semantic search
- [ ] Multi-turn conversation history
- [ ] Rate limiting per user
- [ ] Cost tracking and alerts
- [ ] A/B testing between providers
- [ ] Fine-tuned models for fantasy football

## 🔒 Security Notes

- API keys are **never** exposed to the frontend
- All AI calls go through the backend API
- Consider adding rate limiting per user
- Monitor costs via provider dashboards

## 🐛 Troubleshooting

**"AI Service is not enabled"**
- Set `AI_ENABLED=true` in `.env`

**"No AI providers configured"**
- Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to `.env`

**"Provider X is not configured"**
- Check that the API key is correctly set in `.env`
- Verify the key format (OpenAI: `sk-...`, Anthropic: `sk-ant-...`)

**High costs**
- Switch to cheaper models (GPT-4o-mini, Claude 3.5 Haiku)
- Reduce `maxTokens` in requests
- Add caching for repeated queries
- Implement rate limiting

## 📝 Notes

- The framework is **disabled by default** (`AI_ENABLED=false`)
- All methods fail gracefully when disabled (return empty arrays, throw clear errors)
- The first configured provider becomes the default
- Easy to add new providers by implementing `IAIProvider` interface
