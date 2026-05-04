import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

export function StatCard({ label, value, trend, icon }: StatCardProps) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <h4 className="text-2xl sm:text-3xl font-bold text-primary-dark mt-2">{value}</h4>
        </div>
        <div className="w-10 h-10 bg-blue-50 text-primary rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          {trend === 'up' && (
            <span className="text-success flex items-center gap-1 font-medium">
              <TrendingUp size={16} /> Trending up
            </span>
          )}
          {trend === 'down' && (
            <span className="text-error flex items-center gap-1 font-medium">
              <TrendingDown size={16} /> Trending down
            </span>
          )}
          {trend === 'neutral' && (
            <span className="text-gray-500 flex items-center gap-1 font-medium">
              <Minus size={16} /> No change
            </span>
          )}
        </div>
      )}
    </div>
  );
}
