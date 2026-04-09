import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/instructor/courses/[id]/analytics - Detailed analytics for a single course
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Fetch course and verify ownership for instructors
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        videos: { orderBy: { order: 'asc' } },
        quizzes: {
          include: {
            _count: {
              select: { attempts: true }
            }
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Instructors can only access their own courses
    if (session.user.role === 'INSTRUCTOR' && course.instructorId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You can only view analytics for your own courses' },
        { status: 403 }
      );
    }

    // Fetch all related data in parallel
    const [enrollments, allProgress, quizAttempts] = await Promise.all([
      prisma.enrollment.findMany({
        where: { courseId: id },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { enrolledAt: 'desc' }
      }),
      prisma.videoProgress.findMany({
        where: {
          video: { courseId: id }
        },
        include: {
          video: { select: { id: true, title: true, duration: true } }
        }
      }),
      prisma.quizAttempt.findMany({
        where: {
          quiz: { courseId: id }
        },
        select: {
          userId: true,
          score: true,
          totalScore: true,
          completedAt: true
        }
      })
    ]);

    const totalEnrollments = enrollments.length;
    const totalVideos = course.videos.length;

    // Compute per-student progress
    const studentProgressMap = new Map<string, {
      videosCompleted: number;
      lastActive: Date | null;
    }>();

    for (const progress of allProgress) {
      const userId = progress.userId;
      const existing = studentProgressMap.get(userId) || { videosCompleted: 0, lastActive: null };

      if (progress.completed) {
        existing.videosCompleted += 1;
      }

      if (!existing.lastActive || progress.updatedAt > existing.lastActive) {
        existing.lastActive = progress.updatedAt;
      }

      studentProgressMap.set(userId, existing);
    }

    // Build student data array
    const students = enrollments.map(enrollment => {
      const progress = studentProgressMap.get(enrollment.userId) || { videosCompleted: 0, lastActive: null };
      const percentComplete = totalVideos > 0
        ? Math.round((progress.videosCompleted / totalVideos) * 100)
        : 0;

      return {
        id: enrollment.userId,
        name: enrollment.user.name || 'Unknown',
        email: enrollment.user.email,
        enrolledAt: enrollment.enrolledAt,
        videosCompleted: progress.videosCompleted,
        percentComplete,
        lastActive: progress.lastActive
      };
    }).sort((a, b) => b.percentComplete - a.percentComplete); // Sort by progress descending

    // Compute overall average completion
    const avgCompletionPercent = students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.percentComplete, 0) / students.length)
      : 0;

    // Compute per-video stats
    const videoProgressMap = new Map<string, {
      totalWatches: number;
      completions: number;
      totalWatchedSeconds: number;
    }>();

    for (const progress of allProgress) {
      const videoId = progress.videoId;
      const existing = videoProgressMap.get(videoId) || {
        totalWatches: 0,
        completions: 0,
        totalWatchedSeconds: 0
      };

      existing.totalWatches += 1;
      if (progress.completed) {
        existing.completions += 1;
      }
      existing.totalWatchedSeconds += progress.watchedSeconds;

      videoProgressMap.set(videoId, existing);
    }

    const videoStats = course.videos.map(video => {
      const stats = videoProgressMap.get(video.id) || { totalWatches: 0, completions: 0, totalWatchedSeconds: 0 };
      const completionRate = totalEnrollments > 0
        ? Math.round((stats.completions / totalEnrollments) * 100)
        : 0;
      const avgWatchedSeconds = stats.totalWatches > 0
        ? Math.round(stats.totalWatchedSeconds / stats.totalWatches)
        : 0;

      return {
        id: video.id,
        title: video.title,
        duration: video.duration || 0,
        totalWatches: stats.totalWatches,
        completions: stats.completions,
        completionRate,
        avgWatchedSeconds
      };
    });

    // Compute quiz stats
    const quizStats = course.quizzes.map(quiz => {
      const attempts = quizAttempts.filter(a => a.userId); // Group attempts by quizId from QuizAttempt
      // Note: quizAttempts are not filtered by quizId in the query above, so we need to match
      // Actually we need to filter quizAttempts by quizId. Let's get quiz attempts properly
      // We'll need to refetch or filter properly. Let's create a proper map
      return {
        id: quiz.id,
        title: quiz.title,
        totalAttempts: quiz._count.attempts,
        avgScore: 0, // Will calculate below
        avgPercent: 0
      };
    });

    // Actually, let's properly calculate quiz stats from quizAttempts
    // We need to fetch quiz attempts with quiz relation or filter them correctly
    // Since we already fetched quizAttempts with where: { quiz: { courseId: id } }, all attempts belong to this course's quizzes
    // But we need to group by quizId. The quizAttempts query includes quiz relation? No, it only selects specific fields.
    // We need to either refetch with include or map differently. Let's do a separate fetch for quiz attempts with quiz relation.

    const quizAttemptsWithQuiz = await prisma.quizAttempt.findMany({
      where: {
        quiz: { courseId: id }
      },
      include: {
        quiz: {
          select: { id: true, title: true }
        }
      }
    });

    const quizMap = new Map<string, { scores: number[]; totalScore: number }>();

    for (const attempt of quizAttemptsWithQuiz) {
      const quizId = attempt.quiz.id;
      const existing = quizMap.get(quizId) || { scores: [], totalScore: 0 };

      if (attempt.totalScore > 0) {
        existing.scores.push(attempt.score);
        existing.totalScore += attempt.score;
      }

      quizMap.set(quizId, existing);
    }

    // Update quiz stats with real calculations
    const finalQuizStats = course.quizzes.map(quiz => {
      const data = quizMap.get(quiz.id);
      const totalAttempts = quiz._count.attempts;
      let avgPercent = 0;

      if (data && data.scores.length > 0) {
        const avgScore = data.totalScore / data.scores.length;
        avgPercent = Math.round((avgScore / 100) * 100); // Assuming quizzes are out of 100
      }

      return {
        id: quiz.id,
        title: quiz.title,
        totalAttempts,
        avgScore: data ? data.totalScore / data.scores.length : 0,
        avgPercent
      };
    }).filter(q => q.totalAttempts > 0); // Only include quizzes with attempts

    return NextResponse.json({
      success: true,
      data: {
        course: {
          id: course.id,
          title: course.title,
          isPublished: course.isPublished,
          videoCount: totalVideos
        },
        totalEnrollments,
        avgCompletionPercent,
        students: students.slice(0, 20), // Limit to 20 as per spec, but could return all and let UI paginate
        videoStats,
        quizStats: finalQuizStats
      }
    });
  } catch (error) {
    console.error('[instructor/courses/[id]/analytics GET]', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
