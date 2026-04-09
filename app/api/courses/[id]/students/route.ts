import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/courses/[id]/students - List all students enrolled in a course
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: courseId } = await params;

    // Fetch course to check ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user is course instructor or admin
    const isInstructor = course.instructorId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only course instructor or admin can view students' },
        { status: 403 }
      );
    }

    // Fetch all enrollments with student info
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });

    // Map to return only needed fields
    const students = enrollments.map((enrollment) => ({
      id: enrollment.user.id,
      name: enrollment.user.name,
      email: enrollment.user.email,
      image: enrollment.user.image,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
    }));

    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    console.error('[courses/[id]/students GET]', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
