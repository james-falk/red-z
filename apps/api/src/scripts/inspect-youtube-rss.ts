import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: [
      ['media:thumbnail', 'mediaThumbnail'],
      ['media:content', 'mediaContent'],
      ['media:group', 'mediaGroup']
    ]
  }
});

async function inspectYouTubeFeed() {
  const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCviK78rIWXhZdFzJ1Woi7Fg';
  
  console.log('🔍 YOUTUBE RSS FEED STRUCTURE');
  console.log('═══════════════════════════════════════\n');
  console.log(`Feed: ${feedUrl}\n`);
  
  const feed = await parser.parseURL(feedUrl);
  
  if (feed.items && feed.items.length > 0) {
    const item = feed.items[0];
    console.log('📹 FIRST VIDEO ITEM:');
    console.log('═══════════════════════════════════════\n');
    console.log(`Title: ${item.title}`);
    console.log(`Link: ${item.link}`);
    console.log(`PubDate: ${item.pubDate}\n`);
    
    console.log('🔎 RAW ITEM DATA:');
    console.log('═══════════════════════════════════════\n');
    console.log(JSON.stringify(item, null, 2));
  }
}

inspectYouTubeFeed();
