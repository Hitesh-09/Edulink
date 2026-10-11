import React from 'react';
import { Button } from '@/components/ui/Button';

export function RequestCard({ profile, type, onAccept, onReject, requestId }: any) {
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-[#1C1B1C] rounded-2xl shadow-lg shadow-black/20 border border-stone-800 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 rounded-full bg-[#FF553E]/15 border border-[#FF553E]/30 flex items-center justify-center text-[#FF553E] font-bold overflow-hidden shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
          ) : (
            getInitials(profile?.full_name)
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-serif font-bold text-stone-100 line-clamp-1">{profile?.full_name || 'Unknown User'}</h3>
          <p className="text-xs text-stone-400 line-clamp-1">{profile?.college || 'Unknown College'}</p>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
        {type === 'received' ? (
          <>
            <button
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-950/30 hover:bg-red-900/40 border border-red-800/60 transition-colors"
              onClick={() => onReject(requestId)}
            >
              Reject
            </button>
            <button
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950/30"
              onClick={() => onAccept(requestId)}
            >
              Accept
            </button>
          </>
        ) : (
          <span className="px-3 py-1 bg-amber-950/50 text-amber-400 text-xs font-semibold rounded-full w-full sm:w-auto text-center border border-amber-800/60">
            Pending
          </span>
        )}
      </div>
    </div>
  );
}
