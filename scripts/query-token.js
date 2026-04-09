import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testExpiredToken() {
  const email = 'test.expired.fresh@example.com';

  // Create an expired token
  const token = 'fresh.expired.token.' + Date.now();
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() - 1000), // 1 second ago
      createdAt: new Date(Date.now() - 60000) // 1 minute ago
    }
  });
  console.log('Created NEW expired token:', token, 'for', email);

  // Test the API
  console.log('\nCalling /api/auth/verify-email with expired token...');
  const res = await fetch(`http://localhost:3000/api/auth/verify-email?token=${token}`, {
    redirect: 'manual'
  });
  console.log('Response status:', res.status);
  const location = res.headers.get('location');
  console.log('Redirect location:', location);

  // Expected: /verify-email?error=expired
  if (location?.includes('error=expired')) {
    console.log('✅ Correct: Redirects to error=expired');
  } else if (location?.includes('error=invalid')) {
    console.log('❌ Wrong: Redirects to error=invalid (expected expired)');
  } else {
    console.log('⚠️ Unexpected location');
  }

  // Check that token was deleted
  const exists = await prisma.verificationToken.findUnique({
    where: { token }
  });
  console.log('Token deleted after use?', exists ? 'NO (BUG!)' : 'YES (correct)');
}

// Run tests
async function main() {
  console.log('=== Testing expired token scenario ===\n');
  await testExpiredToken();
  await prisma.$disconnect();
}

main().catch(e => console.error(e));
