# Email Notification System (Skeleton)

This directory contains the email notification framework for Fantasy Red Zone.

## Status: SKELETON IMPLEMENTATION

The notification system is built but **not yet wired up**. All pieces are in place and ready to be activated when needed.

## Architecture

### Core Files
- **`services/notification.service.ts`**: Main notification service with methods for all notification types
- **`jobs/email-notifications.job.ts`**: Cron jobs for periodic digest emails
- **`prisma/migrations/email_notifications.sql`**: Database schema for notification preferences

### Notification Types Supported

1. **New Content Notifications**: Alert users when followed sources publish new content
2. **Daily Digest**: Summary of new content (daily at 8 AM)
3. **Weekly Digest**: Top content from the past week (Sundays at 9 AM)
4. **Player Alerts**: Urgent alerts for roster players (requires Sleeper integration + player tagging)

## How to Activate

### Step 1: Database Migration

Run the migration to add notification fields to the User table:

```bash
cd apps/api
pnpm prisma migrate dev --name add_email_notifications
```

Or manually apply `prisma/migrations/email_notifications.sql` to your database.

### Step 2: Environment Variables

Add to `apps/api/.env`:

```env
# Enable notifications
ENABLE_EMAIL_NOTIFICATIONS=true

# Email sender (requires domain verification with Resend)
EMAIL_NOTIFICATION_FROM=notifications@yourdomain.com

# Resend API key (already configured for verification emails)
RESEND_API_KEY=re_your_key_here
```

**Note**: Resend free tier can only send FROM `onboarding@resend.dev` TO your verified email. For production, you need:
- Custom domain verification
- Paid plan (for sending to any email address)

### Step 3: Enable Cron Jobs

Uncomment in `apps/api/src/cron.ts`:

```typescript
import { startEmailNotificationJobs } from './jobs/email-notifications.job';

// In the cron initialization
if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
  startEmailNotificationJobs();
}
```

### Step 4: Wire Up Triggers

The service methods are ready but not called. Add triggers:

**New Content Notification** (in `services/ingestion.service.ts`):
```typescript
// After content is ingested, notify followers
const followers = await prisma.favoriteSource.findMany({
  where: { sourceId: content.sourceId },
  select: { userId: true }
});

for (const follower of followers) {
  await notificationService.sendNewContentNotification(
    follower.userId, 
    [content.id]
  );
}
```

**Player Alerts** (requires player tagging system):
```typescript
// When content with player tags is ingested
// Match against users' Sleeper rosters
// Send alerts via notificationService.sendPlayerAlert()
```

## Database Schema

The migration adds these fields to the `User` table:

```sql
emailNotificationsEnabled: boolean (default: false)
notificationPreferences: jsonb {
  weeklyDigest: boolean,
  playerAlerts: boolean,
  frequency: "daily" | "realtime" | "weekly"
}
```

## User Interface

The profile page already shows notification settings with "Coming Soon" labels. Once activated:

1. Users can toggle notifications on/off
2. Choose notification types (daily/weekly digest, player alerts)
3. Set frequency preferences

## Testing Locally

1. Set `ENABLE_EMAIL_NOTIFICATIONS=true`
2. Set `EMAIL_NOTIFICATION_FROM=onboarding@resend.dev`
3. Ensure `RESEND_API_KEY` is set
4. Run migrations
5. In profile, enable notifications for your test user
6. Trigger notifications manually:

```typescript
import { notificationService } from './services/notification.service';

// Test daily digest
await notificationService.sendWeeklyDigest('user-id-here');
```

## Rate Limits

Resend API limits:
- **Free tier**: 100 emails/day, 1 email/second
- **Paid tier**: Higher limits, batch sending

Implement rate limiting in `NotificationService.sendBatchNotifications()` before going to production.

## Future Enhancements

- [ ] Batch API for efficient sending
- [ ] Email templates with branding
- [ ] Unsubscribe links
- [ ] Notification preferences API endpoint
- [ ] In-app notification center
- [ ] Push notifications (web push API)
- [ ] SMS alerts (via Twilio)

## Security Notes

- Email verification already implemented (using Resend)
- All notification emails should include unsubscribe links
- Respect user preferences (check `emailNotificationsEnabled`)
- Never send to unverified email addresses
- Log all sent notifications for audit trail

## Cost Considerations

**Resend Pricing** (as of 2024):
- Free: 3,000 emails/month, 100/day
- Paid: $20/month for 50,000 emails

**Estimated Usage**:
- 1,000 active users
- Daily digest enabled for 50%
- Weekly digest enabled for 30%
- **Total**: ~400 emails/day = 12,000/month

Recommendation: Start with free tier, upgrade when hitting limits.
