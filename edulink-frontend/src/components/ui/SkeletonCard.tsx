import React from 'react';

export function SkeletonCard() {
  return (
    <div className="bg-[#1C1B1C] rounded-2xl shadow-lg shadow-black/20 border border-stone-800 p-6 animate-pulse">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-stone-800 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-stone-800 rounded w-3/4"></div>
          <div className="h-3 bg-stone-800/60 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-stone-800/60 rounded w-full"></div>
        <div className="h-3 bg-stone-800/40 rounded w-full"></div>
      </div>
    </div>
  );
}
