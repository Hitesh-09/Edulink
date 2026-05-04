import React from 'react';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  heading: string;
  subtext: string;
}

export function EmptyState({ icon = <FolderOpen size={48} className="text-gray-300" />, heading, subtext }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-2xl h-full">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900">{heading}</h3>
      <p className="text-sm text-gray-500 mt-1 max-w-sm">{subtext}</p>
    </div>
  );
}
