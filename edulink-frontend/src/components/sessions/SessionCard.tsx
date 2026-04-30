import React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

interface SessionCardProps {
  session: any;
  onEdit: (session: any) => void;
  onDelete: (id: string) => void;
}

export function SessionCard({ session, onEdit, onDelete }: SessionCardProps) {
  const router = useRouter();
  const isUpcoming = new Date(session.scheduled_at) > new Date();
  const sessionDate = new Date(session.scheduled_at);

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-primary-dark text-lg">{session.group_name}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{session.description}</p>
        </div>
        <Badge variant={isUpcoming ? 'blue' : 'green'}>
          {isUpcoming ? 'Upcoming' : 'Completed'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>📅</span>
          {sessionDate.toLocaleDateString()}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>🕒</span>
          {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes}m)
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
        <div className="flex -space-x-2 overflow-hidden">
          {session.participants?.map((p: any, i: number) => (
            <Avatar 
              key={i} 
              src={p.profile?.avatar_url} 
              name={p.profile?.full_name} 
              size="sm" 
              className="border-2 border-surface" 
            />
          ))}
        </div>
        <div className="flex gap-2">
          {isUpcoming && (
            <Button size="sm" onClick={() => router.push(`/sessions/${session.id}/room`)}>
              Join Room
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onEdit(session)}>Edit</Button>
          <Button variant="ghost" size="sm" className="text-error hover:bg-red-50" onClick={() => onDelete(session.id)}>Delete</Button>
        </div>
      </div>
    </div>
  );
}
