'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

export default function SessionsPage() {
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
        // Extract profiles from connection items
        setConnections(connData.map((c: any) => c.friend || c.profile || c));
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
      
      await apiFetch(endpoint, {
        method,
        body: JSON.stringify(formData)
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
    title: s.title,
    start: s.date,
    color: new Date(s.date) > new Date() ? '#2563EB' : '#16A34A'
  }));

  const upcomingSessions = [...sessions]
    .filter(s => new Date(s.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <AppLayout>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      
      <PageHeader 
        title="Study Sessions" 
        subtitle="Coordinate and join study sessions with your network."
        action={
          <Button onClick={() => { setEditingSession(null); setIsModalOpen(true); }}>
            + New Session
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Column */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border p-6 shadow-sm overflow-hidden">
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
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm h-full flex flex-col">
            <h2 className="text-lg font-semibold text-primary-dark mb-6">Upcoming Sessions</h2>
            
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
                icon="📅" 
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
        .fc .fc-toolbar-title { font-size: 1.125rem; font-weight: 700; color: #1E3A5F; }
        .fc .fc-button-primary { background-color: #F9FAFB; border-color: #E5E7EB; color: #4B5563; font-weight: 500; text-transform: capitalize; }
        .fc .fc-button-primary:hover { background-color: #F3F4F6; border-color: #D1D5DB; color: #111827; }
        .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: #EFF6FF; border-color: #2563EB; color: #2563EB; }
        .fc .fc-daygrid-day.fc-day-today { background-color: #F0F9FF; }
        .fc .fc-event { border-radius: 6px; padding: 2px 4px; font-size: 0.75rem; border: none; cursor: pointer; }
      `}</style>
    </AppLayout>
  );
}
