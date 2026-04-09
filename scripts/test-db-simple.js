const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const count = await prisma.course.count();
    console.log('Total courses:', count);
    const courses = await prisma.course.findMany({
      take: 2,
      include: {
        videos: { take: 2 }
      }
    });
    console.log('Courses:', JSON.stringify(courses, null, 2));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
