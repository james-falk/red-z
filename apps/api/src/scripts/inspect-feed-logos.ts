import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    feed: ['image', 'itunes:image', 'logo'],
    item: [
      ['media:thumbnail', 'mediaThumbnail'],
      ['media:content', 'mediaContent'],
      ['media:group', 'mediaGroup']
    ]
  }
});

async function inspectFeedLogos() {
  const feeds = [
    { name: 'Pro Football Focus', url: 'https://www.pff.com/feed' },
    { name: 'RotoWire', url: 'https://www.rotowire.com/rss/news.php?sport=NFL' },
    { name: 'Player Profiler', url: 'https://www.playerprofiler.com/feed/' },
    { name: 'Walter Football', url: 'https://walterfootball.com/rss.xml' },
    { name: 'Dynasty Nerds', url: 'https://www.dynastynerds.com/feed/' },
    { name: 'Fantasy Football Today (YouTube)', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCviK78rIWXhZdFzJ1Woi7Fg' }
  ];

  console.log('🔍 FEED-LEVEL LOGO/IMAGE ANALYSIS');
  console.log('═══════════════════════════════════════\n');

  for (const feedInfo of feeds) {
    try {
      console.log(`📡 ${feedInfo.name}`);
      console.log(`   URL: ${feedInfo.url}`);
      
      const feed = await parser.parseURL(feedInfo.url);
      
      // Check various image fields
      console.log(`   Feed Title: ${feed.title}`);
      console.log(`   Feed Description: ${feed.description?.substring(0, 60)}...`);
      console.log(`   Feed Link: ${feed.link}`);
      
      // Standard RSS image
      if (feed.image) {
        console.log(`   ✅ RSS Image: ${JSON.stringify(feed.image)}`);
      } else {
        console.log(`   ❌ No RSS image field`);
      }
      
      // iTunes image (podcasts)
      if ((feed as any)['itunes:image']) {
        console.log(`   ✅ iTunes Image: ${(feed as any)['itunes:image']}`);
      }
      
      // Logo field
      if ((feed as any).logo) {
        console.log(`   ✅ Logo: ${(feed as any).logo}`);
      }
      
      // Check first item for images too
      if (feed.items && feed.items.length > 0) {
        const item = feed.items[0];
        if ((item as any).enclosure?.type?.startsWith('image/')) {
          console.log(`   📷 First item has image enclosure: ${(item as any).enclosure.url.substring(0, 60)}...`);
        }
        if ((item as any).content?.includes('<img')) {
          const imgMatch = (item as any).content.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch) {
            console.log(`   📷 First item has HTML image: ${imgMatch[1].substring(0, 60)}...`);
          }
        }
      }
      
      console.log('');
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('═══════════════════════════════════════');
  console.log('💡 RECOMMENDATION:');
  console.log('═══════════════════════════════════════');
  console.log('Most RSS feeds DO NOT provide feed-level logos.');
  console.log('Best approach: Extract from favicon or use source website URL');
  console.log('  - https://www.google.com/s2/favicons?domain=pff.com&sz=128');
  console.log('  - https://favicon.io/ services');
  console.log('  - Or scrape from website <link rel="icon">');
}

inspectFeedLogos();
