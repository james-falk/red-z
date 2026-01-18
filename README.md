# Fantasy Red Zone

A production-quality monorepo for Fantasy Red Zone - your ultimate fantasy football content aggregation platform. Built with Next.js, Express, Prisma, and PostgreSQL.

## 📚 Documentation

- **[Setup Guide](./SETUP.md)** - Detailed local development setup
- **[Project Summary](./PROJECT_SUMMARY.md)** - Technical architecture overview
- **[MVP Notes](./MVP_NOTES.md)** - Quick reference for key MVP details

## 🏗 Architecture

- **Monorepo**: pnpm workspaces
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Auth.js
- **Backend**: Express + TypeScript + Prisma
- **Database**: PostgreSQL
- **Shared**: Common types and Zod schemas
- **Deployment**: Docker Compose

## 📁 Project Structure

```
fantasy-red-zone/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express backend
├── packages/
│   └── shared/       # Shared types & schemas
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL (if running locally without Docker)
- Google OAuth credentials

### Local Development Setup

1. **Clone and install dependencies:**

```bash
pnpm install
```

2. **Set up environment variables:**

Copy the example env files and configure them:

```bash
# API
cp apps/api/env.example apps/api/.env

# Web
cp apps/web/env.example apps/web/.env
```

Configure your environment variables:

**apps/api/.env:**
```env
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fantasy_red_zone?schema=public"
NEXTAUTH_SECRET="your-strong-nextauth-secret-change-in-production"
ADMIN_EMAIL="your-email@example.com"
NODE_ENV="development"
SLEEPER_API_URL="https://api.sleeper.app/v1"
```

**IMPORTANT**: 
- `NEXTAUTH_SECRET` must match the web app's `NEXTAUTH_SECRET` (used for JWT verification)
- `ADMIN_EMAIL` will be promoted to admin role when running `pnpm db:seed`

**apps/web/.env:**
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-strong-nextauth-secret-change-in-production"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fantasy_red_zone?schema=public"
NEXT_PUBLIC_API_URL="http://localhost:4000"

# Email Configuration (for auth emails)
APP_URL="http://localhost:3000"
LOG_EMAILS="true"  # Set to false in production
EMAIL_FROM="Fantasy Red Zone <noreply@fantasybz.com>"
# SMTP_HOST="smtp.example.com"  # Uncomment and configure for production
# SMTP_PORT="587"
# SMTP_USER="your-smtp-username"
# SMTP_PASS="your-smtp-password"
```

**IMPORTANT**: 
- `NEXTAUTH_SECRET` in `apps/web/.env` MUST match `NEXTAUTH_SECRET` in `apps/api/.env`
- This shared secret is used for JWT signing and API authentication
- Generate with: `openssl rand -base64 32`

3. **Build shared package:**

```bash
cd packages/shared
pnpm build
```

4. **Set up database:**

```bash
cd apps/api
pnpm db:push      # Push schema to database
pnpm db:seed      # Seed with example data
```

5. **Run development servers:**

```bash
# From root directory
pnpm dev
```

This will start:
- Next.js frontend: http://localhost:3000
- Express API: http://localhost:4000

### Docker Setup

1. **Create .env file in root:**

```env
JWT_SECRET=your-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

2. **Start all services:**

```bash
docker-compose up -d
```

3. **Access the application:**
- Frontend: http://localhost:3000
- API: http://localhost:4000
- Health check: http://localhost:4000/health

## 🔑 Authentication

### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy Client ID and Secret to your `.env` files

### Admin User

The first user who signs in with the email matching `ADMIN_EMAIL` in your `.env` will automatically be assigned admin role. Admins can:
- Add/edit/activate/deactivate content sources
- Trigger manual content ingestion
- Manage featured items

## 📊 Database Schema

Key models:
- **User**: User accounts with roles (USER/ADMIN)
- **Source**: RSS/YouTube/Podcast feeds
- **Content**: Aggregated content items
- **FavoriteSource**: User's followed sources
- **SavedContent**: User's bookmarked content
- **Feed**: Custom user-created feeds
- **FeedSource**: Sources in custom feeds
- **FeaturedItem**: Admin-curated featured content
- **UserSleeperAccount**: Connected Sleeper accounts
- **SleeperLeague/SleeperRoster**: Synced Sleeper data

## 🎯 Features

### Core Features

1. **Content Aggregation**
   - RSS feed parsing
   - YouTube/Atom feed support
   - Podcast RSS support
   - Automatic ingestion every 30 minutes
   - Manual trigger (admin only)

2. **User Features**
   - Follow/unfollow sources
   - Save content for later
   - Personal feed from followed sources
   - Custom feeds with selected sources
   - Search and filter content

3. **Featured Content**
   - Admin-managed carousel on home page
   - Time-based scheduling (optional start/end dates)
   - Rank-based ordering

4. **Sleeper Integration**
   - Connect by username (no password/OAuth)
   - Fetch user's leagues and rosters
   - Read-only API access
   - Manual sync

### API Endpoints

#### Public
- `GET /health` - Health check
- `GET /content` - List content (with filters)
- `GET /content/:id` - Get single content
- `POST /content/:id/click` - Track click
- `GET /sources` - List sources
- `GET /featured` - Get featured items

#### Authenticated
- `GET /me/feed` - User's personalized feed
- `POST /me/favorites/sources/:id` - Follow source
- `DELETE /me/favorites/sources/:id` - Unfollow source
- `GET /me/favorites/sources` - List followed sources
- `POST /me/saved/:id` - Save content
- `DELETE /me/saved/:id` - Unsave content
- `GET /me/saved` - List saved content
- `POST /feeds` - Create custom feed
- `GET /feeds` - List custom feeds
- `POST /feeds/:id/sources/:sourceId` - Add source to feed
- `DELETE /feeds/:id/sources/:sourceId` - Remove source from feed
- `GET /feeds/:id/content` - Get feed content
- `GET /integrations/sleeper/status` - Sleeper connection status
- `POST /integrations/sleeper/connect` - Connect Sleeper account
- `DELETE /integrations/sleeper/disconnect` - Disconnect Sleeper
- `POST /integrations/sleeper/sync` - Sync leagues/rosters

#### Admin Only
- `POST /sources` - Create source
- `PATCH /sources/:id` - Update source
- `POST /ingest/run` - Trigger ingestion
- `POST /featured` - Create featured item
- `PATCH /featured/:id` - Update featured item
- `DELETE /featured/:id` - Delete featured item

## 📝 Content Ingestion

Content ingestion runs automatically every 30 minutes via cron. It:

1. Fetches all active sources
2. Parses RSS/Atom feeds
3. Normalizes content (title, description, URL, thumbnail, etc.)
4. Upserts by canonical URL (prevents duplicates)
5. Updates source's last fetched timestamp

### Manual Trigger (Admin)

```bash
curl -X POST http://localhost:4000/ingest/run \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔌 Sleeper Integration

