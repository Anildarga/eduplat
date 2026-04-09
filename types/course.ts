import { Course, User, Video, Enrollment, Quiz } from '@prisma/client';

export type CourseWithDetails = Course & {
  instructor: Pick<User, 'id' | 'name' | 'image'>;
  videos: Video[];
  quizzes: { id: string }[];
  _count: {
    enrollments: number;
    videos: number;
  };
};
