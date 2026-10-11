import React from 'react';
import { Button } from '@/components/ui/Button';

export interface StudentProfile {
  id: string;
  full_name: string;
  register_no?: string;
  college: string;
  campus?: string;
  branch: string;
  year: string | number;
  semester?: number;
  interests: string[];
  avatar_url?: string;
}

interface StudentCardProps {
  profile: StudentProfile;
  connectionStatus: 'none' | 'pending' | 'connected';
  onConnect: (id: string) => void;
}

export function StudentCard({ profile, connectionStatus, onConnect }: StudentCardProps) {
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const displayedInterests = profile.interests?.slice(0, 3) || [];
  const extraInterests = (profile.interests?.length || 0) - 3;
  const semNum = profile.semester || (Number(profile.year) ? (Number(profile.year) - 1) * 2 + 1 : 1);

  return (
    <div className="bg-[#1C1B1C] rounded-2xl shadow-lg shadow-black/20 border border-stone-800 hover:border-[#FF553E]/40 p-5 flex flex-col h-full transition-all duration-200">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#FF553E]/15 border border-[#FF553E]/30 flex items-center justify-center text-[#FF553E] font-bold shrink-0 overflow-hidden">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
          ) : (
            getInitials(profile.full_name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif font-bold text-stone-100 text-base line-clamp-1">{profile.full_name}</h3>
          {profile.register_no && (
            <p className="text-[11px] font-mono font-medium text-[#FF553E] tracking-wider">{profile.register_no}</p>
          )}
          <p className="text-xs text-stone-400 line-clamp-1">{profile.college} ({profile.campus || 'KTR'})</p>
        </div>
      </div>

      <div className="mb-5 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-stone-900 border border-stone-800 text-stone-300">
            Year {profile.year} • Sem {semNum}
          </div>
          <p className="text-xs text-stone-400 line-clamp-1"><span className="font-medium text-stone-300">Branch:</span> {profile.branch}</p>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {displayedInterests.map((interest: any, idx) => (
            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FF553E]/10 text-[#FF553E] border border-[#FF553E]/20">
              {interest.name || interest}
            </span>
          ))}
          {extraInterests > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-900 text-stone-400 border border-stone-800">
              +{extraInterests}
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-stone-800/80">
        {connectionStatus === 'connected' ? (
          <Button variant="secondary" className="w-full" disabled>Connected</Button>
        ) : connectionStatus === 'pending' ? (
          <Button variant="secondary" className="w-full bg-stone-900 text-stone-500 border-stone-800 cursor-not-allowed" disabled>
            Pending
          </Button>
        ) : (
          <Button onClick={() => onConnect(profile.id)} className="w-full">
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
