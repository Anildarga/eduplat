import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import StatCard from '@/components/instructor/StatCard';
import Link from 'next/link';

interface CourseStats {
  id: string;
  title: string;
  isPublished: boolean;
  enrollmentCount: number;
  videoCount: number;
}

interface InstructorStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  totalUniqueStudents: number;
  totalVideos: number;
  courses: CourseStats[];
}

async function getInstructorStats(userId: string, userRole: string): Promise<InstructorStats | null> {
  // Build where clause based on role
  const where: any = {};
  if (userRole === 'INSTRUCTOR') {
    where.instructorId = userId;
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
        course: userRole === 'INSTRUCTOR'
          ? { instructorId: userId }
          : {}
      }
    }),
    prisma.enrollment.findMany({
      where: {
        course: userRole === 'INSTRUCTOR'
          ? { instructorId: userId }
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

  // Prepare course data sorted by enrollment (descending)
  const courseData: CourseStats[] = courses
    .map(course => ({
      id: course.id,
      title: course.title,
      isPublished: course.isPublished,
      enrollmentCount: course._count.enrollments,
      videoCount: course._count.videos
    }))
    .sort((a, b) => b.enrollmentCount - a.enrollmentCount);

  return {
    totalCourses,
    publishedCourses,
    draftCourses,
    totalEnrollments,
    totalUniqueStudents,
    totalVideos,
    courses: courseData
  };
}

export default async function InstructorDashboardPage() {
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated or not instructor/admin
  if (!session) {
    redirect('/login');
  }

  if (!['INSTRUCTOR', 'ADMIN'].includes(session.user.role)) {
    redirect('/');
  }

  const stats = await getInstructorStats(session.user.id, session.user.role);

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const { totalCourses, publishedCourses, draftCourses, totalEnrollments, totalUniqueStudents, totalVideos, courses } = stats;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Instructor Dashboard
        </h1>
        <Link
          href="/instructor/courses/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Create New Course
        </Link>
      </div>

      {/* TOP STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Courses"
          value={totalCourses}
          subtitle={`${publishedCourses} published, ${draftCourses} draft`}
          color="blue"
        />
        <StatCard
          label="Total Enrollments"
          value={totalEnrollments}
          color="green"
        />
        <StatCard
          label="Unique Students"
          value={totalUniqueStudents}
          color="purple"
        />
        <StatCard
          label="Total Videos"
          value={totalVideos}
          color="amber"
        />
      </div>

      {/* COURSE PERFORMANCE TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Course Performance
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Overview of your courses and their enrollment metrics
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
              You haven't created any courses yet.
            </p>
            <Link
              href="/instructor/courses/new"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Create Your First Course
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Course Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Videos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {course.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {course.isPublished ? (
                        <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full text-xs font-semibold">
                          Published
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-semibold">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {course.enrollmentCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {course.videoCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Link
                          href={`/instructor/courses/${course.id}/analytics`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          View Analytics
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link
                          href={`/instructor/courses/${course.id}/videos`}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                        >
                          Manage Videos
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link
                          href={`/instructor/courses/${course.id}/edit`}
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 font-medium"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="flex gap-4 flex-wrap">
          <Link
            href="/instructor/courses/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Create New Course
          </Link>
          <Link
            href="/instructor/courses"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            View All My Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
