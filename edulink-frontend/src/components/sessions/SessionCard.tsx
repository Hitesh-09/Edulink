import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

interface SessionCardProps {
  session: any;
  onEdit: (session: any) => void;
  onDelete: (id: string) => void;
}

export function SessionCard({ session, onEdit, onDelete }: SessionCardProps) {
  const isUpcoming = new Date(session.date) > new Date();

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-primary-dark text-lg">{session.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{session.description}</p>
        </div>
        <Badge variant={isUpcoming ? 'blue' : 'green'}>
          {isUpcoming ? 'Upcoming' : 'Completed'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>📅</span>
          {new Date(session.date).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>🕒</span>
          {session.time} ({session.duration}m)
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
        <div className="flex -space-x-2 overflow-hidden">
          {session.participants?.map((p: any, i: number) => (
            <Avatar 
              key={i} 
              src={p.avatar_url} 
              name={p.full_name} 
              size="sm" 
              className="border-2 border-surface" 
            />
          ))}
          {(session.participants_count || 0) > (session.participants?.length || 0) && (
            <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-surface flex items-center justify-center text-[10px] font-bold text-gray-500">
              +{(session.participants_count || 0) - (session.participants?.length || 0)}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(session)}>Edit</Button>
          <Button variant="ghost" size="sm" className="text-error hover:bg-red-50" onClick={() => onDelete(session.id)}>Delete</Button>
        </div>
      </div>
    </div>
  );
}
