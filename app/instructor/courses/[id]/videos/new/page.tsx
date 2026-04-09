'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { isValidVideoUrl } from '@/lib/utils';

export default function NewVideoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [duration, setDuration] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  // Redirect if not authenticated or not instructor/admin
  useEffect(() => {
    if (status !== 'loading') {
      const isAuthenticated = status === 'authenticated';
      const hasRole = session?.user?.role === 'INSTRUCTOR' || session?.user?.role === 'ADMIN';

      if (!isAuthenticated) {
        router.push('/login');
      } else if (!hasRole) {
        router.push('/');
      }
    }
  }, [status, session, router]);

  // Video file selection handler
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setVideoFile(file);

    if (file) {
      // Clear URL field when file is selected
      setUrl('');
      // Create preview URL for the video file
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    } else {
      setVideoPreviewUrl(null);
    }
  };

  // URL input handler for video
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const urlValue = e.target.value;
    setUrl(urlValue);
    if (urlValue) {
      // Clear file selection when URL is entered
      setVideoFile(null);
      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = '';
      }
      // Show preview for YouTube links
      if (urlValue.includes('youtube.com') || urlValue.includes('youtu.be')) {
        setVideoPreviewUrl(`https://www.youtube.com/embed/${urlValue.split('v=')[1]?.split('&')[0] || ''}`);
      } else {
        setVideoPreviewUrl(null);
      }
    } else {
      setVideoPreviewUrl(null);
    }
  };

  // Thumbnail file selection handler
  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setThumbnailFile(file);

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setThumbnailUrl('');
    } else {
      setPreviewUrl(null);
    }
  };

  // Thumbnail URL input handler
  const handleThumbnailUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const urlValue = e.target.value;
    setThumbnailUrl(urlValue);
    if (urlValue) {
      setPreviewUrl(urlValue);
      setThumbnailFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    let videoUrl: string;
    if (videoFile) {
      // Upload video file first
      setVideoUploadProgress(true);
      const formData = new FormData();
      formData.append('file', videoFile);

      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Failed to upload video');
        }

        videoUrl = uploadData.data.url;
      } catch (err: any) {
        setError('Video upload failed: ' + err.message);
        setVideoUploadProgress(false);
        return;
      }
    } else if (url.trim()) {
      videoUrl = url.trim();
      // Validate URL if it's not an uploaded file (upload returns valid URL)
      if (!isValidVideoUrl(videoUrl)) {
        setError('Invalid video URL');
        setVideoUploadProgress(false);
        return;
      }
    } else {
      setError('Video URL or file is required');
      setVideoUploadProgress(false);
      return;
    }

    // Upload thumbnail if file is selected
    let thumbnailValue: string | null = null;
    if (thumbnailFile) {
      const formData = new FormData();
      formData.append('file', thumbnailFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Failed to upload thumbnail');
      }

      thumbnailValue = uploadData.data.url;
    } else if (thumbnailUrl.trim()) {
      thumbnailValue = thumbnailUrl.trim();
    }

    setVideoUploadProgress(false);
    setIsSubmitting(true);

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch(`${baseUrl}/api/courses/${courseId}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          url: videoUrl,
          thumbnail: thumbnailValue,
          duration: duration ? parseInt(duration, 10) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create video');
      }

      // Redirect to videos list
      router.push(`/instructor/courses/${courseId}/videos`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session || (session.user?.role !== 'INSTRUCTOR' && session.user?.role !== 'ADMIN')) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/instructor/courses/${courseId}/videos`} className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Videos
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Add New Video
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter video title"
              required
            />
          </div>

          {/* Video URL OR File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Video <span className="text-red-500">*</span>
            </label>

            {/* File upload */}
            <div className="mb-3">
              <input
                ref={videoFileInputRef}
                type="file"
                id="videoFile"
                accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
                onChange={handleVideoFileChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  dark:file:bg-blue-900/30 dark:file:text-blue-400
                  hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
                "
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Upload a video file (MP4, WebM, OGG, MOV, AVI) • Max 500MB
              </p>
            </div>

            {/* OR separator */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">OR</span>
              </div>
            </div>

            {/* Manual URL input */}
            <div>
              <input
                type="url"
                id="url"
                value={url}
                onChange={handleUrlChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Or paste a video URL (YouTube, Vimeo, direct video link)..."
              />
              {videoPreviewUrl && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                  <div className="aspect-video w-full max-w-lg rounded overflow-hidden bg-black">
                    {url.includes('youtube.com') || url.includes('youtu.be') ? (
                      <iframe
                        src={videoPreviewUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video src={videoPreviewUrl} controls className="w-full h-full" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail - Optional (Upload or URL) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Thumbnail Image (optional)
            </label>

            {/* File upload */}
            <div className="mb-3">
              <input
                ref={fileInputRef}
                type="file"
                id="thumbnailFile"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleThumbnailFileChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  dark:file:bg-blue-900/30 dark:file:text-blue-400
                  hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
                "
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Upload an image (JPG, PNG, GIF, WebP) • Max 5MB
              </p>
            </div>

            {/* OR separator */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">OR</span>
              </div>
            </div>

            {/* Manual URL input */}
            <div>
              <input
                type="url"
                id="thumbnailUrl"
                value={thumbnailUrl}
                onChange={handleThumbnailUrlChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Or paste an image URL here..."
              />
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                <img
                  src={previewUrl}
                  alt="Thumbnail preview"
                  className="w-48 h-32 object-cover rounded border border-gray-300 dark:border-gray-600"
                />
              </div>
            )}
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration (seconds, optional)
            </label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 300 for a 5 minute video"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the video"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting || videoUploadProgress}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : videoUploadProgress ? 'Uploading Video...' : 'Add Video'}
            </button>
            <Link
              href={`/instructor/courses/${courseId}/videos`}
              className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
