'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { SessionCard } from '@/components/sessions/SessionCard';
import { CreateSessionModal } from '@/components/sessions/CreateSessionModal';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api';

import { Calendar } from 'lucide-react';

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessionsRes, connectionsRes] = await Promise.allSettled([
        apiFetch<any[]>('/api/sessions'),
        apiFetch<any[]>('/api/connections')
      ]);

      if (sessionsRes.status === 'fulfilled') setSessions(sessionsRes.value || []);
      if (connectionsRes.status === 'fulfilled') {
        const connData = connectionsRes.value || [];
        // Extract profiles from backend shape: { otherUserProfile, interests, connection }
        setConnections(connData.map((c: any) => c.otherUserProfile || c));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateClick = (arg: any) => {
    setEditingSession({ date: arg.dateStr });
    setIsModalOpen(true);
  };

  const handleEventClick = (info: any) => {
    const session = sessions.find(s => s.id === info.event.id);
    if (session) {
      setEditingSession(session);
      setIsModalOpen(true);
    }
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const method = editingSession?.id ? 'PUT' : 'POST';
      const endpoint = editingSession?.id ? `/api/sessions/${editingSession.id}` : '/api/sessions';
      
      // Map frontend formData to backend CreateSessionPayload
      const payload = {
        groupName: formData.title,
        description: formData.description,
        participantIds: formData.participants,
        scheduledAt: new Date(`${formData.date}T${formData.time}`).toISOString(),
        durationMinutes: formData.duration,
        status: formData.status // for updates
      };

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      setToastMessage(editingSession?.id ? 'Session updated successfully!' : 'Session created successfully!');
      setIsModalOpen(false);
      setEditingSession(null);
      fetchData();
    } catch (error) {
      console.error('Error saving session:', error);
      setToastMessage('Failed to save session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await apiFetch(`/api/sessions/${id}`, { method: 'DELETE' });
      setToastMessage('Session deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting session:', error);
      setToastMessage('Failed to delete session.');
    }
  };

  const calendarEvents = sessions.map(s => ({
    id: s.id,
    title: s.group_name,
    start: s.scheduled_at,
    color: new Date(s.scheduled_at) > new Date() ? '#FF553E' : '#10B981'
  }));

  const upcomingSessions = [...sessions]
    .filter(s => new Date(s.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5);

  return (
    <AppLayout>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      
      <PageHeader 
        title="Study Sessions" 
        subtitle="Coordinate and join study sessions with your network."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => {
              const code = prompt('Enter 6-digit Join Code or Session ID:');
              if (code) router.push(`/sessions/${code}/room`);
            }}>
              Join Session
            </Button>
            <Button onClick={() => { setEditingSession(null); setIsModalOpen(true); }}>
              + New Session
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Column */}
        <div className="lg:col-span-2 bg-[#1C1B1C] rounded-2xl border border-stone-800 p-6 shadow-xl shadow-black/20 overflow-hidden">
          <div className="full-calendar-wrapper">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              height="auto"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: ''
              }}
            />
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-[#1C1B1C] rounded-2xl border border-stone-800 p-6 shadow-xl shadow-black/20 h-full flex flex-col">
            <h2 className="text-lg font-serif font-bold text-stone-100 mb-6">Upcoming Sessions</h2>
            
            {isLoading ? (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : upcomingSessions.length > 0 ? (
              <div className="space-y-4 overflow-y-auto">
                {upcomingSessions.map(s => (
                  <SessionCard 
                    key={s.id} 
                    session={s} 
                    onEdit={(session) => { setEditingSession(session); setIsModalOpen(true); }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={<Calendar size={48} className="text-stone-600" />} 
                heading="No Upcoming Sessions" 
                subtext="Schedule your first study session to get started!" 
              />
            )}
          </div>
        </div>
      </div>

      <CreateSessionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        connections={connections}
        initialData={editingSession}
        isLoading={isSubmitting}
      />

      <style jsx global>{`
        .fc { font-family: inherit; }
        .fc table { border-color: #2A282A !important; }
        .fc th, .fc td { border-color: #2A282A !important; }
        .fc .fc-toolbar-title { font-size: 1.125rem; font-family: serif; font-weight: 700; color: #F3F2F0; }
        .fc .fc-button-primary { background-color: #141314; border-color: #2A282A; color: #A8A29E; font-weight: 500; text-transform: capitalize; border-radius: 0.75rem; }
        .fc .fc-button-primary:hover { background-color: #222122; border-color: #3F3D3F; color: #F3F2F0; }
        .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: rgba(255, 85, 62, 0.15); border-color: #FF553E; color: #FF553E; }
        .fc .fc-daygrid-day.fc-day-today { background-color: rgba(255, 85, 62, 0.08) !important; }
        .fc .fc-col-header-cell-cushion { color: #A8A29E; font-size: 0.75rem; text-transform: uppercase; font-weight: 600; }
        .fc .fc-daygrid-day-number { color: #A8A29E; font-size: 0.8rem; font-weight: 500; }
        .fc .fc-event { border-radius: 6px; padding: 2px 4px; font-size: 0.75rem; border: none; cursor: pointer; font-weight: 600; }
      `}</style>
    </AppLayout>
  );
}
