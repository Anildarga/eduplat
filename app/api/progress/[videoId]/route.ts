import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET — fetch saved progress for a video
// POST — save progress for a video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { videoId } = await params;

    // Find progress record
    const progress = await prisma.videoProgress.findUnique({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId: videoId,
        },
      },
    });

    // Return progress or default zeros
    return NextResponse.json({
      success: true,
      data: {
        watchedSeconds: progress?.watchedSeconds ?? 0,
        completed: progress?.completed ?? false,
      },
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { videoId } = await params;
    const body = await request.json();

    const { watchedSeconds, completed } = body;

    // Validate watchedSeconds
    if (typeof watchedSeconds !== 'number' || watchedSeconds < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid watchedSeconds' },
        { status: 400 }
      );
    }

    // Get video duration for auto-completion check
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { duration: true },
    });

    // Determine if completed
    let isCompleted = completed ?? false;
    if (video?.duration) {
      // Only apply 90% rule if completed is not explicitly set to true
      if (!isCompleted) {
        isCompleted = watchedSeconds >= video.duration * 0.9;
      }
    }

    // Upsert progress record
    const progress = await prisma.videoProgress.upsert({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId: videoId,
        },
      },
      update: {
        watchedSeconds,
        completed: isCompleted,
      },
      create: {
        userId: session.user.id,
        videoId: videoId,
        watchedSeconds,
        completed: isCompleted,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        watchedSeconds: progress.watchedSeconds,
        completed: progress.completed,
      },
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
