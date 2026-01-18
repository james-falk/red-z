# Setup Instructions

Follow these steps to get the Fantasy Red Zone monorepo running:

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Build Shared Package

```bash
cd packages/shared
pnpm build
cd ../..
```

## 3. Set Up Environment Variables

### API Environment (.env)
Create `apps/api/.env`:
```env
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fantasy_red_zone?schema=public"
JWT_SECRET="your-jwt-secret-change-in-production"
ADMIN_EMAIL="your-email@example.com"
NODE_ENV="development"
SLEEPER_API_URL="https://api.sleeper.app/v1"
```

### Web Environment (.env)
Create `apps/web/.env`:
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-change-in-production"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fantasy_red_zone?schema=public"
NEXT_PUBLIC_API_URL="http://localhost:4000"
JWT_SECRET="your-jwt-secret-change-in-production"
```

**Important**: The `JWT_SECRET` must be identical in both `.env` files!

## 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure consent screen if needed
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `apps/web/.env` file

## 5. Start PostgreSQL

Using Docker:
```bash
docker run -d \
  --name fantasy-red-zone-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=fantasy_red_zone \
  -p 5432:5432 \
  postgres:15-alpine
```

Or use your local PostgreSQL installation.

## 6. Initialize Database

```bash
cd apps/api
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:seed      # Seed with example data
cd ../..
```

## 7. Run Development Servers

From the root directory:
```bash
pnpm dev
```

This starts:
- **Next.js frontend**: http://localhost:3000
- **Express API**: http://localhost:4000

## 8. Test the Application

1. Visit http://localhost:3000
2. Click "Sign In" and authenticate with Google
3. Browse the global feed on the home page
4. Follow sources from the "Sources" page
5. View "My Feed" to see content from followed sources
6. Save content and view it in the "Saved" page
7. Create custom feeds in the "Feeds" page
8. Connect your Sleeper account in the "Profile" page

## Verify API Health

```bash
curl http://localhost:4000/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

## Common Issues

### "Prisma Client not generated"
Run: `cd apps/api && pnpm db:generate`

### Database connection errors
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in both `.env` files
- Verify credentials match your PostgreSQL setup

### CORS errors
- Verify `NEXT_PUBLIC_API_URL` in `apps/web/.env`
- Ensure API is running on port 4000

### Auth errors
- Double-check Google OAuth credentials
- Ensure `JWT_SECRET` matches in both `.env` files
- Clear browser cookies and try again

## Docker Setup (Alternative)

If you prefer Docker Compose:

1. Create `.env` in root directory with all required variables
2. Run: `docker-compose up -d`
3. Access at http://localhost:3000

## Admin Access

The user who signs in with the email matching `ADMIN_EMAIL` will automatically receive admin privileges and can:
- Add/edit sources
- Trigger manual content ingestion
- Manage featured items

## Next Steps

- Customize the seed data in `apps/api/src/db/seed.ts`
- Add your own RSS/YouTube feeds via the Sources page (as admin)
- Trigger content ingestion via: `POST http://localhost:4000/ingest/run` (with JWT token)
- The cron job will automatically fetch new content every 30 minutes

Enjoy using Fantasy Red Zone! 🏈
