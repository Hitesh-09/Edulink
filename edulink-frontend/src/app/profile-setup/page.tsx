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
    const checkAuthAndPrefill = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      if (user.user_metadata?.full_name) {
        setFullName(user.user_metadata.full_name);
      }
    };
    checkAuthAndPrefill();
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
      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName.trim(),
          register_no: registerNo.trim().toUpperCase(),
          college: 'SRM Institute of Science and Technology',
          campus: 'KTR',
          degree,
          branch,
          year: parseInt(year) || 1,
          semester: parseInt(semester) || 1,
        }),
      });

      router.refresh();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while setting up your profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl bg-surface p-6 sm:p-10 rounded-2xl shadow-sm border border-border">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Complete Your Student Profile</h1>
          <p className="text-sm text-text-muted mt-1.5">
            Set up your academic details to access SRM resources, PYQs, and subject communities.
          </p>
        </div>

        {/* Campus Badge (Locked to KTR) */}
        <div className="mb-6 p-3.5 bg-blue-50/70 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Campus</p>
              <p className="text-sm font-medium text-text-main">SRMIST — Kattankulathur (KTR)</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold bg-primary text-white px-2.5 py-1 rounded-full">
            KTR Active
          </span>
        </div>

        {error && (
          <div className="mb-6 text-sm text-error bg-red-50 dark:bg-red-950/30 p-3.5 rounded-xl border border-red-200 dark:border-red-900/50">
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
              rightElement={<Hash className="w-4 h-4 text-text-muted" />}
            />
            <p className="text-[11px] text-text-muted">
              Enter your SRM student registration number (RA followed by digits).
            </p>
          </div>

          {/* Degree & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-main">Degree</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface text-text-main"
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
              <label className="text-sm font-medium text-text-main">Department / Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-surface text-text-main"
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
              <label className="text-sm font-medium text-text-main">Academic Year</label>
              <select
                className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface text-text-main"
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
              <label className="text-sm font-medium text-text-main">Current Semester</label>
              <select
                className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface text-text-main"
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
              className="w-full gap-2 shadow-sm"
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
