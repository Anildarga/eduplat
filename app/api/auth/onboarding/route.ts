import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { role } = await req.json();

    if (!role || !['STUDENT', 'INSTRUCTOR'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be STUDENT or INSTRUCTOR' },
        { status: 400 }
      );
    }

    // Update user role and mark onboarding as completed
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role,
        onboardingCompleted: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('[onboarding]', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
