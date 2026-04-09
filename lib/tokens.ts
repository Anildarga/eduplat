import crypto from 'crypto';
import prisma from './prisma';

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createVerificationToken(
  email: string
): Promise<string> {
  const token = generateToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  // Delete any existing token for this email first
  await prisma.verificationToken.deleteMany({
    where: { identifier: email }
  });

  // Create new token
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires
    }
  });

  return token;
}

export async function createPasswordResetToken(
  email: string
): Promise<string> {
  const token = generateToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.deleteMany({
    where: { email }
  });

  await prisma.passwordResetToken.create({
    data: { email, token, expires }
  });

  return token;
}

export async function validateVerificationToken(
  token: string
): Promise<{ valid: boolean; email?: string; expired?: boolean }> {
  const record = await prisma.verificationToken.findUnique({
    where: { token }
  });

  if (!record) return { valid: false };

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { valid: false, expired: true };
  }

  return { valid: true, email: record.identifier };
}

export async function validatePasswordResetToken(
  token: string
): Promise<{ valid: boolean; email?: string; expired?: boolean }> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token }
  });

  if (!record) return { valid: false };

  if (record.expires < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token } });
    return { valid: false, expired: true };
  }

  return { valid: true, email: record.email };
}

export async function verifyAndConsumeVerificationToken(
  email: string,
  token: string
): Promise<boolean> {
  try {
    const record = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token
        }
      }
    });

    if (!record) return false;

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token
          }
        }
      });
      return false;
    }

    // Token is valid, consume it and mark user as verified
    await prisma.$transaction([
      prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token
          }
        }
      }),
      prisma.user.update({
        where: { email },
        data: {
          emailVerified: new Date(),
          isEmailVerified: true
        }
      })
    ]);

    return true;
  } catch (error) {
    console.error('Error verifying and consuming verification token:', error);
    return false;
  }
}

export async function hasValidVerificationToken(email: string): Promise<boolean> {
  try {
    const token = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        expires: {
          gt: new Date()
        }
      }
    });

    return !!token;
  } catch (error) {
    console.error('Error checking for valid verification token:', error);
    return false;
  }
}
