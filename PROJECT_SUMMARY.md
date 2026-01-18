# Fantasy Red Zone - Project Summary

## 🎯 Overview

Fantasy Red Zone is a production-quality content aggregation platform for fantasy football enthusiasts. It aggregates content from multiple sources (RSS feeds, YouTube, podcasts), provides personalized feeds, user accounts, and integrates with Sleeper fantasy football app.

## 📦 What's Included

### Monorepo Structure
```
fantasy-red-zone/
├── apps/
│   ├── api/                    # Express backend
│   │   ├── src/
│   │   │   ├── routes/        # API endpoints
│   │   │   ├── services/      # Business logic
│   │   │   ├── middleware/    # Auth & validation
│   │   │   ├── db/           # Prisma client & seed
│   │   │   ├── cron.ts       # Scheduled jobs
│   │   │   └── index.ts      # Main app
│   │   ├── prisma/
│   │   │   └── schema.prisma # Database schema
│   │   └── Dockerfile
│   │
│   └── web/                   # Next.js frontend
│       ├── src/
│       │   ├── app/          # Pages (App Router)
│       │   ├── components/   # React components
│       │   └── lib/          # Auth & API client
│       └── Dockerfile
│
├── packages/
│   └── shared/               # Shared types & schemas
│       └── src/
│           └── index.ts     # Zod schemas & types
│
├── docker-compose.yml        # Container orchestration
├── README.md                 # Main documentation
├── SETUP.md                  # Setup instructions
└── setup.sh / setup.bat     # Setup scripts
```

## ✨ Features Implemented

### 🔐 Authentication & Authorization
- **Google OAuth** via NextAuth.js
- **JWT tokens** for API authentication
- **Role-based access** (USER/ADMIN)
- **Secure session management**
- Admin user setup via environment variable

### 📰 Content Aggregation
- **RSS feed parsing** using rss-parser
- **YouTube/Atom feed support**
- **Podcast RSS support**
- **Automatic ingestion** every 30 minutes via cron
- **Manual trigger** for admins
- **Duplicate prevention** via unique URL constraint
- **Content metadata** extraction (title, description, thumbnail, date)

### 🏠 Content Discovery
- **Global feed** with all content
- **Featured carousel** on home page (admin-managed)
- **Search** by keywords
- **Filter** by content type (Article/Video/Podcast)
- **Sort** by recent or popular
- **Cursor pagination** for performance
- **Click tracking** for popularity metrics

### 👤 User Features
- **Follow/unfollow sources**
- **Personal "My Feed"** from followed sources
- **Save content** for later (bookmarks)
- **Custom feeds** with user-selected sources
- **Feed management** (create, add/remove sources)

### 🎮 Sleeper Integration
- **Connect by username** (no password/OAuth required)
- **Read-only API access**
- **Fetch leagues** for current season
- **Sync rosters** from all leagues
- **Connection status** display
- **Manual sync** on demand

### 🛡️ Admin Features
- **Add/edit sources**
- **Activate/deactivate sources**
- **Trigger manual ingestion**
- **Manage featured items** (create/update/delete/schedule)

## 🗄️ Database Schema

### Core Models
- **User**: Authentication & profile
- **Account/Session**: NextAuth tables
- **Source**: Content sources (RSS/YouTube/Podcast)
- **Content**: Aggregated content items
- **FavoriteSource**: User's followed sources
- **SavedContent**: User's bookmarks
- **Feed/FeedSource**: Custom user feeds
- **FeaturedItem**: Admin-curated featured content

### Sleeper Models
- **UserSleeperAccount**: Linked Sleeper account
- **SleeperLeague**: User's fantasy leagues
- **SleeperRoster**: League rosters with players

## 🔌 API Endpoints

### Public Endpoints
```
GET  /health                          # Health check
GET  /content                         # List content (filters: type, q, sourceId, sort, limit, cursor)
GET  /content/:id                     # Get single content item
POST /content/:id/click               # Track content click
GET  /sources                         # List all sources
GET  /featured                        # Get featured items
```

### Authenticated Endpoints
```
# User Feed
GET  /me/feed                         # Personal feed from followed sources

# Favorites
POST   /me/favorites/sources/:id      # Follow source
DELETE /me/favorites/sources/:id      # Unfollow source
GET    /me/favorites/sources          # List followed sources

# Saved Content
POST   /me/saved/:id                  # Save content
DELETE /me/saved/:id                  # Unsave content
GET    /me/saved                      # List saved content (paginated)

# Custom Feeds
POST   /feeds                         # Create feed
GET    /feeds                         # List user's feeds
GET    /feeds/:id                     # Get feed details
GET    /feeds/:id/sources             # Get feed sources
POST   /feeds/:id/sources/:sourceId   # Add source to feed
DELETE /feeds/:id/sources/:sourceId   # Remove source from feed
GET    /feeds/:id/content             # Get content for feed

# Sleeper Integration
GET    /integrations/sleeper/status   # Connection status
POST   /integrations/sleeper/connect  # Connect by username
DELETE /integrations/sleeper/disconnect # Disconnect
POST   /integrations/sleeper/sync     # Sync leagues & rosters
```

