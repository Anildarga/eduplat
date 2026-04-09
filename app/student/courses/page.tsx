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

export default function StudentCoursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'STUDENT') {
      // Redirect non-students away
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchEnrollments();
    }
  }, [status, session]);

  const fetchEnrollments = async () => {
    try {
      const res = await fetch(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/enrollments`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch enrollments');
      }
      setEnrollments(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (enrollmentId: string, courseId: string) => {
    if (!confirm('Are you sure you want to unenroll from this course?')) {
      return;
    }

    try {
      const res = await fetch(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to unenroll');
      }
      // Remove enrollment from list
      setEnrollments(enrollments.filter((e) => e.id !== enrollmentId));
    } catch (err: any) {
      alert(err.message);
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
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        My Learning
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
          {error}
        </div>
      )}

      {enrollments.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
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
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
            >
              {/* Thumbnail */}
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
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {enrollment.course._count.videos} videos
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {enrollment.course.title}
                </h2>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  by {enrollment.course.instructor.name || 'Instructor'}
                </p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{enrollment.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
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
                  <button
                    onClick={() => handleUnenroll(enrollment.id, enrollment.courseId)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Unenroll
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
