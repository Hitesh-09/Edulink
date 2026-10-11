import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'blue', size = 'md', className = '' }: BadgeProps) {
  const variants = {
    blue: 'bg-[#FF553E]/10 text-[#FF553E] border-[#FF553E]/30',
    green: 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60',
    amber: 'bg-amber-950/50 text-amber-400 border-amber-800/60',
    red: 'bg-red-950/50 text-red-400 border-red-800/60',
    purple: 'bg-purple-950/50 text-purple-400 border-purple-800/60',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
