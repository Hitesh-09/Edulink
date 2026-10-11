import React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Calendar, Clock } from 'lucide-react';

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
    <div className="bg-[#1C1B1C] rounded-2xl shadow-lg shadow-black/20 border border-stone-800 hover:border-[#FF553E]/40 p-5 transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-serif font-bold text-stone-100 text-lg">{session.group_name}</h3>
          <p className="text-sm text-stone-400 mt-1 line-clamp-2 leading-relaxed">{session.description}</p>
        </div>
        <Badge variant={isUpcoming ? 'blue' : 'green'}>
          {isUpcoming ? 'Upcoming' : 'Completed'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="flex items-center gap-2 text-sm text-stone-400">
          <Calendar size={16} className="text-[#FF553E]" />
          {sessionDate.toLocaleDateString()}
        </div>
        <div className="flex items-center gap-2 text-sm text-stone-400">
          <Clock size={16} className="text-[#FF553E]" />
          {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes}m)
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-stone-800/80 mt-auto">
        <div className="flex -space-x-2 overflow-hidden">
          {session.participants?.map((p: any, i: number) => (
            <Avatar 
              key={i} 
              src={p.profile?.avatar_url} 
              name={p.profile?.full_name} 
              size="sm" 
              className="border-2 border-[#1C1B1C]" 
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
          <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-950/40 hover:text-red-300" onClick={() => onDelete(session.id)}>Delete</Button>
        </div>
      </div>
    </div>
  );
}
