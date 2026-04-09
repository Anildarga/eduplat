import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CourseWithDetails } from '@/types/course';
import { Prisma } from '@prisma/client';

// GET /api/courses/my - List courses owned by the logged-in instructor/admin
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!['INSTRUCTOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Requires instructor or admin role' },
        { status: 403 }
      );
    }

    const where: Prisma.CourseWhereInput = {};

    if (session.user.role === 'INSTRUCTOR') {
      where.instructorId = session.user.id;
    }
    // ADMIN sees all courses

    const courses = await prisma.course.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        videos: true,
        quizzes: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            videos: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const typedCourses: CourseWithDetails[] = courses as CourseWithDetails[];

    return NextResponse.json({ success: true, data: typedCourses });
  } catch (error) {
    console.error('[courses/my GET]', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
