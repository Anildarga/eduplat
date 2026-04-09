'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red';
}

export default function StatCard({
  label,
  value,
  subtitle,
  color = 'blue'
}: StatCardProps) {
  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
    green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
    amber: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
    purple: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100',
    red: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
  };

  return (
    <div className={`rounded-lg border p-6 ${colorMap[color]}`}>
      <div className="text-sm font-medium mb-1">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
      {subtitle && (
        <div className="text-sm mt-2 opacity-75">{subtitle}</div>
      )}
    </div>
  );
}
