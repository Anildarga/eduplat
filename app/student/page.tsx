'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDuration } from '@/lib/utils';

interface Enrollment {
  id: string;
  courseId: string;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    instructor: {
      name: string | null;
    };
    _count: {
      videos: number;
    };
  };
  progressPercent: number;
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated' && session?.user?.role !== 'STUDENT') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchData();
    }
  }, [status, session]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/enrollments`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch enrollments');
      }
      setEnrollments(data.data);
      setEnrollmentCount(data.data.length);
      // Get the 3 most recent courses (already ordered by enrolledAt descending)
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'STUDENT') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {session.user.name || 'Student'}!
        </h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {enrollmentCount}
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            Courses Enrolled
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
            {enrollments.reduce((sum, e) => {
              // Estimate total videos watched from progress
              // For now just show completed courses count or 0
              // This will be enhanced with actual video progress data
              return sum + (e.progressPercent > 0 ? e.progressPercent : 0);
            }, 0)}%
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            Avg. Progress
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            0
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            Quizzes Completed
          </div>
        </div>
      </div>

      {/* Recent courses section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Courses
          </h2>
          <Link
            href="/student/courses"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            View All
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You haven't enrolled in any courses yet.
            </p>
            <Link
              href="/courses"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.slice(0, 3).map((enrollment) => (
              <div
                key={enrollment.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
              >
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative">
                  {enrollment.course.thumbnail ? (
                    <img
                      src={enrollment.course.thumbnail}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {enrollment.course.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    by {enrollment.course.instructor?.name || 'Instructor'}
                  </p>
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{enrollment.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${enrollment.progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/learn/${enrollment.courseId}`}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-center rounded hover:bg-green-700 text-sm"
                    >
                      {enrollment.progressPercent > 0 ? 'Continue Learning' : 'Start Learning'}
                    </Link>
                    <Link
                      href={`/courses/${enrollment.courseId}`}
                      className="px-3 py-2 bg-gray-600 text-white text-center rounded hover:bg-gray-700 text-sm"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to learn something new?
        </h2>
        <Link
          href="/courses"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Browse More Courses
        </Link>
      </div>
    </div>
  );
}

