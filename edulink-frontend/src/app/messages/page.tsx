'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function MessagesPage() {
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        // Fetch users we have connections with
        const connections = await apiFetch<any[]>('/api/connections');
        setChats(connections.map(c => ({
          id: c.otherUserProfile.id,
          name: c.otherUserProfile.full_name,
          avatar: c.otherUserProfile.avatar_url,
          lastMessage: 'Start a conversation...',
          time: ''
        })));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, []);

  return (
    <AppLayout>
      <PageHeader 
        title="Messages" 
        subtitle="Chat with your study partners and connections."
      />

      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : chats.length > 0 ? (
          <div className="divide-y divide-border">
            {chats.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => router.push(`/messages/${chat.id}`)}
                className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Avatar src={chat.avatar} name={chat.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-bold text-primary-dark truncate">{chat.name}</h3>
                    <span className="text-[10px] text-gray-400">{chat.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20">
            <EmptyState 
              icon="💬" 
              heading="No Messages Yet" 
              subtext="Connect with students in Discover to start chatting!" 
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
