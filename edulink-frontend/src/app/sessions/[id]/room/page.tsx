'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function StudyRoomPage() {
  const { id: sessionId } = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchRoomData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const [sessionData, messageData] = await Promise.all([
        apiFetch<any>(`/api/sessions/${sessionId}`),
        // Since we don't have a messages API yet, we'll use a placeholder or Supabase directly
        supabase.from('session_messages').select('*, profiles(full_name, avatar_url)').eq('session_id', sessionId).order('created_at', { ascending: true })
      ]);

      setSession(sessionData);
      setMessages(messageData.data || []);
    } catch (error) {
      console.error('Error loading room:', error);
      setToastMessage('Failed to load study room.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomData();

    // Subscribe to new messages
    const channel = supabase
      .channel(`room_${sessionId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'session_messages',
        filter: `session_id=eq.${sessionId}`
      }, async (payload) => {
        // Fetch the profile for the new message
        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', payload.new.user_id).single();
        setMessages(prev => [...prev, { ...payload.new, profiles: profile }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      const { error } = await supabase
        .from('session_messages')
        .insert({
          session_id: sessionId,
          user_id: currentUser.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setToastMessage('Failed to send message.');
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Room Header */}
        <div className="bg-surface border border-border rounded-2xl p-4 mb-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>← Back</Button>
            <div>
              <h1 className="text-xl font-bold text-primary-dark">{session?.group_name}</h1>
              <p className="text-xs text-gray-500">Live Study Session • {session?.participants?.length || 0} participants</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="blue" className="animate-pulse">Live</Badge>
            <Button variant="secondary" size="sm" onClick={() => setToastMessage('Recording coming soon!')}>Record</Button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
          {/* Main Stage (Video/Content) */}
          <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
            <div className="flex-1 bg-black rounded-2xl relative overflow-hidden flex items-center justify-center group shadow-inner">
              {/* Video Grid Placeholder */}
              <div className="grid grid-cols-2 gap-4 p-4 w-full h-full max-w-4xl mx-auto">
                {session?.participants?.map((p: any, i: number) => (
                  <div key={i} className="aspect-video bg-gray-900 rounded-xl relative overflow-hidden flex items-center justify-center border border-gray-800">
                    <Avatar 
                      src={p.profile?.avatar_url} 
                      name={p.profile?.full_name} 
                      size="lg" 
                      className="w-20 h-20 opacity-50"
                    />
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-xs text-white font-medium bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                        {p.profile?.full_name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors">🎤</button>
                <button className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors">📹</button>
                <button className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors">🖥️</button>
                <button className="w-12 h-10 rounded-2xl bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors" onClick={() => router.back()}>End</button>
              </div>
            </div>

            {/* Shared Resources */}
            <div className="h-32 bg-surface border border-border rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-primary-dark mb-2">Shared Resources</h3>
              <div className="flex gap-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-blue-100 transition-colors">
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="text-xs font-bold text-primary">Notes.pdf</p>
                    <p className="text-[10px] text-gray-500">Shared by {session?.participants?.[0]?.profile?.full_name || 'Host'}</p>
                  </div>
                </div>
                <button className="w-32 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary hover:text-primary transition-all">
                  <span className="text-lg">+</span>
                  <span className="text-[10px] font-bold">Add Link/File</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar (Chat & Participants) */}
          <div className="bg-surface border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border">
              <h3 className="font-bold text-primary-dark">Session Chat</h3>
            </div>
            
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.user_id === currentUser?.id ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-gray-500">{msg.profiles?.full_name}</span>
                    <span className="text-[8px] text-gray-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                    msg.user_id === currentUser?.id 
                      ? 'bg-primary text-white rounded-tr-none shadow-sm' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-gray-50">
              <div className="flex gap-2">
                <Input 
                  placeholder="Type a message..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="bg-white"
                />
                <Button type="submit" size="sm">Send</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
