import prisma from './db/client';
import { SourceType, ContentType } from '@fantasy-red-zone/shared';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create admin user if ADMIN_EMAIL is set
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'ADMIN' },
      create: {
        email: adminEmail,
        name: 'Admin User',
        role: 'ADMIN'
      }
    });
    console.log(`✅ Admin user created/updated: ${adminUser.email}`);
  }

  // Create example sources
  const sources = [
    {
      name: 'ESPN Fantasy Focus',
      type: SourceType.PODCAST,
      feedUrl: 'https://www.espn.com/espnradio/feeds/rss/podcast.xml?id=2942325',
      websiteUrl: 'https://www.espn.com/fantasy/football/',
      description: 'Fantasy football analysis and insights from ESPN experts'
    },
    {
      name: 'Fantasy Football Today',
      type: SourceType.PODCAST,
      feedUrl: 'https://www.cbssports.com/fantasy/football/podcast/rss',
      websiteUrl: 'https://www.cbssports.com/fantasy/football/',
      description: 'Daily fantasy football podcast from CBS Sports'
    },
    {
      name: 'FantasyPros - Fantasy Football',
      type: SourceType.RSS,
      feedUrl: 'https://www.fantasypros.com/rss/nfl-news.xml',
      websiteUrl: 'https://www.fantasypros.com/',
      description: 'Latest fantasy football news and analysis'
    },
    {
      name: 'Rotoworld Fantasy Football',
      type: SourceType.RSS,
      feedUrl: 'https://www.nbcsports.com/feed/rss/fantasy-football',
      websiteUrl: 'https://www.nbcsports.com/fantasy/football',
      description: 'Fantasy football news, rankings and projections'
    },
    {
      name: 'The Fantasy Footballers',
      type: SourceType.PODCAST,
      feedUrl: 'https://feeds.megaphone.fm/fantasy-footballers-podcast',
      websiteUrl: 'https://www.thefantasyfootballers.com/',
      description: 'Award-winning fantasy football podcast'
    }
  ];

  for (const sourceData of sources) {
    await prisma.source.upsert({
      where: { feedUrl: sourceData.feedUrl },
      update: {},
      create: sourceData
    });
  }

  console.log(`✅ Created ${sources.length} example sources`);

  // Create some example content
  const exampleContent = [
    {
      title: 'Week 1 Fantasy Football Rankings',
      description: 'Get ready for the season with our comprehensive Week 1 rankings',
      canonicalUrl: 'https://example.com/week-1-rankings',
      type: ContentType.ARTICLE,
      publishedAt: new Date(),
      sourceId: (await prisma.source.findFirst({ where: { name: 'FantasyPros - Fantasy Football' } }))!.id
    },
    {
      title: 'Top 10 Sleepers for 2024',
      description: 'Discover the hidden gems that could win you your fantasy league',
      canonicalUrl: 'https://example.com/top-10-sleepers',
      thumbnailUrl: 'https://via.placeholder.com/400x300',
      type: ContentType.ARTICLE,
      publishedAt: new Date(Date.now() - 86400000),
      sourceId: (await prisma.source.findFirst({ where: { name: 'Rotoworld Fantasy Football' } }))!.id
    }
  ];

  for (const content of exampleContent) {
    await prisma.content.upsert({
      where: { canonicalUrl: content.canonicalUrl },
      update: {},
      create: content
    });
  }

  console.log(`✅ Created ${exampleContent.length} example content items`);
  console.log('🎉 Seeding complete!');
}

seed()
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
