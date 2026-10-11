'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { GraduationCap, BookOpen, Calendar } from 'lucide-react';

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await apiFetch<any>(`/api/profile/${id}`);
        setProfile(Array.isArray(data) ? data[0] : (data?.profile || data));
      } catch (error) {
        console.error('Error fetching profile:', error);
        setToastMessage('Failed to load profile.');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await apiFetch('/api/connections/request', {
        method: 'POST',
        body: JSON.stringify({ receiverId: id })
      });
      setToastMessage('Connection request sent!');
    } catch (error) {
      setToastMessage('Failed to send request.');
    } finally {
      setIsConnecting(false);
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

  if (!profile) {
    return (
      <AppLayout>
        <div className="text-center py-20 bg-[#1C1B1C] border border-stone-800 rounded-2xl p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-serif font-bold text-stone-100">Profile not found</h2>
          <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="bg-[#1C1B1C] rounded-3xl border border-stone-800 overflow-hidden shadow-xl shadow-black/20">
          <div className="h-32 bg-gradient-to-r from-[#1C1B1C] via-[#241A18] to-[#1C1412] border-b border-stone-800" />
          <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-6 flex justify-between items-end">
              <Avatar 
                src={profile.avatar_url} 
                name={profile.full_name} 
                size="lg" 
                className="w-32 h-32 border-4 border-[#1C1B1C] shadow-2xl"
              />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => router.push(`/messages/${id}`)}>Message</Button>
                <Button onClick={handleConnect} isLoading={isConnecting}>Connect</Button>
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-100">{profile.full_name}</h1>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-2 text-stone-400 text-sm">
                <span className="flex items-center gap-1.5"><GraduationCap size={16} className="text-[#FF553E]" /> {profile.college} ({profile.campus || 'KTR'})</span>
                <span className="flex items-center gap-1.5"><BookOpen size={16} className="text-[#FF553E]" /> {profile.degree} in {profile.branch}</span>
                <span className="flex items-center gap-1.5"><Calendar size={16} className="text-[#FF553E]" /> Year {profile.year} • Sem {profile.semester || ((profile.year - 1) * 2 + 1)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="bg-[#1C1B1C] rounded-2xl border border-stone-800 p-6 shadow-xl shadow-black/20">
              <h2 className="text-lg font-serif font-bold text-stone-100 mb-4">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {profile.interests?.map((interest: any, i: number) => (
                  <Badge key={i} variant="blue">
                    {typeof interest === 'string' ? interest : interest.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-[#FF553E]/10 rounded-2xl border border-[#FF553E]/20 p-6">
                <h3 className="font-serif font-bold text-[#FF553E] mb-2">Study Style</h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Passionate about {profile.branch} and looking for collaborative study sessions!
                </p>
             </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
