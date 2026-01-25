# Social Media Ingestion Framework

Infrastructure for ingesting social media posts from Instagram, Facebook, and Twitter (X).

## ⚠️ Important Notes

### API Costs & Limitations

**Instagram:**
- Requires Facebook Developer account
- Limited to Instagram Business/Creator accounts
- Basic Display API: Only for user's own posts
- Graph API: Requires app review and specific permissions
- **Alternative:** Consider RSS feeds or third-party aggregators

**Facebook:**
- Requires Facebook Developer account
- Limited to pages you manage or have permissions for
- Free tier available but rate-limited
- **Cost:** Free for basic usage

**Twitter (X):**
- **Free tier is deprecated** for most use cases
- **Basic:** $100/month - 10,000 tweets/month
- **Pro:** $5,000/month - 1M tweets/month
- **Alternative:** RSS feeds for public accounts (e.g., `https://nitter.net/username/rss`)

### Recommendations

For cost-effective fantasy football content:
1. **Start with RSS feeds** (many accounts have RSS alternatives)
2. **Use Facebook** if you manage relevant pages (free)
3. **Avoid Twitter API** unless budget allows ($100+/month)
4. **Instagram** is challenging without business accounts

## 🚀 Setup

### 1. Instagram (Optional)

```bash
# Add to apps/api/.env
INSTAGRAM_ACCESS_TOKEN=your_access_token
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_ACCOUNTS=account1,account2
INSTAGRAM_HASHTAGS=fantasyfootball,nfl
```

**Getting credentials:**
1. Go to https://developers.facebook.com/
2. Create an app
3. Add Instagram Basic Display or Graph API product
4. Get access token through OAuth flow

### 2. Facebook (Optional)

```bash
# Add to apps/api/.env
FACEBOOK_ACCESS_TOKEN=your_page_access_token
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_PAGE_IDS=page1,page2
```

**Getting credentials:**
1. Go to https://developers.facebook.com/
2. Create an app
3. Get Page Access Token for pages you manage
4. Token Explorer: https://developers.facebook.com/tools/accesstoken/

### 3. Twitter (Optional, Paid)

```bash
# Add to apps/api/.env
TWITTER_BEARER_TOKEN=your_bearer_token
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCOUNTS=account1,account2
TWITTER_HASHTAGS=fantasyfootball,nfl
```

**Getting credentials:**
1. Go to https://developer.twitter.com/
2. Sign up for a paid tier ($100+/month)
3. Create an app
4. Get Bearer Token from app settings

### 4. Enable Service

```bash
# Add to apps/api/.env
ENABLE_SOCIAL_INGESTION=true
```

## 📖 Usage

### Fetch Posts Manually

```typescript
import { socialIngestionService, SocialPlatform } from './services/social';

// Fetch Twitter posts
const posts = await socialIngestionService.fetchAccountPosts(
  SocialPlatform.TWITTER,
  'AdamSchefter',
  10
);

// Search by hashtag
const hashtagPosts = await socialIngestionService.searchHashtag(
  SocialPlatform.TWITTER,
  'fantasyfootball',
  20
);
```

### Automated Ingestion

The service has an `ingestConfiguredAccounts()` method that:
1. Reads account lists from environment variables
2. Fetches posts from all configured accounts
3. Can be called by a cron job

**Note:** Database storage is not yet implemented (marked as TODO).

## 🏗️ Architecture

```
social/
├── types.ts                           # Shared types
├── social-ingestion.service.ts        # Main service
├── providers/
│   ├── instagram.provider.ts          # Instagram implementation
│   ├── facebook.provider.ts           # Facebook implementation
│   └── twitter.provider.ts            # Twitter implementation
└── README.md                          # This file
```

## 🔌 Provider Status

| Platform  | Status        | Cost         | Notes                           |
|-----------|---------------|--------------|----------------------------------|
| Instagram | Partial       | Free         | Limited to business accounts     |
| Facebook  | Working       | Free         | Pages you manage only            |
| Twitter   | Working       | $100+/month  | Basic tier minimum               |

## 🎓 Future Enhancements

- [ ] Database schema for storing social posts
- [ ] Deduplication logic
- [ ] Rate limiting and retry logic
- [ ] Webhook support for real-time updates
- [ ] TikTok provider
- [ ] LinkedIn provider
- [ ] Third-party aggregator integration (e.g., Zapier, IFTTT)
- [ ] RSS fallback for platforms with high API costs

## 💡 Cost-Effective Alternatives

### RSS Feeds (Recommended)

Many social accounts have RSS alternatives:

- **Twitter via Nitter:** `https://nitter.net/username/rss`
- **YouTube:** `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`
- **Instagram via RSS Bridge:** Self-hosted RSS Bridge instance

### Third-Party Services

- **Zapier:** $20+/month, connects multiple platforms
- **IFTTT:** Free tier available
- **RSS Bridge:** Free, self-hosted, converts social to RSS

## 🐛 Troubleshooting

**"Social ingestion is not enabled"**
- Set `ENABLE_SOCIAL_INGESTION=true` in `.env`

**"Provider for X is not configured"**
- Add API credentials for that platform to `.env`

**Twitter API errors**
- Verify you're on a paid tier ($100+/month)
- Check bearer token is correct
- Ensure app has required permissions

**Instagram API errors**
- Verify account is Instagram Business/Creator
- Check access token hasn't expired
- Ensure app has required permissions

## 🔒 Security Notes

- API keys are **never** exposed to the frontend
- All social ingestion happens server-side
- Consider rate limiting to avoid exceeding quotas
- Monitor costs via platform dashboards
