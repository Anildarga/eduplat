const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    // Get counts
    const [userCount, courseCount, videoCount] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.video.count(),
    ]);

    console.log('\n📊 Current database stats:');
    console.log(`  Users: ${userCount}`);
    console.log(`  Courses: ${courseCount}`);
    console.log(`  Videos: ${videoCount}`);

    // Get a sample user
    const sampleUser = await prisma.user.findFirst({
      select: { email: true, name: true, role: true },
    });
    if (sampleUser) {
      console.log(`\n👤 Sample user: ${sampleUser.email} (${sampleUser.role})`);
    }

    // List all courses
    const courses = await prisma.course.findMany({
      select: { title: true, isPublished: true, _count: { select: { videos: true } } },
    });
    console.log('\n📚 Courses:');
    courses.forEach(c => {
      console.log(`  - ${c.title} (${c.isPublished ? '✓ Published' : '○ Draft'}) - ${c._count.videos} videos`);
    });

    await prisma.$disconnect();
    console.log('\n✅ Disconnected');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testConnection();
