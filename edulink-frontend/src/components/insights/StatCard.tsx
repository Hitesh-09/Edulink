import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
}

export function StatCard({ label, value, trend, icon }: StatCardProps) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <h4 className="text-2xl sm:text-3xl font-bold text-primary-dark mt-2">{value}</h4>
        </div>
        <div className="w-10 h-10 bg-blue-50 text-primary rounded-lg flex items-center justify-center text-xl">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          {trend === 'up' && <span className="text-success flex items-center font-medium">↑ Trending up</span>}
          {trend === 'down' && <span className="text-error flex items-center font-medium">↓ Trending down</span>}
          {trend === 'neutral' && <span className="text-gray-500 flex items-center font-medium">- No change</span>}
        </div>
      )}
    </div>
  );
}
