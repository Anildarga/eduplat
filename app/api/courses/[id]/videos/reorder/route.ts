import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PATCH /api/courses/[id]/videos/reorder - Reorder videos
export async function PATCH(
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
    const { videos } = await req.json();

    if (!Array.isArray(videos)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body: videos array required' },
        { status: 400 }
      );
    }

    // Fetch the course to check ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check ownership: instructor must own the course or be ADMIN
    const isOwner = course.instructorId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You can only reorder videos in your own courses' },
        { status: 403 }
      );
    }

    // Validate video IDs and orders
    const updates = videos.map((v: { id: string; order: number }) => {
      if (!v.id || typeof v.order !== 'number') {
        throw new Error('Invalid video data: each item must have id and order');
      }
      return prisma.video.update({
        where: { id: v.id },
        data: { order: v.order },
      });
    });

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: 'Videos reordered successfully',
    });
  } catch (error) {
    console.error('[courses/[id]/videos/reorder PATCH]', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
