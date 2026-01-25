-- Email Notification Schema Migration
-- 
-- INSTRUCTIONS:
-- This migration adds email notification support to the User model
-- 
-- To apply:
-- 1. Run: pnpm --filter @fantasy-red-zone/api prisma migrate dev --name add_email_notifications
-- 2. Or manually apply this SQL to your database
-- 3. Then set ENABLE_EMAIL_NOTIFICATIONS=true in .env

-- Add email notification fields to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB DEFAULT '{
  "weeklyDigest": false,
  "playerAlerts": false,
  "frequency": "daily"
}'::jsonb;

-- Create index for querying users with notifications enabled
CREATE INDEX IF NOT EXISTS "User_emailNotificationsEnabled_idx" 
ON "User"("emailNotificationsEnabled") 
WHERE "emailNotificationsEnabled" = true;

-- Optional: Create NotificationLog table for tracking sent notifications
-- Uncomment if you want to track notification history

-- CREATE TABLE IF NOT EXISTS "NotificationLog" (
--   "id" TEXT NOT NULL PRIMARY KEY,
--   "userId" TEXT NOT NULL,
--   "type" TEXT NOT NULL, -- 'daily_digest', 'weekly_digest', 'player_alert', 'new_content'
--   "status" TEXT NOT NULL, -- 'sent', 'failed', 'pending'
--   "metadata" JSONB,
--   "sentAt" TIMESTAMP(3),
--   "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   
--   CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
-- );

-- CREATE INDEX IF NOT EXISTS "NotificationLog_userId_idx" ON "NotificationLog"("userId");
-- CREATE INDEX IF NOT EXISTS "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");
