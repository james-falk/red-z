import Parser from 'rss-parser';

const parser = new Parser();

const feedsToTest = [
  { url: 'https://www.thefantasyfootballers.com/feed/podcast', name: 'The Fantasy Footballers Podcast' },
  { url: 'https://rotoviz.com/feed/podcast/', name: 'RotoViz Podcast' },
  { url: 'https://www.pff.com/feed', name: 'Pro Football Focus' },
  { url: 'https://fantasyfootballanalytics.net/feed', name: 'Fantasy Football Analytics' },
  { url: 'https://walterfootball.com/rss.xml', name: 'Walter Football' },
  { url: 'https://www.fftoday.com/rss/news.xml', name: 'FFToday News' },
  { url: 'https://dynastyleaguefootball.com/feed/', name: 'Dynasty League Football' },
  { url: 'https://www.dynastynerds.com/feed/', name: 'Dynasty Nerds' },
  { url: 'https://www.rotoviz.com/feed/', name: 'RotoViz' },
  { url: 'https://www.playerprofiler.com/feed/', name: 'Player Profiler' },
  { url: 'https://apexfantasyleagues.com/feed/', name: 'Apex Fantasy Leagues' },
  { url: 'https://dynastyfootballfactory.com/feed/', name: 'Dynasty Football Factory' },
  { url: 'https://thefantasyfootballcounselor.com/category/fantasy-football-101/feed/', name: 'Fantasy Football Counselor' },
  { url: 'https://uthdynasty.com/feed/', name: 'UTH Dynasty' },
  { url: 'https://feeds.feedburner.com/theIdpGuru', name: 'The IDP Guru' },
  { url: 'http://fantasyfootballguidebook.blogspot.com/feeds/posts/default?alt=rss', name: 'Fantasy Football Guidebook' },
  { url: 'https://dynastytradecalculator.com/feed/', name: 'Dynasty Trade Calculator' },
  { url: 'https://www.cheatsheetwarroom.com/blog/feed', name: 'Cheat Sheet War Room' },
  { url: 'http://thefootballgirl.com/fantasy/feed/', name: 'The Football Girl' },
  { url: 'https://getsportsinfo.com/feed/', name: 'Get Sports Info' },
  { url: 'http://fantasy-fools.blogspot.com/feeds/posts/default?alt=rss', name: 'Fantasy Fools' },
  { url: 'https://fantasyknuckleheads.com/feed/', name: 'Fantasy Knuckleheads' },
  { url: 'https://www.rotowire.com/football/articles/', name: 'RotoWire Football Articles' }
];

async function testFeed(feedUrl: string, name: string) {
  try {
    console.log(`\n🔍 Testing: ${name}`);
    console.log(`   URL: ${feedUrl}`);
    
    const feed = await parser.parseURL(feedUrl);
    
    console.log(`✅ SUCCESS!`);
    console.log(`   Feed Title: ${feed.title}`);
    console.log(`   Items Found: ${feed.items?.length || 0}`);
    if (feed.items && feed.items.length > 0) {
      console.log(`   Latest: ${feed.items[0].title?.substring(0, 80)}...`);
    }
    
    return { 
      success: true, 
      url: feedUrl, 
      name, 
      feedTitle: feed.title, 
      itemCount: feed.items?.length || 0,
      latestItem: feed.items?.[0]?.title || 'N/A'
    };
  } catch (error: any) {
    console.log(`❌ FAILED`);
    console.log(`   Error: ${error.message}`);
    return { success: false, url: feedUrl, name, error: error.message };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📡 RSS FEED VALIDATOR');
  console.log(`Testing ${feedsToTest.length} feeds...`);
  console.log('═══════════════════════════════════════════════════════');
  
  const results = [];
  
  for (const feed of feedsToTest) {
    const result = await testFeed(feed.url, feed.name);
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  
  const working = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Working: ${working.length}/${results.length}`);
  working.forEach(r => {
    console.log(`   • ${r.name}`);
    console.log(`     ${r.url}`);
    console.log(`     Feed: ${r.feedTitle} (${r.itemCount} items)\n`);
  });
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => {
      console.log(`   • ${r.name}`);
      console.log(`     ${r.url}`);
      console.log(`     Error: ${r.error}\n`);
    });
  }
  
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Output for easy seed file addition
  console.log('📝 SEED FILE FORMAT (for working feeds):');
  console.log('═══════════════════════════════════════════════════════\n');
  working.forEach(r => {
    console.log(`    {`);
    console.log(`      name: '${r.name}',`);
    console.log(`      type: SourceType.RSS,`);
    console.log(`      feedUrl: '${r.url}',`);
    console.log(`      websiteUrl: '${new URL(r.url).origin}',`);
    console.log(`      description: '${r.feedTitle}',`);
    console.log(`      isActive: true`);
    console.log(`    },`);
  });
}

main();
