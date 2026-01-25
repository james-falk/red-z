/**
 * Database Reset Script
 * 
 * WARNING: This deletes ALL content and sources!
 * Use only for development or when doing a complete reset.
 * 
 * Usage: pnpm exec tsx src/scripts/reset-database.ts
 */

import prisma from '../db/client';

async function resetDatabase() {
  console.log('🔥 DATABASE RESET SCRIPT');
  console.log('========================================');
  console.log('⚠️  WARNING: This will DELETE ALL content and sources!');
  console.log('========================================\n');

  try {
    // Count before deletion
    const contentCount = await prisma.content.count();
    const sourceCount = await prisma.source.count();
    
    console.log(`📊 Current state:`);
    console.log(`   - Content items: ${contentCount}`);
    console.log(`   - Sources: ${sourceCount}\n`);

    // Delete all content (cascades to related tables)
    console.log('🗑️  Deleting all content...');
    const deletedContent = await prisma.content.deleteMany();
    console.log(`   ✅ Deleted ${deletedContent.count} content items\n`);

    // Delete all sources (cascades to FavoriteSource, FeedSource)
    console.log('🗑️  Deleting all sources...');
    const deletedSources = await prisma.source.deleteMany();
    console.log(`   ✅ Deleted ${deletedSources.count} sources\n`);

    // Verify cleanup
    const remainingContent = await prisma.content.count();
    const remainingSources = await prisma.source.count();

    console.log('========================================');
    console.log('✅ DATABASE RESET COMPLETE');
    console.log('========================================');
    console.log(`📊 Final state:`);
    console.log(`   - Content items: ${remainingContent}`);
    console.log(`   - Sources: ${remainingSources}\n`);
    console.log('🌱 Ready for fresh seed: pnpm db:seed');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ DATABASE RESET FAILED');
    console.error('========================================');
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
