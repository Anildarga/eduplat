import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import StatCard from '@/components/instructor/StatCard';
import ProgressBar from '@/components/instructor/ProgressBar';
import { formatDuration } from '@/lib/utils';
import Link from 'next/link';

// Define types for analytics data
interface StudentProgress {
  id: string;
  name: string;
  email: string;
  enrolledAt: Date;
  videosCompleted: number;
  percentComplete: number;
  lastActive: Date | null;
}

interface VideoStat {
  id: string;
  title: string;
  duration: number;
  totalWatches: number;
  completions: number;
  completionRate: number;
  avgWatchedSeconds: number;
}

interface QuizStat {
  id: string;
  title: string;
  totalAttempts: number;
  avgScore: number;
  avgPercent: number;
}

interface AnalyticsData {
  course: {
    id: string;
    title: string;
    isPublished: boolean;
    videoCount: number;
  };
  totalEnrollments: number;
  avgCompletionPercent: number;
  students: StudentProgress[];
  videoStats: VideoStat[];
  quizStats: QuizStat[];
}

async function getAnalytics(courseId: string, userId: string, userRole: string): Promise<AnalyticsData | null> {
  // Fetch course and verify ownership for instructors
  const course = await prisma.course.findUnique({
    where: { id: courseId },
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
    return null;
  }

  // Instructors can only access their own courses
  if (userRole === 'INSTRUCTOR' && course.instructorId !== userId) {
    return null;
  }

  // Fetch all related data in parallel
  const [enrollments, allProgress, quizAttemptsWithQuiz] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    }),
    prisma.videoProgress.findMany({
      where: {
        video: { courseId }
      },
      include: {
        video: { select: { id: true, title: true, duration: true } }
      }
    }),
    prisma.quizAttempt.findMany({
      where: {
        quiz: { courseId }
      },
      include: {
        quiz: {
          select: { id: true, title: true }
        }
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
  const students: StudentProgress[] = enrollments.map(enrollment => {
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

  const videoStats: VideoStat[] = course.videos.map(video => {
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

  // Compute quiz stats grouped by quiz
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

  const quizStats: QuizStat[] = course.quizzes.map(quiz => {
    const data = quizMap.get(quiz.id);
    const totalAttempts = quiz._count.attempts;
    let avgScore = 0;
    let avgPercent = 0;

    if (data && data.scores.length > 0) {
      avgScore = data.totalScore / data.scores.length;
      avgPercent = Math.round((avgScore / 100) * 100); // Assuming quizzes are out of 100
    }

    return {
      id: quiz.id,
      title: quiz.title,
      totalAttempts,
      avgScore,
      avgPercent
    };
  }).filter(q => q.totalAttempts > 0); // Only include quizzes with attempts

  return {
    course: {
      id: course.id,
      title: course.title,
      isPublished: course.isPublished,
      videoCount: totalVideos
    },
    totalEnrollments,
    avgCompletionPercent,
    students,
    videoStats,
    quizStats
  };
}

export default async function CourseAnalyticsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  // Redirect if not authenticated or not instructor/admin
  if (!session) {
    redirect('/login');
  }

  if (!['INSTRUCTOR', 'ADMIN'].includes(session.user.role)) {
    redirect('/');
  }

  const analytics = await getAnalytics(id, session.user.id, session.user.role);

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p>You do not have permission to view this analytics or the course does not exist.</p>
          <Link href="/instructor" className="text-blue-600 hover:underline mt-4 inline-block">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { course, totalEnrollments, avgCompletionPercent, students, videoStats, quizStats } = analytics;

  // Format date
  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb / Back button */}
      <Link
        href="/instructor"
        className="inline-flex items-center text-blue-600 hover:underline mb-6"
      >
        <span className="mr-1">&larr;</span> Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Analytics: {course.title}
        </h1>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {course.isPublished ? (
            <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded text-xs font-medium">
              Published
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded text-xs font-medium">
              Draft
            </span>
          )}
        </div>
      </div>

      {/* SECTION 1 — Course Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Enrolled Students"
          value={totalEnrollments}
          color="blue"
        />
        <StatCard
          label="Avg Completion"
          value={`${avgCompletionPercent}%`}
          subtitle="Average progress across all students"
          color={avgCompletionPercent >= 70 ? 'green' : avgCompletionPercent >= 40 ? 'amber' : 'red'}
        />
        <StatCard
          label="Quiz Attempts"
          value={quizStats.reduce((sum, q) => sum + q.totalAttempts, 0)}
          color="purple"
        />
        <StatCard
          label="Published"
          value={course.isPublished ? 'Yes' : 'No'}
          subtitle={course.isPublished ? 'Course is live' : 'Course is in draft'}
          color={course.isPublished ? 'green' : 'amber'}
        />
      </div>

      {/* SECTION 2 — Student Progress Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Student Progress
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Showing {students.length} enrolled student{students.length !== 1 ? 's' : ''}
          </p>
        </div>

        {students.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <p>No students enrolled yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Enrolled Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Videos Done
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {student.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(student.enrolledAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-48">
                        <ProgressBar percent={student.percentComplete} size="sm" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {student.videosCompleted} / {course.videoCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {student.lastActive ? formatDate(student.lastActive) : 'Never'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3 — Video Performance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Video Performance
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Engagement metrics for each video in this course
          </p>
        </div>

        {videoStats.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <p>No videos in this course yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Video Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Completions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Avg Watch Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {videoStats.map((video, index) => (
                  <tr key={video.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {video.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDuration(video.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {video.totalWatches}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {video.completions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        video.completionRate >= 70
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : video.completionRate >= 40
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {video.completionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDuration(video.avgWatchedSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 4 — Quiz Performance */}
      {quizStats.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Quiz Performance
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Average scores across all quiz attempts
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quiz Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Attempts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Average Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Average Percent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {quizStats.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {quiz.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {quiz.totalAttempts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {quiz.avgScore.toFixed(1)} / 100
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        quiz.avgPercent >= 70
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : quiz.avgPercent >= 40
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {quiz.avgPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Back button at bottom */}
      <div className="mt-8">
        <Link
          href="/instructor"
          className="inline-flex items-center text-blue-600 hover:underline"
        >
          <span className="mr-1">&larr;</span> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
