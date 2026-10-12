'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { StatCard } from '@/components/insights/StatCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { Toast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api';
import { 
  AlertTriangle, 
  BookOpen, 
  HelpCircle, 
  Zap, 
  X, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  GraduationCap, 
  Building2 
} from 'lucide-react';

const DEPARTMENTS = [
  'CSE Core',
  'CSE (AI & Machine Learning)',
  'CSE (Data Science)',
  'CSE (Cyber Security)',
  'CSE (Cloud Computing)',
  'CSE (Software Engineering)',
  'Information Technology (IT)',
  'Electronics & Communication (ECE)',
  'Electrical & Electronics (EEE)',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology',
  'Aerospace Engineering',
  'Automobile Engineering',
  'Computer Applications (BCA/MCA)',
  'Other'
];

const AVAILABLE_INTERESTS = [
  'DSA', 'Web Dev', 'AI/ML', 'Cybersecurity', 
  'Mobile Dev', 'DevOps', 'Data Science', 'UI/UX',
  'Cloud Computing', 'Competitive Programming'
];

/**
 * Resizes, center-crops, and compresses an image to guaranteed <= 50 KB.
 */
function compressAvatarImage(file: File, maxSizeBytes = 50 * 1024): Promise<{ blob: Blob; dataUrl: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select an image file (PNG, JPG, or WEBP).'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read the image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to process image.'));
      img.onload = () => {
        // Center crop to 1:1 aspect ratio at 256x256
        const targetSize = 256;
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas rendering is not supported on this browser.'));

        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        ctx.fillStyle = '#141314';
        ctx.fillRect(0, 0, targetSize, targetSize);
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);

        // Quality reduction loop until output is strictly under 50 KB
        let quality = 0.85;
        const tryCompress = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Image conversion failed.'));
              if (blob.size <= maxSizeBytes || q <= 0.2) {
                const dataUrl = canvas.toDataURL('image/jpeg', q);
                resolve({
                  blob,
                  dataUrl,
                  sizeKb: Math.round(blob.size / 1024),
                });
              } else {
                // Reduce quality progressively
                tryCompress(Math.max(0.15, q - 0.15));
              }
            },
            'image/jpeg',
            q
          );
        };

        tryCompress(quality);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    resourcesCount: 0,
    doubtsCount: 0,
    answersCount: 0,
  });

  const [formData, setFormData] = useState({
    fullName: '',
    registerNo: '',
    college: 'SRM Institute of Science and Technology',
    campus: 'KTR',
    degree: 'B.Tech',
    branch: 'CSE Core',
    year: '1',
    semester: '1',
    interests: [] as string[],
    avatarUrl: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      // 1. Fetch user profile directly from Supabase
      const { data: userProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileErr) {
        console.error('Error fetching profile from Supabase:', profileErr);
      }

      const activeProfile = userProfile || {
        id: user.id,
        full_name: user.user_metadata?.full_name || 'SRM Student',
        register_no: '',
        college: 'SRM Institute of Science and Technology',
        campus: 'KTR',
        degree: 'B.Tech',
        branch: 'CSE Core',
        year: 1,
        semester: 1,
        avatar_url: '',
      };

      setProfile(activeProfile);

      setFormData({
        fullName: activeProfile.full_name || '',
        registerNo: activeProfile.register_no || '',
        college: activeProfile.college || 'SRM Institute of Science and Technology',
        campus: activeProfile.campus || 'KTR',
        degree: activeProfile.degree || 'B.Tech',
        branch: activeProfile.branch || 'CSE Core',
        year: String(activeProfile.year || 1),
        semester: String(activeProfile.semester || 1),
        interests: Array.isArray(activeProfile.interests) ? activeProfile.interests : [],
        avatarUrl: activeProfile.avatar_url || '',
      });

      // 2. Fetch user activity counts directly from database
      const [resCount, doubtCount, ansCount] = await Promise.all([
        supabase.from('resources').select('id', { count: 'exact', head: true }).eq('uploaded_by', user.id),
        supabase.from('doubts').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
        supabase.from('doubt_answers').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
      ]);

      setStats({
        resourcesCount: resCount.count || 0,
        doubtsCount: doubtCount.count || 0,
        answersCount: ansCount.count || 0,
      });
    } catch (err: any) {
      console.error('Error fetching profile data:', err);
      setError(err.message || 'Failed to load profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleYearChange = (newYear: string) => {
    const yrNum = parseInt(newYear) || 1;
    const defaultSem = ((yrNum - 1) * 2 + 1).toString();
    setFormData((prev) => ({
      ...prev,
      year: newYear,
      semester: defaultSem,
    }));
  };

  const getAvailableSemesters = (currentYear: string) => {
    const yrNum = parseInt(currentYear) || 1;
    const sem1 = (yrNum - 1) * 2 + 1;
    const sem2 = (yrNum - 1) * 2 + 2;
    return [
      { value: sem1.toString(), label: `Semester ${sem1}` },
      { value: sem2.toString(), label: `Semester ${sem2}` },
    ];
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!formData.registerNo.trim()) {
      setError('Register Number is required (e.g. RA2211003010000).');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in to edit your profile.');

      const cleanedRegNo = formData.registerNo.trim().toUpperCase();

      const profilePayload = {
        full_name: formData.fullName.trim(),
        register_no: cleanedRegNo,
        college: 'SRM Institute of Science and Technology',
        campus: 'KTR',
        degree: formData.degree,
        branch: formData.branch,
        year: parseInt(formData.year) || 1,
        semester: parseInt(formData.semester) || 1,
        avatar_url: formData.avatarUrl || profile?.avatar_url || '',
        is_complete: true,
        updated_at: new Date().toISOString(),
      };

      // 1. Direct Supabase update
      const { error: dbError } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', user.id);

      if (dbError) {
        if (
          dbError.message.includes('profiles_register_no_key') ||
          dbError.message.includes('duplicate key')
        ) {
          throw new Error(`The Register Number "${cleanedRegNo}" is already registered to another account.`);
        }
        throw dbError;
      }

      // 2. Best-effort backend sync if available
      try {
        await apiFetch('/api/profile', {
          method: 'PUT',
          body: JSON.stringify({
            ...profilePayload,
            interests: formData.interests,
          }),
        });
      } catch (backendErr) {
        console.warn('Backend profile sync note:', backendErr);
      }

      setProfile((prev: any) => ({
        ...prev,
        ...profilePayload,
      }));

      setIsEditing(false);
      setToastMessage('Profile updated successfully!');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile changes.');
      setToastMessage(err.message || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again if needed
    e.target.value = '';

    setIsUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to update your avatar.');

      // 1. Client-side crop & compress down to strictly <= 50 KB
      const { blob, dataUrl, sizeKb } = await compressAvatarImage(file, 50 * 1024);

      if (blob.size > 50 * 1024) {
        throw new Error(`Image size could not be reduced below 50 KB. Current: ${sizeKb} KB.`);
      }

      let finalAvatarUrl = dataUrl;

      // 2. Try uploading compressed blob to Supabase Storage 'avatars' bucket
      try {
        const filePath = `${user.id}/avatar_${Date.now()}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          if (urlData?.publicUrl) {
            finalAvatarUrl = urlData.publicUrl;
          }
        } else {
          console.warn('Storage upload note (falling back to optimized data URL):', uploadErr.message);
        }
      } catch (storageErr) {
        console.warn('Storage bucket note:', storageErr);
      }

      // 3. Save avatar URL to profiles table
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (dbErr) throw dbErr;

      // 4. Update local state
      setFormData((prev) => ({ ...prev, avatarUrl: finalAvatarUrl }));
      setProfile((prev: any) => ({ ...prev, avatar_url: finalAvatarUrl }));
      setToastMessage(`Avatar updated successfully! (${sizeKb} KB)`);
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setError(err.message || 'Failed to upload photo. Please ensure it is an image.');
      setToastMessage(err.message || 'Failed to upload photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        registerNo: profile.register_no || '',
        college: profile.college || 'SRM Institute of Science and Technology',
        campus: profile.campus || 'KTR',
        degree: profile.degree || 'B.Tech',
        branch: profile.branch || 'CSE Core',
        year: String(profile.year || 1),
        semester: String(profile.semester || 1),
        interests: Array.isArray(profile.interests) ? profile.interests : [],
        avatarUrl: profile.avatar_url || '',
      });
    }
    setError(null);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-8 max-w-5xl mx-auto">
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
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/80 text-red-300 rounded-2xl text-xs sm:text-sm font-medium flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-stone-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="bg-[#1C1B1C] rounded-3xl border border-stone-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            
            {/* Avatar with Camera upload button (< 50 KB) */}
            <div className="relative group shrink-0">
              <div 
                onClick={handleAvatarClick}
                className="relative cursor-pointer rounded-full overflow-hidden border-4 border-stone-800 hover:border-[#FF553E] transition-all shadow-xl shadow-black/40 group"
                title="Click to upload profile photo (under 50 KB)"
              >
                <Avatar
                  src={formData.avatarUrl || profile?.avatar_url}
                  name={formData.fullName || profile?.full_name}
                  size="lg"
                  className="w-28 h-28 sm:w-32 sm:h-32 text-3xl sm:text-4xl"
                />

                {/* Loading overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white gap-1 z-20">
                    <Loader2 size={24} className="animate-spin text-[#FF553E]" />
                    <span className="text-[10px] font-semibold">Compressing...</span>
                  </div>
                )}

                {/* Hover overlay */}
                {!isUploading && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
                    <Camera size={20} className="text-[#FF553E]" />
                    <span className="text-[10px] font-bold tracking-tight">Upload Photo</span>
                    <span className="text-[9px] text-stone-300">&lt; 50 KB</span>
                  </div>
                )}
              </div>

              {/* Floating Camera Badge Button */}
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={isUploading}
                aria-label="Upload Avatar (< 50 KB)"
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#FF553E] hover:bg-[#E04732] text-white flex items-center justify-center shadow-lg shadow-[#FF553E]/30 border-2 border-[#1C1B1C] transition-transform hover:scale-110 active:scale-95"
                title="Upload Photo (Automatically optimized to under 50 KB)"
              >
                {isUploading ? (
                  <Loader2 size={15} className="animate-spin text-white" />
                ) : (
                  <Camera size={15} />
                )}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleFileChange}
              />
            </div>

            {/* Profile Info & Actions */}
            <div className="flex-1 text-center sm:text-left space-y-3 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                      {profile?.full_name || 'SRM Student'}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FF553E]/10 text-[#FF553E] border border-[#FF553E]/20">
                      <GraduationCap size={12} />
                      SRMIST KTR
                    </span>
                  </div>

                  {profile?.register_no && (
                    <p className="text-xs font-mono font-semibold text-[#FF553E] mt-1 tracking-wider">
                      Reg No: {profile.register_no}
                    </p>
                  )}

                  <p className="text-xs sm:text-sm text-stone-300 mt-1 flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                    <Building2 size={13} className="text-stone-400" />
                    <span>{profile?.college || 'SRM Institute of Science and Technology'}</span>
                  </p>

                  <p className="text-xs text-stone-400 mt-1 font-medium">
                    {profile?.degree || 'B.Tech'} • {profile?.branch || 'CSE Core'} • Year {profile?.year || 1} (Semester {profile?.semester || 1})
                  </p>
                </div>

                {/* Edit / Sign Out Buttons */}
                <div className="flex items-center justify-center sm:justify-end gap-2.5 shrink-0">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={handleSignOut}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-red-400 border border-stone-800 hover:border-red-500/30 bg-[#141314] hover:bg-red-500/10 transition-colors"
                      >
                        Sign Out
                      </button>
                      <Button onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        isLoading={isSaving}
                      >
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 text-[11px] text-stone-500 flex items-center justify-center sm:justify-start gap-1">
                <span>Avatar photo upload:</span>
                <span className="text-[#FF553E] font-medium">Auto-compressed &lt; 50 KB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity & Contribution Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            label="Resources Shared"
            value={stats.resourcesCount}
            icon={<BookOpen size={20} className="text-[#FF553E]" />}
          />
          <StatCard
            label="Questions Asked"
            value={stats.doubtsCount}
            icon={<HelpCircle size={20} className="text-[#FF553E]" />}
          />
          <StatCard
            label="Peer Solutions"
            value={stats.answersCount}
            icon={<Zap size={20} className="text-[#FF553E]" />}
          />
        </div>

        {/* Profile Details & Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Academic Details (2 Cols) */}
          <div className="lg:col-span-2 bg-[#1C1B1C] rounded-3xl border border-stone-800 p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-800">
              <h2 className="text-lg font-serif font-bold text-white">
                {isEditing ? 'Edit Academic Profile' : 'Academic Information'}
              </h2>
              {isEditing && (
                <span className="text-xs text-[#FF553E] font-medium">Editing Active</span>
              )}
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-sm">
                <div>
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Full Name</p>
                  <p className="text-base text-white font-medium mt-1">{profile?.full_name || 'Not set'}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Register Number</p>
                  <p className="text-base font-mono text-[#FF553E] font-semibold mt-1">{profile?.register_no || 'Not set'}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Degree</p>
                  <p className="text-base text-stone-200 mt-1">{profile?.degree || 'B.Tech'}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Academic Year & Semester</p>
                  <p className="text-base text-stone-200 mt-1">
                    Year {profile?.year || 1} • Semester {profile?.semester || 1}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Department / Branch</p>
                  <p className="text-base text-stone-200 mt-1">{profile?.branch || 'CSE Core'}</p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Campus & College</p>
                  <p className="text-base text-stone-200 mt-1">
                    {profile?.college || 'SRM Institute of Science and Technology'} ({profile?.campus || 'KTR'} Campus)
                  </p>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
                className="space-y-5"
              >
                {/* Full Name */}
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />

                {/* Register Number */}
                <Input
                  label="Register Number"
                  type="text"
                  placeholder="e.g. RA2211003010000"
                  value={formData.registerNo}
                  onChange={(e) => setFormData({ ...formData, registerNo: e.target.value.toUpperCase() })}
                  required
                />

                {/* Degree & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-stone-300">Degree</label>
                    <select
                      className="border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#FF553E] focus:border-[#FF553E] bg-[#141314] text-white"
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      required
                    >
                      <option value="B.Tech">B.Tech</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="BCA">BCA</option>
                      <option value="MCA">MCA</option>
                      <option value="B.Sc">B.Sc</option>
                      <option value="M.Sc">M.Sc</option>
                      <option value="MBA">MBA</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-stone-300">Department / Branch</label>
                    <select
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      className="w-full border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-1 focus:ring-[#FF553E] focus:border-[#FF553E] outline-none bg-[#141314] text-white"
                      required
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Year & Semester */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-stone-300">Academic Year</label>
                    <select
                      className="border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#FF553E] focus:border-[#FF553E] bg-[#141314] text-white"
                      value={formData.year}
                      onChange={(e) => handleYearChange(e.target.value)}
                      required
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="5">5th Year</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-stone-300">Current Semester</label>
                    <select
                      className="border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#FF553E] focus:border-[#FF553E] bg-[#141314] text-white"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      required
                    >
                      {getAvailableSemesters(formData.year).map((sem) => (
                        <option key={sem.value} value={sem.value}>
                          {sem.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <Button variant="secondary" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isSaving}>
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Interests & Study Topics (1 Col) */}
          <div className="bg-[#1C1B1C] rounded-3xl border border-stone-800 p-6 sm:p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-800">
                <h3 className="font-serif font-bold text-white text-base">Study Interests</h3>
                <span className="text-[11px] text-stone-400">
                  {formData.interests.length} selected
                </span>
              </div>
              <p className="text-xs text-stone-400 mb-4">
                Select topics you are passionate about to connect with like-minded SRM classmates.
              </p>

              <div className="flex flex-wrap gap-2">
                {AVAILABLE_INTERESTS.map((interest) => {
                  const isSelected = formData.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      disabled={!isEditing}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-[#FF553E] text-white border-[#FF553E] shadow-sm shadow-[#FF553E]/20'
                          : isEditing
                          ? 'bg-[#141314] border-stone-800 text-stone-400 hover:border-stone-700 hover:text-white cursor-pointer'
                          : 'bg-[#141314] border-stone-800 text-stone-500 opacity-60 cursor-default'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-800/80 text-[11px] text-stone-500">
              {isEditing ? (
                <span>Click topics above to add or remove them.</span>
              ) : (
                <span>Click &quot;Edit Profile&quot; to customize your study interests.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
