'use client';

import React from 'react';

interface ProgressBarProps {
  percent: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export default function ProgressBar({
  percent,
  showLabel = true,
  size = 'md'
}: ProgressBarProps) {
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';
  const color = percent >= 70
    ? 'bg-green-500'
    : percent >= 40
    ? 'bg-amber-500'
    : 'bg-red-500';

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${height}`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">
          {percent}%
        </div>
      )}
    </div>
  );
}
