import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { calculateCourseProgress } from '@/lib/progress-calculator';

// GET /api/enrollments - Get all enrollments for the logged-in student
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch enrollments for the current user
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            videos: {
              select: {
                id: true,
              },
            },
            _count: {
              select: {
                videos: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });

    // Add progress percentage to each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await calculateCourseProgress(
          session.user.id,
          enrollment.courseId
        );

        return {
          ...enrollment,
          progressPercent: progress.percentComplete,
        };
      })
    );

    return NextResponse.json({ success: true, data: enrollmentsWithProgress });
  } catch (error) {
    console.error('[enrollments GET]', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
