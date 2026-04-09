'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface QuizResult {
  score: number;
  totalScore: number;
  percentage: number;
  passed: boolean;
  answers: Array<{
    questionId: string;
    questionText: string;
    userAnswer: number;
    correctAnswer: number;
    options: string[];
    isCorrect: boolean;
  }>;
  completedAt: string;
  quizType?: string;
  passingScore?: number;
  supplementalQuiz?: {
    id: string;
    title: string;
  } | null;
}

export default function QuizResultsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const quizId = params.quizId as string;

  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch results
  useEffect(() => {
    if (!quizId || status === 'loading') return;

    const fetchResults = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const res = await fetch(`${baseUrl}/api/quizzes/${quizId}/results`, {
          cache: 'no-store',
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch results');
        }

        if (data.success && data.data) {
          setResult(data.data);
        } else {
          setError('No results found. You have not taken this quiz yet.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [quizId, status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">Loading results...</div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'STUDENT') {
    return null;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded mb-4">
          {error}
        </div>
        <Link href={`/learn/${courseId}`} className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Course
        </Link>
      </div>
    );
  }

  if (!result) {
    // No attempt yet, redirect to take quiz
    useEffect(() => {
      router.push(`/student/courses/${courseId}/quizzes/${quizId}/take`);
    }, []);
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">Redirecting to quiz...</div>
      </div>
    );
  }

  const isPassed = result.passed;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href={`/learn/${courseId}`} className="text-blue-600 dark:text-blue-400 hover:underline">
          Course
        </Link>
        <span className="mx-2 text-gray-500">→</span>
        <span className="text-gray-900 dark:text-white font-medium">Quiz Results</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
            isPassed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            <span className={`text-3xl font-bold ${
              isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {result.percentage}%
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isPassed ? 'Congratulations!' : 'Keep Learning!'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You scored {result.score} out of {result.totalScore}
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href={`/learn/${courseId}`}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Course
            </Link>
            {!isPassed && result.quizType === 'SUPPLEMENTAL' && (
              <button
                onClick={() => router.push(`/student/courses/${courseId}/quizzes/${quizId}/take`)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Retake Supplemental Quiz
              </button>
            )}
            {!isPassed && result.quizType === 'MAIN' && result.supplementalQuiz && (
              <Link
                href={`/student/courses/${courseId}/quizzes/${result.supplementalQuiz.id}/take`}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Take Supplemental Quiz
              </Link>
            )}
            {!isPassed && result.quizType === 'MAIN' && !result.supplementalQuiz && (
              <p className="px-6 py-2 text-gray-600 dark:text-gray-400">
                No supplemental quiz available. Contact your instructor.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Answer Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Answer Review
        </h2>
        <div className="space-y-6">
          {result.answers.map((answer, index) => (
            <div
              key={answer.questionId}
              className={`border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 ${
                answer.isCorrect ? '' : 'bg-red-50 dark:bg-red-900/10 -mx-6 px-6 py-4'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`text-lg font-bold ${answer.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                  {index + 1}.
                </span>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white mb-2">{answer.questionText}</p>
                  <div className="space-y-1">
                    {answer.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`flex items-center gap-2 p-2 rounded ${
                          optIndex === answer.correctAnswer
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : optIndex === answer.userAnswer && !answer.isCorrect
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                            : ''
                        }`}
                      >
                        <span className="text-sm">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <span className="text-sm">{option}</span>
                        {optIndex === answer.correctAnswer && (
                          <span className="ml-auto text-sm font-medium">Correct</span>
                        )}
                        {optIndex === answer.userAnswer && !answer.isCorrect && (
                          <span className="ml-auto text-sm font-medium">Your answer</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
