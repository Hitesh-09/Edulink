'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { apiFetch } from '@/lib/api';

export default function ChatPage() {
  const { userId } = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [recipient, setRecipient] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Fetch recipient profile
        const profile = await apiFetch<any>(`/api/profile/${userId}`);
        setRecipient(profile.profile || profile);

        // Fetch existing messages (using direct supabase for now)
        const { data } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user?.id})`)
          .order('created_at', { ascending: true });

        setMessages(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    initChat();

    const channel = supabase
      .channel(`chat_${userId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'direct_messages'
      }, (payload) => {
        if (
          (payload.new.sender_id === userId && payload.new.receiver_id === currentUser?.id) ||
          (payload.new.sender_id === currentUser?.id && payload.new.receiver_id === userId)
        ) {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, currentUser?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: userId,
          content: newMessage.trim()
        });
      if (error) throw error;
      setNewMessage('');
    } catch (e) {
      console.error(e);
      setToastMessage('Failed to send message.');
    }
  };

  return (
    <AppLayout>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      
      <div className="flex flex-col h-[calc(100vh-140px)] bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/messages')}>←</Button>
            <Avatar src={recipient?.avatar_url} name={recipient?.full_name} size="md" />
            <div>
              <h3 className="font-bold text-primary-dark">{recipient?.full_name || 'Loading...'}</h3>
              <p className="text-[10px] text-green-500 font-medium">Online</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => router.push(`/profile/${userId}`)}>View Profile</Button>
        </div>

        {/* Messages area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30"
        >
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUser?.id;
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                  isMe 
                    ? 'bg-primary text-white rounded-tr-none shadow-sm' 
                    : 'bg-white border border-border text-gray-800 rounded-tl-none'
                }`}>
                  {msg.content}
                  <p className={`text-[8px] mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-border bg-white">
          <div className="flex gap-2">
            <Input 
              placeholder="Type your message..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="bg-gray-50 border-none focus:ring-1"
            />
            <Button type="submit">Send</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
