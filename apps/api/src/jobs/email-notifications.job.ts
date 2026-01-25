/**
 * Email Notifications Cron Job
 * 
 * SKELETON IMPLEMENTATION - Not enabled by default
 * 
 * This job handles periodic email notifications:
 * - Daily digest: New content from followed sources
 * - Weekly digest: Top content summary
 * 
 * To enable:
 * 1. Set ENABLE_EMAIL_NOTIFICATIONS=true in .env
 * 2. Uncomment the cron schedule in src/cron.ts
 * 3. Ensure database migration is run (User notification fields)
 */

import cron from 'node-cron';
import prisma from '../db/client';
import { notificationService } from '../services/notification.service';

// Track if job is running (prevent overlaps)
let isRunning = false;

/**
 * Daily Digest Job
 * Runs every day at 8 AM
 * Sends digest of new content from followed sources
 */
export const dailyDigestJob = cron.schedule(
  '0 8 * * *', // 8 AM daily
  async () => {
    if (isRunning) {
      console.log('[EmailJob] Daily digest already running, skipping');
      return;
    }

    const enabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';
    if (!enabled) {
      console.log('[EmailJob] Email notifications disabled, skipping daily digest');
      return;
    }

    isRunning = true;
    console.log('[EmailJob] Starting daily digest job...');

    try {
      // TODO: Implement when ready
      
      // 1. Find all users with emailNotificationsEnabled = true
      const users = await prisma.user.findMany({
        where: {
          // emailNotificationsEnabled: true, // Add this field in migration
        },
        select: {
          id: true,
          email: true,
        },
      });

      console.log(`[EmailJob] Found ${users.length} users with notifications enabled`);

      // 2. For each user, find new content from followed sources (last 24 hours)
      // 3. Group content by source
      // 4. Send digest email via notificationService
      
      // TODO: Implement batching and rate limiting
      
      console.log('[EmailJob] ✅ Daily digest complete');
    } catch (error) {
      console.error('[EmailJob] ❌ Daily digest failed:', error);
    } finally {
      isRunning = false;
    }
  },
  {
    scheduled: false, // Not scheduled by default - must be started manually
  }
);

/**
 * Weekly Digest Job
 * Runs every Sunday at 9 AM
 * Sends weekly summary of top content
 */
export const weeklyDigestJob = cron.schedule(
  '0 9 * * 0', // 9 AM on Sundays
  async () => {
    if (isRunning) {
      console.log('[EmailJob] Weekly digest already running, skipping');
      return;
    }

    const enabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';
    if (!enabled) {
      console.log('[EmailJob] Email notifications disabled, skipping weekly digest');
      return;
    }

    isRunning = true;
    console.log('[EmailJob] Starting weekly digest job...');

    try {
      // TODO: Implement when ready
      
      // 1. Find all users who want weekly digest
      const users = await prisma.user.findMany({
        where: {
          // emailNotificationsEnabled: true,
          // notificationPreferences path weeklyDigest = true
        },
        select: {
          id: true,
          email: true,
        },
      });

      console.log(`[EmailJob] Found ${users.length} users for weekly digest`);

      // 2. For each user, find top content from last 7 days
      // 3. Rank by clicks, recency, and relevance
      // 4. Generate weekly summary email
      // 5. Send via notificationService
      
      console.log('[EmailJob] ✅ Weekly digest complete');
    } catch (error) {
      console.error('[EmailJob] ❌ Weekly digest failed:', error);
    } finally {
      isRunning = false;
    }
  },
  {
    scheduled: false, // Not scheduled by default
  }
);

/**
 * Start email notification jobs
 * Call this from src/cron.ts when ENABLE_EMAIL_NOTIFICATIONS=true
 */
export function startEmailNotificationJobs() {
  const enabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';
  
  if (!enabled) {
    console.log('[EmailJob] Email notifications DISABLED - Jobs will not start');
    console.log('[EmailJob] Set ENABLE_EMAIL_NOTIFICATIONS=true to enable');
    return;
  }

  console.log('[EmailJob] Starting email notification cron jobs...');
  dailyDigestJob.start();
  weeklyDigestJob.start();
  console.log('[EmailJob] ✅ Email notification jobs started');
}

/**
 * Stop email notification jobs
 */
export function stopEmailNotificationJobs() {
  dailyDigestJob.stop();
  weeklyDigestJob.stop();
  console.log('[EmailJob] Email notification jobs stopped');
}
