import React from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export function ConnectionCard({ profile, onMessage, onAddToSession }: any) {
  const router = useRouter();

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex flex-col items-center text-center h-full hover:shadow-md transition-shadow">
      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold text-xl mb-3 overflow-hidden">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
        ) : (
          getInitials(profile?.full_name)
        )}
      </div>
      <h3 className="font-semibold text-primary-dark line-clamp-1">{profile?.full_name || 'Unknown User'}</h3>
      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{profile?.college || 'Unknown College'}</p>
      <p className="text-xs text-gray-500 line-clamp-1 mb-5">{profile?.branch || 'Unknown Branch'}</p>

      <div className="mt-auto w-full flex flex-col gap-2">
        <Button variant="secondary" size="sm" onClick={() => router.push(`/profile/${profile?.id}`)}>
          View Profile
        </Button>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" className="flex-1" onClick={() => onMessage(profile?.id)}>
            Message
          </Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onAddToSession(profile?.id)}>
            + Session
          </Button>
        </div>
      </div>
    </div>
  );
}
