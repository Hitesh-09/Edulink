import React from 'react';
import { Button } from '@/components/ui/Button';

export function RequestCard({ profile, type, onAccept, onReject, requestId }: any) {
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
          ) : (
            getInitials(profile?.full_name)
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-primary-dark line-clamp-1">{profile?.full_name || 'Unknown User'}</h3>
          <p className="text-xs text-gray-500 line-clamp-1">{profile?.college || 'Unknown College'}</p>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
        {type === 'received' ? (
          <>
            <Button variant="secondary" className="flex-1 sm:flex-none text-error hover:bg-red-50 border-red-200 hover:border-red-300" size="sm" onClick={() => onReject(requestId)}>Reject</Button>
            <Button variant="primary" className="flex-1 sm:flex-none bg-success hover:bg-green-700" size="sm" onClick={() => onAccept(requestId)}>Accept</Button>
          </>
        ) : (
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full w-full sm:w-auto text-center border border-amber-200">
            Pending
          </span>
        )}
      </div>
    </div>
  );
}
