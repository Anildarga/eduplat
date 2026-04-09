'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface Props {
  courseId: string;
}

export default function EnrollButton({ courseId }: Props) {
  const { data: session, status } = useSession();
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      checkEnrollment();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [courseId, status]);

  const checkEnrollment = async () => {
    try {
      const res = await fetch(`/api/enrollments/${courseId}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok) {
        setEnrolled(data.data?.enrolled ?? false);
      }
    } catch (error) {
      console.error('Failed to check enrollment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await fetch(`/api/enrollments/${courseId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setEnrolled(true);
      } else {
        alert(data.error || 'Failed to enroll');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (!confirm('Are you sure you want to unenroll from this course?')) {
      return;
    }
    setEnrolling(true);
    try {
      const res = await fetch(`/api/enrollments/${courseId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setEnrolled(false);
      } else {
        alert(data.error || 'Failed to unenroll');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setEnrolling(false);
    }
  };

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <a
        href="/login"
        className="w-full px-6 py-3 bg-blue-600 text-white text-center rounded hover:bg-blue-700"
      >
        Sign in to enroll
      </a>
    );
  }

  // Instructors and admins don't enroll
  if (session?.user?.role === 'INSTRUCTOR' || session?.user?.role === 'ADMIN') {
    return null;
  }

  if (loading) {
    return (
      <button disabled className="w-full px-6 py-3 bg-gray-400 text-white rounded">
        Loading...
      </button>
    );
  }

  if (enrolled) {
    return (
      <div className="flex gap-2">
        <a
          href={`/learn/${courseId}`}
          className="flex-1 px-6 py-3 bg-green-600 text-white text-center rounded hover:bg-green-700"
        >
          Continue Learning
        </a>
        <button
          onClick={handleUnenroll}
          disabled={enrolling}
          className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {enrolling ? 'Unenrolling...' : 'Unenroll'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={enrolling}
      className="w-full px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {enrolling ? 'Enrolling...' : 'Enroll for Free'}
    </button>
  );
}
