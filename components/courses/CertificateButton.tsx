'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CertificateButtonProps {
  courseId: string;
  courseName: string;
  progressPercent: number;
}

export default function CertificateButton({
  courseId,
  courseName,
  progressPercent,
}: CertificateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [certificateData, setCertificateData] = useState<{
    certificateNumber: string;
    issuedAt: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCompleted = progressPercent === 100;

  const handleGenerateCertificate = async () => {
    if (!isCompleted) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/courses/${courseId}/certificate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate certificate');
      }

      setCertificateData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!certificateData) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/certificate`);

      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificateData.certificateNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download certificate');
    }
  };

  if (!isCompleted) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700/50 rounded-lg p-6 mb-8">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-6 h-6 text-green-600 dark:text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 15a5 5 0 100-10 5 5 0 000 10z" />
              <path
                fillRule="evenodd"
                d="M19.778 5.334a1 1 0 00-.428-1.428A8.773 8.773 0 0010 1a8.773 8.773 0 00-9.35 2.906 1 1 0 101.698 1.088A6.773 6.773 0 0110 3a6.773 6.773 0 016.906 2.253 1 1 0 001.422.437z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-lg font-bold text-green-900 dark:text-green-300">
              Congratulations! 🎉
            </h3>
          </div>

          <p className="text-green-800 dark:text-green-200 mb-4">
            You have successfully completed the course <strong>{courseName}</strong>.
            Get your certificate of completion to recognize your achievement!
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded p-3 mb-4 text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          {certificateData ? (
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 rounded p-3 border border-green-200 dark:border-green-700/50">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <span className="font-semibold">Certificate Number:</span>{' '}
                  {certificateData.certificateNumber}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">Issued:</span>{' '}
                  {new Date(certificateData.issuedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <button
                onClick={handleDownloadCertificate}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download Certificate PDF
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateCertificate}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {isLoading ? 'Generating Certificate...' : 'Generate Certificate'}
            </button>
          )}
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            100%
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">Completed</p>
        </div>
      </div>
    </div>
  );
}
