import React from 'react';

interface EmptyStateProps {
  icon?: string;
  heading: string;
  subtext: string;
}

export function EmptyState({ icon = '📂', heading, subtext }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-2xl h-full">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900">{heading}</h3>
      <p className="text-sm text-gray-500 mt-1 max-w-sm">{subtext}</p>
    </div>
  );
}
