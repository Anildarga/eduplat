import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/instructor/stats - Overall stats for the logged-in instructor
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

    // Fetch all data in parallel
    const [courses, totalEnrollments, totalStudents] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          _count: {
            select: { enrollments: true, videos: true }
          }
        }
      }),
      prisma.enrollment.count({
        where: {
          course: session.user.role === 'INSTRUCTOR'
            ? { instructorId: session.user.id }
            : {}
        }
      }),
      prisma.enrollment.findMany({
        where: {
          course: session.user.role === 'INSTRUCTOR'
            ? { instructorId: session.user.id }
            : {}
        },
        select: { userId: true },
        distinct: ['userId']
      })
    ]);

    // Compute derived stats
    const totalCourses = courses.length;
    const publishedCourses = courses.filter(c => c.isPublished).length;
    const draftCourses = totalCourses - publishedCourses;
    const totalVideos = courses.reduce((sum, c) => sum + c._count.videos, 0);
    const totalUniqueStudents = totalStudents.length;

    // Prepare course summary data
    const courseData = courses.map(course => ({
      id: course.id,
      title: course.title,
      isPublished: course.isPublished,
      enrollmentCount: course._count.enrollments,
      videoCount: course._count.videos
    })).sort((a, b) => b.enrollmentCount - a.enrollmentCount); // Sort by enrollment descending

    return NextResponse.json({
      success: true,
      data: {
        totalCourses,
        publishedCourses,
        draftCourses,
        totalEnrollments,
        totalUniqueStudents,
        totalVideos,
        courses: courseData
      }
    });
  } catch (error) {
    console.error('[instructor/stats GET]', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
