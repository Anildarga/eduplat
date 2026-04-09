import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateVerificationToken } from '@/lib/tokens';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      new URL('/verify-email?error=missing', req.url)
    );
  }

  const result = await validateVerificationToken(token);

  if (!result.valid) {
    const error = result.expired ? 'expired' : 'invalid';
    return NextResponse.redirect(
      new URL(`/verify-email?error=${error}`, req.url)
    );
  }

  // Update user as verified (both fields)
  await prisma.user.update({
    where: { email: result.email },
    data: {
      emailVerified: new Date(),
      isEmailVerified: true,
    }
  });

  // Delete all tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: result.email }
  });

  return NextResponse.redirect(
    new URL('/verify-email?success=true', req.url)
  );
}