Connect fantasy league data from Sleeper:

1. **User enters Sleeper username** (no password needed)
2. **Backend calls Sleeper API** to verify and get user ID
3. **Stores connection** in database
4. **Optional sync** fetches leagues and rosters for current season
5. **Future enhancement**: Display player news based on user's rosters

### Sleeper API Endpoints Used

- `GET /user/:username` - Get user by username
- `GET /user/:userId/leagues/nfl/:season` - Get user's leagues
- `GET /league/:leagueId/rosters` - Get league rosters

No authentication required (read-only public data).

## 🧪 Testing

### API Health Check

```bash
curl http://localhost:4000/health
```

### Test Content Retrieval

```bash
curl http://localhost:4000/content
```

### Test Authentication Flow

1. Visit http://localhost:3000
2. Click "Sign In"
3. Authenticate with Google
4. You should be redirected back with session

## 🚢 Deployment

For production deployment instructions, see **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)**.

### Quick Production Checklist

- [ ] Set strong `NEXTAUTH_SECRET` (used for JWT signing and API auth)
- [ ] Configure production `DATABASE_URL`
- [ ] Set up Google OAuth with production callback URL
- [ ] Configure `NEXTAUTH_URL` and `APP_URL` to production domain
- [ ] Set `ADMIN_EMAIL` to actual admin email
- [ ] Review and configure CORS settings in API
- [ ] Set up database backups
- [ ] Enable HTTPS (automatic on Render/Vercel)
- [ ] Set up monitoring and logging
- [ ] **IMPORTANT**: Replace in-memory rate limiter with Redis-based solution for multi-instance deployments

### ⚠️ Rate Limiting - Production Warning

**CRITICAL**: The current implementation uses an **in-memory rate limiter** (`apps/web/src/lib/auth/rate-limit.ts`) which is **NOT suitable for production environments with multiple instances**.

**Why this matters:**
- Each app instance has its own memory
- Rate limits are NOT shared across instances
- An attacker could bypass limits by hitting different instances
- Example: 10 requests/IP limit becomes 10 requests × number of instances

**For production, you MUST:**
1. Replace the in-memory rate limiter with a Redis-based solution (e.g., `rate-limit-redis`, `ioredis` + custom implementation)
2. Shared Redis instance ensures rate limits work across all app instances
3. Update `apps/web/src/lib/auth/rate-limit.ts` to use Redis backend
4. Configure Redis connection via environment variable

**Current rate limits:**
- Sign-up: 3 attempts per 15 minutes per IP
- Login: 10 attempts per 15 minutes per IP
- Forgot password: 3 attempts per 15 minutes per IP
- Resend verification: 3 attempts per 15 minutes per IP

**Additional auth protections:**
- Account lockout: 8 failed login attempts → 15 minute lock (stored in database, multi-instance safe)
- All rate-limited endpoints also check database lockout status

### Environment Variables

Make sure these match between API and Web:
- `JWT_SECRET` - Must be identical for token verification
- `DATABASE_URL` - Both need access to same database

## 📚 Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **NextAuth.js**: Authentication with Google OAuth
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type safety
- **Axios**: HTTP client

### Backend
- **Express**: Node.js web framework
- **Prisma**: Type-safe ORM
- **PostgreSQL**: Relational database
- **JWT**: Token-based auth
- **rss-parser**: RSS/Atom feed parsing
- **node-cron**: Scheduled jobs
- **Zod**: Schema validation

### Shared
- **TypeScript**: Shared types
- **Zod**: Validation schemas

## 🔧 Common Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run development mode
pnpm dev

# Database commands
pnpm db:push      # Push schema to database
pnpm db:migrate   # Create migration
pnpm db:seed      # Seed database

# Lint
pnpm lint
```

## 🐛 Troubleshooting

### Database Connection Issues

If you see `ECONNREFUSED` errors:
1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in `.env` files
3. Verify database credentials

### Prisma Client Issues

If you see "Prisma Client not generated":
```bash
cd apps/api
pnpm db:generate
```

### CORS Errors

If frontend can't reach API:
1. Check `NEXT_PUBLIC_API_URL` in web `.env`
2. Ensure API is running on correct port
3. Verify CORS configuration in API

### Auth Errors

If authentication fails:
1. Verify Google OAuth credentials
2. Check `NEXTAUTH_URL` matches your domain
3. Ensure `JWT_SECRET` matches between API and Web
4. Clear browser cookies and try again

## 📄 License

MIT

## 🤝 Contributing

This is a production-ready starter. Feel free to fork and customize for your needs!

## 📧 Support

For issues or questions, please open a GitHub issue.
