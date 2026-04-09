require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🗑️ Clearing database...');

  try {
    // Delete in order of dependencies (children first)
    await prisma.videoProgress.deleteMany({});
    console.log('✅ Cleared video_progress');

    await prisma.quizAttempt.deleteMany({});
    console.log('✅ Cleared quiz_attempts');

    await prisma.question.deleteMany({});
    console.log('✅ Cleared questions');

    await prisma.quiz.deleteMany({});
    console.log('✅ Cleared quizzes');

    await prisma.completionCertificate.deleteMany({});
    console.log('✅ Cleared completion_certificates');

    await prisma.video.deleteMany({});
    console.log('✅ Cleared videos');

    await prisma.enrollment.deleteMany({});
    console.log('✅ Cleared enrollments');

    await prisma.course.deleteMany({});
    console.log('✅ Cleared courses');

    await prisma.verificationToken.deleteMany({});
    console.log('✅ Cleared verificationtokens');

    await prisma.passwordResetToken.deleteMany({});
    console.log('✅ Cleared passwordresettokens');

    await prisma.session.deleteMany({});
    console.log('✅ Cleared sessions');

    await prisma.account.deleteMany({});
    console.log('✅ Cleared accounts');

    await prisma.user.deleteMany({});
    console.log('✅ Cleared users');

    console.log('\n✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
