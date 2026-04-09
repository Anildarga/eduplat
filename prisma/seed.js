const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Check if we already have an instructor user
  let instructor = await prisma.user.findFirst({
    where: { email: 'instructor@test.com' },
  });

  if (!instructor) {
    const hashedPassword = await bcrypt.hash('password123', 12);

    instructor = await prisma.user.create({
      data: {
        email: 'instructor@test.com',
        name: 'Test Instructor',
        password: hashedPassword,
        role: 'INSTRUCTOR',
        onboardingCompleted: true,
      },
    });
    console.log('✅ Created instructor user:', instructor.email);
  } else {
    console.log('✅ Instructor user exists:', instructor.email);
  }

  // Check if course already exists
  let course1 = await prisma.course.findFirst({
    where: { title: 'Introduction to React' },
  });

  if (!course1) {
    course1 = await prisma.course.create({
      data: {
        title: 'Introduction to React',
        description: 'Learn the fundamentals of React.js including components, hooks, and state management.',
        thumbnail: 'https://example.com/react-thumbnail.jpg',
        instructorId: instructor.id,
        isPublished: true,
      },
    });
    console.log('✅ Created course 1:', course1.title);

    // Add videos to course 1 (Introduction to React)
    const videos1 = [
      {
        title: 'Big Buck Bunny',
        description: 'Three rodents amuse themselves by harassing creatures of the forest. However, when they mess with a bunny, he decides to teach them a lesson.',
        url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Big.Buck.Bunny.-.Opening.Screen.png',
        duration: 600, // 10 minutes
        order: 1,
      },
      {
        title: 'Sintel',
        description: 'A lonely young woman, Sintel, helps and befriends a dragon, whom she calls Scales. But when he is kidnapped by an adult dragon, Sintel decides to embark on a dangerous quest to find her lost friend Scales.',
        url: 'https://www.youtube.com/watch?v=S9L9H1R7Sgg',
        thumbnail: 'http://uhdtv.io/wp-content/uploads/2020/10/Sintel-3.jpg',
        duration: 900, // 15 minutes
        order: 2,
      },
    ];

    for (const videoData of videos1) {
      await prisma.video.create({
        data: {
          ...videoData,
          courseId: course1.id,
        },
      });
    }
    console.log(`  → Added ${videos1.length} videos to course 1`);
  } else {
    console.log('✅ Course 1 exists:', course1.title);
  }

  // Check if course 2 exists
  let course2 = await prisma.course.findFirst({
    where: { title: 'Advanced TypeScript' },
  });

  if (!course2) {
    course2 = await prisma.course.create({
      data: {
        title: 'Advanced TypeScript',
        description: 'Deep dive into TypeScript advanced types, generics, and patterns.',
        thumbnail: 'https://example.com/typescript-thumbnail.jpg',
        instructorId: instructor.id,
        isPublished: false, // Draft course
      },
    });
    console.log('✅ Created course 2:', course2.title);

    // Add videos to course 2 (Advanced TypeScript)
    const videos2 = [
      {
        title: 'Tears of Steel',
        description: 'In an apocalyptic future, a group of soldiers and scientists takes refuge in Amsterdam to try to stop an army of robots that threatens the planet.',
        url: 'https://www.youtube.com/watch?v=tgbNymZ7vqY',
        thumbnail: 'https://mango.blender.org/wp-content/uploads/2013/05/01_thom_celia_bridge.jpg',
        duration: 720, // 12 minutes
        order: 1,
      },
      {
        title: "Elephant's Dream",
        description: 'Friends Proog and Emo journey inside the folds of a seemingly infinite Machine, exploring the dark and twisted complex of wires, gears, and cogs, until a moment of conflict negates all their assumptions.',
        url: 'https://www.youtube.com/watch?v=MIic93fihOE',
        thumbnail: 'https://download.blender.org/ED/cover.jpg',
        duration: 900, // 15 minutes
        order: 2,
      },
    ];

    for (const videoData of videos2) {
      await prisma.video.create({
        data: {
          ...videoData,
          courseId: course2.id,
        },
      });
    }
    console.log(`  → Added ${videos2.length} videos to course 2`);
  } else {
    console.log('✅ Course 2 exists:', course2.title);
  }

  // Check if admin user exists
  let admin = await prisma.user.findFirst({
    where: { email: 'admin@test.com' },
  });

  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 12);

    admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        name: 'Test Admin',
        password: hashedPassword,
        role: 'ADMIN',
        onboardingCompleted: true,
      },
    });
    console.log('✅ Created admin user:', admin.email);
  } else {
    console.log('✅ Admin user exists:', admin.email);
  }

  // Check if student user exists
  let student = await prisma.user.findFirst({
    where: { email: 'student@test.com' },
  });

  if (!student) {
    const hashedPassword = await bcrypt.hash('student123', 12);

    student = await prisma.user.create({
      data: {
        email: 'student@test.com',
        name: 'Test Student',
        password: hashedPassword,
        role: 'STUDENT',
        onboardingCompleted: true,
      },
    });
    console.log('✅ Created student user:', student.email);
  } else {
    console.log('✅ Student user exists:', student.email);
  }

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
