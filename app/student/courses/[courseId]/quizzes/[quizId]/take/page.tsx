'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  order: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  questions: Question[];
}

export default function TakeQuizPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch quiz data
  useEffect(() => {
    if (!quizId || status === 'loading') return;

    const fetchQuiz = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const res = await fetch(`${baseUrl}/api/quizzes/${quizId}`, {
          cache: 'no-store',
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch quiz');
        }

        setQuiz(data.data);

        // Initialize selected answers with null/undefined values
        const initialAnswers: Record<string, number> = {};
        data.data.questions.forEach((q: Question) => {
          initialAnswers[q.id] = -1;
        });
        setSelectedAnswers(initialAnswers);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, status]);

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const allQuestionsAnswered = () => {
    if (!quiz) return false;
    return quiz.questions.every((q) => selectedAnswers[q.id] !== -1);
  };

  const handleSubmit = async () => {
    if (!allQuestionsAnswered()) {
      setError('Please answer all questions before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const answersArray = quiz!.questions.map((q) => ({
        questionId: q.id,
        selectedOption: selectedAnswers[q.id],
      }));

      const res = await fetch(`${baseUrl}/api/quizzes/${quizId}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: answersArray,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit quiz');
      }

      // Redirect to results page
      router.push(`/student/courses/${courseId}/quizzes/${quizId}/results`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">Loading quiz...</div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'STUDENT') {
    return null;
  }

  if (error && !quiz) {
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

  if (!quiz) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-600 dark:text-gray-400">Quiz not found.</p>
        <Link href={`/learn/${courseId}`} className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Course
        </Link>
      </div>
    );
  }

  const totalQuestions = quiz.questions.length;
  const answeredQuestions = Object.values(selectedAnswers).filter((ans) => ans !== -1).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href={`/learn/${courseId}`} className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Course
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {quiz.title}
          </h1>
          {quiz.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-4">{quiz.description}</p>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {answeredQuestions} of {totalQuestions} questions answered
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {quiz.questions.map((question, index) => (
            <div key={question.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {index + 1}. {question.text}
              </h3>
              <div className="space-y-2 ml-4">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAnswers[question.id] === optionIndex
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={selectedAnswers[question.id] === optionIndex}
                      onChange={() => handleAnswerSelect(question.id, optionIndex)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-300">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !allQuestionsAnswered()}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}
