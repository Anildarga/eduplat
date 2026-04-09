import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Helper function to check if user can manage quiz
async function canManageQuiz(courseId: string, userId: string, userRole: string): Promise<boolean> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) return false;

  const isOwner = course.instructorId === userId;
  const isAdmin = userRole === 'ADMIN';

  return isOwner || isAdmin;
}

// POST /api/quizzes - Create quiz
export async function POST(req: NextRequest) {
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

    const { title, description, courseId } = await req.json();

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Check if user can manage this course's quizzes
    const canManage = await canManageQuiz(courseId, session.user.id, session.user.role);
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You can only create quizzes in your own courses' },
        { status: 403 }
      );
    }

    // Create quiz
    const quiz = await prisma.quiz.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        courseId,
      },
    });

    return NextResponse.json(
      { success: true, data: quiz },
      { status: 201 }
    );
  } catch (error) {
    console.error('[quizzes POST]', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
