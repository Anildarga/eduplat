import { Quiz, Question, QuizAttempt, User } from '@prisma/client';

export type QuestionWithId = Question & { id: string };

export type QuizWithQuestions = Quiz & {
  questions: QuestionWithId[];
};

export type QuizAttemptWithDetails = QuizAttempt & {
  user: Pick<User, 'id' | 'name' | 'email'>;
  quiz: { id: string; title: string };
};

export type QuizResult = {
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
};

export interface SubmitQuizInput {
  answers: Array<{
    questionId: string;
    selectedOption: number;
  }>;
}
