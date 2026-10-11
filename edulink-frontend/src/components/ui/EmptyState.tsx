import React from 'react';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  heading: string;
  subtext: string;
}

export function EmptyState({ icon = <FolderOpen size={48} className="text-stone-600" />, heading, subtext }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#1C1B1C] border border-dashed border-stone-800 rounded-2xl h-full shadow-lg shadow-black/10">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-serif font-bold text-stone-100">{heading}</h3>
      <p className="text-sm text-stone-400 mt-1 max-w-sm leading-relaxed">{subtext}</p>
    </div>
  );
}