### Admin-Only Endpoints
```
POST  /sources                        # Create source
PATCH /sources/:id                    # Update source
POST  /ingest/run                     # Trigger ingestion
POST  /featured                       # Create featured item
PATCH /featured/:id                   # Update featured item
DELETE /featured/:id                  # Delete featured item
```

## 🎨 Frontend Pages

```
/                   # Home page (global feed + featured carousel)
/my                 # Personal feed (followed sources)
/sources            # Browse & follow sources
/feeds              # Manage custom feeds
/feeds/[id]         # View custom feed content
/saved              # Bookmarked content
/profile            # User profile & Sleeper integration
```

## 🛠️ Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- NextAuth.js (Auth.js)
- Axios

### Backend
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- rss-parser
- node-cron
- Axios (for Sleeper API)

### Shared
- Zod (validation schemas)
- TypeScript (shared types)

### DevOps
- Docker & Docker Compose
- pnpm workspaces
- GitHub-ready

## 🚀 Deployment Options

### Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Manual Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Build and deploy apps separately
4. Set up reverse proxy (nginx/Caddy)

### Cloud Platforms
- **Vercel** for Next.js frontend
- **Railway/Render** for Express API
- **Supabase/PlanetScale** for PostgreSQL

## 🔒 Security Features

- **Environment-based secrets** (no hardcoded credentials)
- **JWT token authentication** with expiry
- **Secure password hashing** (handled by OAuth)
- **CORS protection**
- **Helmet.js** security headers
- **Input validation** with Zod
- **SQL injection protection** via Prisma
- **Rate limiting ready** (can be added)

## 📊 Performance Features

- **Cursor pagination** (efficient for large datasets)
- **Database indexes** on frequently queried fields
- **Cron-based ingestion** (reduces on-demand load)
- **Unique constraints** (prevents duplicates)
- **Connection pooling** via Prisma
- **Next.js optimization** (SSR, image optimization)

## 🧪 Testing Ready

The codebase is structured for easy testing:
- Separated concerns (routes/services/middleware)
- Dependency injection ready
- Clear API contracts
- Type safety throughout

## 📝 Environment Variables

### Required
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT signing (must match in API & Web)
- `NEXTAUTH_SECRET`: NextAuth.js secret
- `NEXTAUTH_URL`: Frontend URL
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

### Optional
- `ADMIN_EMAIL`: Email for admin user
- `PORT`: API port (default: 4000)
- `NODE_ENV`: Environment (development/production)
- `SLEEPER_API_URL`: Sleeper API base URL (default: https://api.sleeper.app/v1)

## 🎯 Production Readiness Checklist

✅ **Authentication & Authorization** - Google OAuth + JWT
✅ **Database Schema** - Comprehensive with indexes
✅ **API Documentation** - Clear endpoint listing
✅ **Error Handling** - Consistent error responses
✅ **Input Validation** - Zod schemas
✅ **Security Headers** - Helmet.js
✅ **CORS Configuration** - Configurable origins
✅ **Environment Configuration** - .env files
✅ **Docker Support** - Full containerization
✅ **Database Migrations** - Prisma migrations ready
✅ **Seed Data** - Example sources included
✅ **README Documentation** - Comprehensive
✅ **Setup Scripts** - Automated setup
✅ **Type Safety** - Full TypeScript coverage
✅ **Monorepo Structure** - Clean separation
✅ **Responsive Design** - Mobile-friendly UI

## 🔮 Future Enhancements (Optional)

- [ ] Email notifications for new content
- [ ] Push notifications
- [ ] Player news aggregation
- [ ] Start/sit recommendations based on Sleeper rosters
- [ ] Social features (comments, likes)
- [ ] Dark mode
- [ ] Mobile app (React Native)
- [ ] Redis caching
- [ ] ElasticSearch for advanced search
- [ ] Content recommendations (ML)
- [ ] Analytics dashboard
- [ ] Rate limiting
- [ ] API versioning
- [ ] Webhooks
- [ ] RSS feed export for custom feeds
- [ ] Multi-language support

## 📞 Support & Maintenance

The codebase follows best practices:
- **Clean code** with clear naming
- **Consistent structure** across modules
- **Type safety** prevents common bugs
- **Modular design** for easy updates
- **Comments** where complexity exists
- **Error logging** for debugging

## 🎓 Learning Resources

This project demonstrates:
- Modern monorepo architecture
- Full-stack TypeScript development
- Authentication flows (OAuth + JWT)
- Database design with Prisma
- RESTful API design
- React/Next.js best practices
- Docker containerization
- Production deployment patterns

Perfect as a:
- **Portfolio project**
- **Learning reference**
- **Production starter template**
- **Interview preparation**

---

**Built with ❤️ for fantasy football enthusiasts**
