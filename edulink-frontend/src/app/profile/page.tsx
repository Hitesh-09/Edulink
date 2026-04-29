'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { StatCard } from '@/components/insights/StatCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { Toast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api';

const AVAILABLE_INTERESTS = [
  'DSA', 'Web Dev', 'AI/ML', 'Cybersecurity', 
  'Mobile Dev', 'DevOps', 'Data Science', 'UI/UX'
];

export default function ProfilePage() {
  const supabase = createClientComponentClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    full_name: '',
    college: '',
    degree: 'B.Tech',
    branch: '',
    year: 1,
    interests: [] as string[]
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileData, insightsData] = await Promise.all([
        apiFetch<any>(`/api/profile/${user.id}`),
        apiFetch<any>('/api/insights')
      ]);

      setProfile(profileData);
      setInsights(insightsData || {
        totalSessions: 0,
        connectionsCount: 0,
        studyStreak: 0
      });
      
      setFormData({
        full_name: profileData.full_name || '',
        college: profileData.college || '',
        degree: profileData.degree || 'B.Tech',
        branch: profileData.branch || '',
        year: profileData.year || 1,
        interests: (profileData.interests || []).map((i: any) => i.name || i)
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setToastMessage('Failed to load profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
      setToastMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      setToastMessage('Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...formData, avatar_url: publicUrl })
      });

      setProfile({ ...profile, avatar_url: publicUrl });
      setToastMessage('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setToastMessage('Failed to upload avatar.');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev: any) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i: string) => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <SkeletonCard />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      
      {/* Profile Header */}
      <div className="bg-surface rounded-2xl border border-border p-8 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div 
            className={`relative group ${isEditing ? 'cursor-pointer' : ''}`}
            onClick={handleAvatarClick}
          >
            <Avatar 
              src={profile?.avatar_url} 
              name={profile?.full_name} 
              size="lg" 
              className={`w-32 h-32 text-4xl border-4 ${isEditing ? 'border-primary group-hover:opacity-75 transition-opacity' : 'border-white'}`}
            />
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="bg-black/50 p-2 rounded-full text-xs font-bold">Change</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-primary-dark">{profile?.full_name}</h1>
                <p className="text-lg text-gray-600">{profile?.college}</p>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                  {profile?.degree} • {profile?.branch} • Year {profile?.year}
                </p>
              </div>
              <div className="flex justify-center md:justify-end">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                ) : (
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} isLoading={isSaving}>Save Changes</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Total Sessions" value={insights?.totalSessions || 0} icon="📚" />
        <StatCard label="Connections" value={insights?.connectionsCount || 0} icon="🤝" />
        <StatCard label="Study Streak" value={`${insights?.studyStreak || 0} Days`} icon="🔥" />
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Academic Info */}
        <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
          <h2 className="text-xl font-bold text-primary-dark mb-6">Academic Details</h2>
          <div className="space-y-6">
            {!isEditing ? (
              <div className="grid grid-cols-2 gap-y-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Degree</p>
                  <p className="text-base text-gray-900 mt-1 font-medium">{profile?.degree}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Year</p>
                  <p className="text-base text-gray-900 mt-1 font-medium">{profile?.year}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">Branch</p>
                  <p className="text-base text-gray-900 mt-1 font-medium">{profile?.branch}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">College</p>
                  <p className="text-base text-gray-900 mt-1 font-medium">{profile?.college}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Degree</label>
                    <select 
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
                      value={formData.degree}
                      onChange={(e) => setFormData({...formData, degree: e.target.value})}
                    >
                      <option value="B.Tech">B.Tech</option>
                      <option value="B.Sc">B.Sc</option>
                      <option value="BCA">BCA</option>
                      <option value="MCA">MCA</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="MBA">MBA</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Year</label>
                    <select 
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                    >
                      {[1,2,3,4,5].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <Input 
                  label="Branch" 
                  value={formData.branch} 
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                />
                <Input 
                  label="College" 
                  value={formData.college} 
                  onChange={(e) => setFormData({...formData, college: e.target.value})}
                />
              </div>
            )}
          </div>
        </div>

        {/* Interests */}
        <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
          <h2 className="text-xl font-bold text-primary-dark mb-6">Study Interests</h2>
          <div className="flex flex-wrap gap-2">
            {!isEditing ? (
              profile?.interests?.map((interest: any) => (
                <span 
                  key={interest.id || interest} 
                  className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-sm font-medium"
                >
                  {interest.name || interest}
                </span>
              ))
            ) : (
              AVAILABLE_INTERESTS.map(interest => {
                const isSelected = formData.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                      isSelected 
                        ? 'bg-purple-100 border-purple-300 text-purple-700 shadow-inner' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
