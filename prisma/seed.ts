import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Check if we already have an instructor user
  let instructor = await prisma.user.findFirst({
    where: { email: 'instructor@test.com' },
  });

  if (!instructor) {
    // Create instructor user (password: "password123")
    // Note: In a real scenario, you'd hash the password. For testing, you can use bcrypt
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 12);

    instructor = await prisma.user.create({
      data: {
        email: 'instructor@test.com',
        name: 'Test Instructor',
        password: hashedPassword,
        role: 'INSTRUCTOR',
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

    // Add videos to course 1
    const videos1 = [
      {
        title: 'Getting Started with React',
        description: 'Introduction to React and setting up your first project',
        url: 'https://www.youtube.com/watch?v=dGcsHMXbSOA',
        thumbnail: 'https://example.com/video1.jpg',
        duration: 600,
        order: 1,
      },
      {
        title: 'Components and Props',
        description: 'Understanding React components and passing props',
        url: 'https://www.youtube.com/watch?v=0N7dOPfWYFM',
        thumbnail: 'https://example.com/video2.jpg',
        duration: 720,
        order: 2,
      },
      {
        title: 'State and Lifecycle',
        description: 'Managing state and component lifecycle methods',
        url: 'https://www.youtube.com/watch?v=Zeri4zmiVNU',
        thumbnail: 'https://example.com/video3.jpg',
        duration: 900,
        order: 3,
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

    // Add videos to course 2
    const videos2 = [
      {
        title: 'Generics Explained',
        description: 'Understanding and using TypeScript generics',
        url: 'https://www.youtube.com/watch?v=78-5a9M4NaI',
        thumbnail: 'https://example.com/ts-video1.jpg',
        duration: 540,
        order: 1,
      },
      {
        title: 'Utility Types',
        description: 'Built-in utility types in TypeScript',
        url: 'https://www.youtube.com/watch?v=493FacxvPzM',
        thumbnail: 'https://example.com/ts-video2.jpg',
        duration: 480,
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
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 12);

    admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        name: 'Test Admin',
        password: hashedPassword,
        role: 'ADMIN',
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
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('student123', 12);

    student = await prisma.user.create({
      data: {
        email: 'student@test.com',
        name: 'Test Student',
        password: hashedPassword,
        role: 'STUDENT',
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
