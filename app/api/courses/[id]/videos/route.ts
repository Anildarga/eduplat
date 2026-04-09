import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/courses/[id]/videos - List all videos for a course (public)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const videos = await prisma.video.findMany({
      where: { courseId: id },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json({ success: true, data: videos });
  } catch (error) {
    console.error('[courses/[id]/videos GET]', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[id]/videos - Add a new video to a course (instructor/admin only)
export async function POST(
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

    if (!['INSTRUCTOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Requires instructor or admin role' },
        { status: 403 }
      );
    }

    const { id: courseId } = await params;
    const { title, description, url, thumbnail, duration } = await req.json();

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!url || typeof url !== 'string' || url.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Video URL is required' },
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
        { success: false, error: 'Forbidden: You can only add videos to your own courses' },
        { status: 403 }
      );
    }

    // Get current video count to set order
    const videoCount = await prisma.video.count({
      where: { courseId },
    });

    const video = await prisma.video.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        url: url.trim(),
        thumbnail: thumbnail?.trim() || null,
        duration: duration ? Number(duration) : null,
        order: videoCount + 1,
        courseId,
      },
    });

    return NextResponse.json(
      { success: true, data: video },
      { status: 201 }
    );
  } catch (error) {
    console.error('[courses/[id]/videos POST]', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
