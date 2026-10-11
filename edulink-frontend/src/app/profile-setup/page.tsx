'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiFetch } from '@/lib/api';
import { GraduationCap, Building2, BookOpen, Hash } from 'lucide-react';

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

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [authChecking, setAuthChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [registerNo, setRegisterNo] = useState('');
  const [degree, setDegree] = useState('B.Tech');
  const [branch, setBranch] = useState('CSE Core');
  const [year, setYear] = useState('1');
  const [semester, setSemester] = useState('1');

  useEffect(() => {
    let active = true;

    const checkAuthAndPrefill = async () => {
      // 1. Try getSession first
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        if (active) {
          if (session.user.user_metadata?.full_name) {
            setFullName(session.user.user_metadata.full_name);
          }
          setAuthChecking(false);
        }
        return;
      }

      // 2. Try getUser fallback
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (active) {
          if (user.user_metadata?.full_name) {
            setFullName(user.user_metadata.full_name);
          }
          setAuthChecking(false);
        }
        return;
      }

      // 3. Listen for incoming auth event (e.g. OAuth processing)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
        if (active) {
          if (s?.user) {
            if (s.user.user_metadata?.full_name) {
              setFullName(s.user.user_metadata.full_name);
            }
            setAuthChecking(false);
          } else if (event === 'SIGNED_OUT') {
            router.push('/auth');
          }
        }
      });

      // Give it up to 2 seconds to settle before bouncing to /auth
      const timeout = setTimeout(() => {
        if (active && authChecking) {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (!s?.user && active) {
              router.push('/auth');
            } else if (s?.user && active) {
              setAuthChecking(false);
            }
          });
        }
      }, 2000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    };

    checkAuthAndPrefill();

    return () => {
      active = false;
    };
  }, [supabase, router]);

  // Sync default semester when year changes
  const handleYearChange = (newYear: string) => {
    setYear(newYear);
    const yrNum = parseInt(newYear) || 1;
    const defaultSem = ((yrNum - 1) * 2 + 1).toString();
    setSemester(defaultSem);
  };

  const getAvailableSemesters = (currentYear: string) => {
    const yrNum = parseInt(currentYear) || 1;
    const sem1 = (yrNum - 1) * 2 + 1;
    const sem2 = (yrNum - 1) * 2 + 2;
    return [
      { value: sem1.toString(), label: `Semester ${sem1}` },
      { value: sem2.toString(), label: `Semester ${sem2}` }
    ];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!registerNo.trim()) {
      setError('Register Number is required (e.g. RA2211003010000).');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user session found. Please sign in again.');
      }

      const profilePayload = {
        id: user.id,
        full_name: fullName.trim(),
        register_no: registerNo.trim().toUpperCase(),
        college: 'SRM Institute of Science and Technology',
        campus: 'KTR',
        degree,
        branch,
        year: parseInt(year) || 1,
        semester: parseInt(semester) || 1,
        is_complete: true,
        updated_at: new Date().toISOString(),
      };

      // 1. Direct Supabase update
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert(profilePayload);

      if (dbError) {
        console.error('Direct profile upsert error:', dbError);
      }

      // 2. Best-effort sync with backend Express API
      try {
        await apiFetch('/api/profile', {
          method: 'PUT',
          body: JSON.stringify(profilePayload),
        });
      } catch (apiErr) {
        console.warn('Backend profile sync non-fatal warning:', apiErr);
      }

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while setting up your profile.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#141314] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-stone-400">
          <div className="w-10 h-10 border-2 border-[#FF553E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium font-serif">Verifying your SRM account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141314] text-[#F3F2F0] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl bg-[#1C1B1C] p-6 sm:p-10 rounded-3xl shadow-2xl border border-stone-800">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#FF553E]/10 border border-[#FF553E]/20 text-[#FF553E] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">Complete Your Student Profile</h1>
          <p className="text-sm text-stone-400 mt-2 font-normal">
            Set up your academic details to access SRM resources, PYQs, and subject communities.
          </p>
        </div>

        {/* Campus Badge (Locked to KTR) */}
        <div className="mb-6 p-4 bg-[#141314] rounded-2xl border border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF553E]/10 text-[#FF553E] flex items-center justify-center">
              <Building2 className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#FF553E] uppercase tracking-wider">Campus</p>
              <p className="text-sm font-medium text-white">SRMIST — Kattankulathur (KTR)</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold bg-[#FF553E] text-white px-3 py-1 rounded-full shadow-sm shadow-[#FF553E]/20">
            KTR Active
          </span>
        </div>

        {error && (
          <div className="mb-6 text-sm text-red-400 bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          {/* Register Number */}
          <div className="space-y-1.5">
            <Input
              label="Register Number"
              type="text"
              placeholder="e.g. RA2211003010000"
              value={registerNo}
              onChange={(e) => setRegisterNo(e.target.value.toUpperCase())}
              required
              rightElement={<Hash className="w-4 h-4 text-stone-500" />}
            />
            <p className="text-[11px] text-stone-500">
              Enter your SRM student registration number (RA followed by digits).
            </p>
          </div>

          {/* Degree & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-300">Degree</label>
              <select
                className="w-full border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#FF553E]/50 focus:border-[#FF553E] bg-[#141314] text-white"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                required
              >
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="B.Sc">B.Sc</option>
                <option value="M.Sc">M.Sc</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-300">Department / Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-[#FF553E]/50 focus:border-[#FF553E] outline-none bg-[#141314] text-white"
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
              <label className="text-sm font-medium text-stone-300">Academic Year</label>
              <select
                className="border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#FF553E]/50 focus:border-[#FF553E] bg-[#141314] text-white"
                value={year}
                onChange={(e) => handleYearChange(e.target.value)}
                required
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-300">Current Semester</label>
              <select
                className="border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#FF553E]/50 focus:border-[#FF553E] bg-[#141314] text-white"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                required
              >
                {getAvailableSemesters(year).map((sem) => (
                  <option key={sem.value} value={sem.value}>
                    {sem.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              size="lg"
              className="w-full gap-2 shadow-lg shadow-[#FF553E]/20"
              isLoading={isLoading}
            >
              <BookOpen className="w-4 h-4" />
              Complete Setup & Enter Platform
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
