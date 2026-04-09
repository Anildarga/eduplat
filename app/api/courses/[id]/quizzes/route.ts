import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/courses/[id]/quizzes - Get all quizzes for a course
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
    const session = await getServerSession(authOptions);

    // For public access, check course publication status
    if (!session) {
      // For unauthenticated users, only return published course quizzes
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { isPublished: true },
      });

      if (!course || !course.isPublished) {
        return NextResponse.json(
          { success: false, error: 'Course not found or not published' },
          { status: 404 }
        );
      }
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        courseId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        passingScore: true,
        type: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ success: true, data: quizzes });
  } catch (error) {
    console.error('[courses/[id]/quizzes GET]', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
