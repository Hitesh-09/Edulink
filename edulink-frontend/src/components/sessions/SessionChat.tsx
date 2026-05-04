'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { MessageSquare } from 'lucide-react';

interface SessionChatProps {
  sessionId: string;
  currentUser: any;
}

export default function SessionChat({ sessionId, currentUser }: SessionChatProps) {
  const supabase = createClientComponentClient();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // 1. Fetch existing messages when the room opens
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('session_messages')
        .select('*, profiles(full_name, avatar_url)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // 2. Subscribe to LIVE incoming messages
    const channel = supabase.channel(`room_${sessionId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'session_messages',
        filter: `session_id=eq.${sessionId}` 
      }, async (payload) => {
        // Fetch the sender's profile info for the new message
        const senderId = payload.new.user_id || payload.new.sender_id;
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', senderId)
          .single();
          
        const newMsg = { ...payload.new, profiles: profileData };
        setMessages((prev) => [...prev, newMsg]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage;
    setNewMessage(''); // Clear input optimistically
    setIsSending(true);

    try {
      const { error } = await supabase.from('session_messages').insert({
        session_id: sessionId,
        user_id: currentUser.id,
        content: messageText
      });
      
      if (error) {
        // Fallback for different schema if user_id column doesn't exist
        const { error: error2 } = await supabase.from('session_messages').insert({
          session_id: sessionId,
          sender_id: currentUser.id,
          content: messageText
        });
        if (error2) throw error2;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please check if the session_messages table exists in your Supabase DB.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
      {/* Chat Header */}
      <div className="bg-gray-50/50 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-primary-dark">Live Session Discussion</h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-10">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-primary">
              <MessageSquare size={32} />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">No messages yet</h4>
            <p className="text-sm text-gray-500 max-w-[200px]">Start the conversation with your study group!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.user_id === currentUser.id;
            return (
              <div key={idx} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                <Avatar 
                  src={msg.profiles?.avatar_url} 
                  name={msg.profiles?.full_name} 
                  size="sm" 
                  className="shadow-sm border border-white"
                />
                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <p className="text-[10px] font-bold text-gray-500 mb-1 ml-1">
                      {msg.profiles?.full_name}
                    </p>
                  )}
                  <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all hover:shadow-md ${
                    isMe 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white border border-border text-gray-800 rounded-tl-none'
                  }`}>
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1.5 px-1 font-medium">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-border">
        <div className="flex gap-2 bg-gray-50 p-1.5 rounded-xl border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Discuss with the group..."
            className="flex-1 bg-transparent border-none rounded-lg px-3 py-2 text-sm outline-none focus:ring-0"
          />
          <Button 
            type="submit" 
            size="sm"
            disabled={!newMessage.trim() || isSending}
            className="px-6 shadow-md shadow-primary/10"
          >
            {isSending ? '...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}
