import Parser from 'rss-parser';

const parser = new Parser();

const channelIds = [
  { id: 'UC7fnz7139CGSdtHWaPMCpIw', name: 'Channel 1' },
  { id: 'UCItKyZGyIYr1vJxCrL5M3Yg', name: 'Channel 2' },
  { id: 'UCviK78rIWXhZdFzJ1Woi7Fg', name: 'Channel 3' }
];

async function testYouTubeChannel(channelId: string, name: string) {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  
  try {
    console.log(`\n🔍 Testing: ${name} (${channelId})`);
    console.log(`   URL: ${feedUrl}`);
    
    const feed = await parser.parseURL(feedUrl);
    
    console.log(`✅ SUCCESS!`);
    console.log(`   Channel Name: ${feed.title}`);
    console.log(`   Description: ${feed.description || 'N/A'}`);
    console.log(`   Videos Found: ${feed.items?.length || 0}`);
    if (feed.items && feed.items.length > 0) {
      console.log(`   Latest Video: ${feed.items[0].title}`);
    }
    
    return { success: true, channelId, feedUrl, channelName: feed.title, itemCount: feed.items?.length || 0 };
  } catch (error: any) {
    console.log(`❌ FAILED`);
    console.log(`   Error: ${error.message}`);
    return { success: false, channelId, feedUrl, error: error.message };
  }
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('🎬 YOUTUBE CHANNEL ID TESTER');
  console.log('═══════════════════════════════════════');
  
  const results = [];
  
  for (const channel of channelIds) {
    const result = await testYouTubeChannel(channel.id, channel.name);
    results.push(result);
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════');
  
  const working = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Working: ${working.length}/${results.length}`);
  working.forEach(r => {
    console.log(`   • ${r.channelName} (${r.itemCount} videos)`);
  });
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => {
      console.log(`   • ${r.channelId}: ${r.error}`);
    });
  }
  
  console.log('\n═══════════════════════════════════════\n');
}

main();
