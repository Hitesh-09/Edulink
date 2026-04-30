'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConnectionCard } from '@/components/connections/ConnectionCard';
import { RequestCard } from '@/components/connections/RequestCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ConnectionsPage() {
  const supabase = createClientComponentClient();
  const [activeTab, setActiveTab] = useState<'connected' | 'received' | 'sent'>('connected');
  
  const [connections, setConnections] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchConnectionsData = async () => {
    setIsLoading(true);
    try {
      const [connData, recvData, sentData] = await Promise.all([
        apiFetch<any[]>('/api/connections'),
        apiFetch<any[]>('/api/connections/requests/received'),
        apiFetch<any[]>('/api/connections/requests/sent')
      ]);

      // Map connected users: backend returns { connection, otherUserProfile, interests }
      setConnections(connData.map(item => ({
        ...item.otherUserProfile,
        interests: item.interests
      })));

      // Map received requests: backend returns { ..., sender: { profiles } }
      setReceivedRequests(recvData.map(item => ({
        ...item,
        requester: Array.isArray(item.sender) ? item.sender[0] : item.sender
      })));

      // Map sent requests: backend returns { ..., receiver: { profiles } }
      setSentRequests(sentData.map(item => ({
        ...item,
        receiver: Array.isArray(item.receiver) ? item.receiver[0] : item.receiver
      })));
    } catch (error) {
      console.error('Failed to fetch connections data:', error);
      setConnections([]);
      setReceivedRequests([]);
      setSentRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      await fetchConnectionsData();
    };
    init();
  }, [supabase]);

  useEffect(() => {
    if (!currentUser) return;

    // Realtime subscription to connection_requests where receiver_id == currentUser.id
    const channel = supabase
      .channel('realtime_connections')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'connection_requests',
        filter: `receiver_id=eq.${currentUser.id}`
      }, (payload) => {
        setToastMessage('You received a new connection request!');
        fetchConnectionsData(); // Refresh data to show new request
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, supabase]);

  const handleAccept = async (requestId: string) => {
    try {
      await apiFetch(`/api/connections/request/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'accepted' })
      });
      setToastMessage('Connection request accepted!');
      fetchConnectionsData(); // Refetch to move from Received -> Connected
    } catch (e) {
      console.error(e);
      setToastMessage('Failed to accept request.');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await apiFetch(`/api/connections/request/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'rejected' })
      });
      setToastMessage('Connection request rejected.');
      fetchConnectionsData();
    } catch (e) {
      console.error(e);
      setToastMessage('Failed to reject request.');
    }
  };

  const handleMessage = (id: string) => {
    setToastMessage('Messaging feature coming soon!');
  };

  const handleAddToSession = (id: string) => {
    setToastMessage('Add to session feature coming soon!');
  };

  return (
    <AppLayout>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      
      <PageHeader 
        title="Connections" 
        subtitle="Manage your network and study partners."
      />

      <div className="mb-6 border-b border-border">
        <div className="flex gap-6 overflow-x-auto hide-scrollbar">
          <button
            className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'connected' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('connected')}
          >
            Connected ({connections.length})
          </button>
          <button
            className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'received' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('received')}
          >
            Received 
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'received' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}>
              {receivedRequests.length}
            </span>
          </button>
          <button
            className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'sent' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('sent')}
          >
            Sent ({sentRequests.length})
          </button>
        </div>
      </div>

      <div>
        {activeTab === 'connected' && (
          isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : connections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {connections.map((item) => (
                <ConnectionCard 
                  key={item.id} 
                  profile={item} 
                  onMessage={handleMessage} 
                  onAddToSession={handleAddToSession} 
                />
              ))}
            </div>
          ) : (
            <div className="mt-12">
              <EmptyState icon="👥" heading="No Connections Yet" subtext="Go to the Discover page to find students to connect with!" />
            </div>
          )
        )}

        {activeTab === 'received' && (
          isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : receivedRequests.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {receivedRequests.map((req) => (
                <RequestCard 
                  key={req.id} 
                  requestId={req.id}
                  profile={req.requester} 
                  type="received" 
                  onAccept={handleAccept} 
                  onReject={handleReject} 
                />
              ))}
            </div>
          ) : (
            <div className="mt-12">
              <EmptyState icon="📬" heading="No Received Requests" subtext="You don't have any pending incoming connection requests." />
            </div>
          )
        )}

        {activeTab === 'sent' && (
          isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : sentRequests.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sentRequests.map((req) => (
                <RequestCard 
                  key={req.id} 
                  profile={req.receiver} 
                  type="sent" 
                />
              ))}
            </div>
          ) : (
            <div className="mt-12">
              <EmptyState icon="🚀" heading="No Sent Requests" subtext="You haven't sent out any connection requests yet." />
            </div>
          )
        )}
      </div>

    </AppLayout>
  );
}
