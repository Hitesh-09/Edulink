'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiFetch } from '@/lib/api';

const AVAILABLE_INTERESTS = [
  'DSA', 'Web Dev', 'AI/ML', 'Cybersecurity',
  'Mobile Dev', 'DevOps', 'Data Science', 'UI/UX'
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [degree, setDegree] = useState('B.Tech');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('1st');
  const [interests, setInterests] = useState<string[]>([]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !college || !branch) {
      setError('Please fill in all required fields.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleSubmit = async () => {
    if (interests.length === 0) {
      setError('Please select at least 1 interest.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName,
          college: college,
          degree: degree,
          branch: branch,
          year: parseInt(year),
          interests: interests
        }),
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl bg-surface p-6 sm:p-10 rounded-2xl shadow-sm border border-border">

        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500 ease-in-out"
              style={{ width: step === 1 ? '50%' : '100%' }}
            ></div>

            <div className={`relative z-10 flex flex-col items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-colors duration-300 ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                1
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide">Academic Info</span>
            </div>

            <div className={`relative z-10 flex flex-col items-center ${step === 2 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-colors duration-300 ${step === 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                2
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide">Interests</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 text-sm text-error bg-red-50 p-3 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {/* Form Steps */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-bold text-primary-dark">Academic Information</h2>
              <p className="text-sm text-gray-500 mt-1">Let's get to know your academic background.</p>
            </div>

            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">College / University</label>
                <select
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                  required
                >
                  <option value="" disabled>Select your college</option>
                  <option value="SRM Institute of Science and Technology">SRM Institute of Science and Technology</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Branch / Major</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                  required
                >
                  <option value="" disabled>Select your branch</option>
                  <option value="CSE Core">CSE Core</option>
                  <option value="CSE AIML">CSE AIML</option>
                  <option value="CSE Software">CSE Software</option>
                  <option value="CSE Cybersecurity">CSE Cybersecurity</option>
                  <option value="CSE IT">CSE IT</option>
                  <option value="CSE DS">CSE DS</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Degree</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
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
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                  <option value="5th">5th Year</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" size="lg">Next Step</Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h2 className="text-xl font-bold text-primary-dark">Select Your Interests</h2>
              <p className="text-sm text-gray-500 mt-1">Choose topics you'd like to study and collaborate on (select at least 1).</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {AVAILABLE_INTERESTS.map(interest => {
                const isSelected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors border flex items-center justify-center text-center ${isSelected
                        ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-inner'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-between">
              <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)} disabled={isLoading}>
                Back
              </Button>
              <Button type="button" size="lg" onClick={handleSubmit} isLoading={isLoading}>
                Complete Profile
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
