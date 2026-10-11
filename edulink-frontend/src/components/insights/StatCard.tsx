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
    <div className="bg-[#1C1B1C] rounded-2xl shadow-lg shadow-black/20 border border-stone-800 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{label}</p>
          <h4 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 mt-2">{value}</h4>
        </div>
        <div className="w-10 h-10 bg-[#FF553E]/15 text-[#FF553E] border border-[#FF553E]/30 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          {trend === 'up' && (
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <TrendingUp size={16} /> Trending up
            </span>
          )}
          {trend === 'down' && (
            <span className="text-red-400 flex items-center gap-1 font-medium">
              <TrendingDown size={16} /> Trending down
            </span>
          )}
          {trend === 'neutral' && (
            <span className="text-stone-400 flex items-center gap-1 font-medium">
              <Minus size={16} /> No change
            </span>
          )}
        </div>
      )}
    </div>
  );
}
