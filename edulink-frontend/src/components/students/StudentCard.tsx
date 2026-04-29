import React from 'react';
import { Button } from '@/components/ui/Button';

export interface StudentProfile {
  id: string;
  full_name: string;
  college: string;
  branch: string;
  year: string;
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

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex flex-col h-full transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
          ) : (
            getInitials(profile.full_name)
          )}
        </div>
        <div>
          <h3 className="font-semibold text-primary-dark line-clamp-1">{profile.full_name}</h3>
          <p className="text-xs text-gray-500 line-clamp-1">{profile.college}</p>
        </div>
      </div>

      <div className="mb-5 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            {profile.year} Year
          </div>
          <p className="text-xs text-gray-700 line-clamp-1"><span className="font-medium">Branch:</span> {profile.branch}</p>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {displayedInterests.map((interest, idx) => (
            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
              {interest}
            </span>
          ))}
          {extraInterests > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
              +{extraInterests}
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-border">
        {connectionStatus === 'connected' ? (
          <Button variant="secondary" className="w-full" disabled>Connected</Button>
        ) : connectionStatus === 'pending' ? (
          <Button variant="secondary" className="w-full bg-gray-50 text-gray-500 cursor-not-allowed" disabled>
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
