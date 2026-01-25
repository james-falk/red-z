import prisma from '../db/client';

async function checkLogos() {
  const sources = await prisma.source.findMany({
    where: { isActive: true },
    select: {
      name: true,
      websiteUrl: true,
      logoUrl: true
    },
    orderBy: { name: 'asc' },
    take: 10
  });

  console.log('🎨 SOURCE LOGOS:');
  console.log('═══════════════════════════════════════\n');

  sources.forEach(source => {
    const icon = source.logoUrl ? '✅' : '❌';
    console.log(`${icon} ${source.name}`);
    if (source.logoUrl) {
      console.log(`   ${source.logoUrl}\n`);
    } else {
      console.log(`   No logo\n`);
    }
  });

  await prisma.$disconnect();
}

checkLogos();
