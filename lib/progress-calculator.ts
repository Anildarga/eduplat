import prisma from './prisma';

/**
 * Calculate progress for a course for a specific user
 */
export async function calculateCourseProgress(
  userId: string,
  courseId: string
) {
  // Fetch all videos in the course
  const videos = await prisma.video.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      duration: true,
    },
  });

  const totalVideos = videos.length;

  if (totalVideos === 0) {
    return {
      totalVideos: 0,
      completedVideos: 0,
      percentComplete: 0,
      videosProgress: [],
    };
  }

  // Fetch progress records for this user in this course
  const videoIds = videos.map((v) => v.id);
  const progressRecords = await prisma.videoProgress.findMany({
    where: {
      userId,
      videoId: {
        in: videoIds,
      },
    },
    select: {
      videoId: true,
      watchedSeconds: true,
      completed: true,
    },
  });

  // Calculate completed videos
  const completedVideos = progressRecords.filter((p) => p.completed).length;
  const percentComplete = Math.round((completedVideos / totalVideos) * 100);

  // Map progress for each video
  const videosProgress = videos.map((video) => {
    const progress = progressRecords.find((p) => p.videoId === video.id);
    return {
      videoId: video.id,
      watchedSeconds: progress?.watchedSeconds ?? 0,
      completed: progress?.completed ?? false,
    };
  });

  return {
    totalVideos,
    completedVideos,
    percentComplete,
    videosProgress,
  };
}
