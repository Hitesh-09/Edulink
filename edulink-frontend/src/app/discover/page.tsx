'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StudentCard, StudentProfile } from '@/components/students/StudentCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiFetch } from '@/lib/api';

const AVAILABLE_INTERESTS = ['DSA', 'Web Dev', 'AI/ML', 'Cybersecurity', 'Mobile Dev', 'DevOps', 'Data Science', 'UI/UX'];
const YEARS = ['1st', '2nd', '3rd', '4th', '5th'];

export default function DiscoverPage() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, 'none'|'pending'|'connected'>>({});

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [degreeFilter, setDegreeFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (degreeFilter) params.append('degree', degreeFilter);
      if (branchFilter) params.append('branch', branchFilter);
      if (selectedYears.length) params.append('years', selectedYears.join(','));
      if (selectedInterests.length) params.append('interests', selectedInterests.join(','));

      const response = await apiFetch<any[]>(`/api/users?${params.toString()}`);
      
      // Transform backend nested structure to what the UI expects
      const mappedStudents = (response || []).map(item => ({
        ...item.profile,
        interests: item.interests,
        initialStatus: item.connectionStatus
      }));

      setStudents(mappedStudents);

      // Initialize connection statuses from backend data
      const initialStatuses: Record<string, 'none'|'pending'|'connected'> = {};
      mappedStudents.forEach(s => {
        initialStatuses[s.id] = s.initialStatus;
      });
      setConnectionStatuses(initialStatuses);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, degreeFilter, branchFilter, selectedYears, selectedInterests]);

  // Debounced search trigger
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchStudents]);

  const handleApplyFilters = () => {
    fetchStudents();
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setSelectedInterests([]);
    setSelectedYears([]);
    setDegreeFilter('');
    setBranchFilter('');
    setSearchQuery('');
  };

  const handleConnect = async (id: string) => {
    setConnectionStatuses(prev => ({ ...prev, [id]: 'pending' }));
    try {
      await apiFetch(`/api/connections/request`, {
        method: 'POST',
        body: JSON.stringify({ receiverId: id }) // Use receiverId as expected by backend
      });
    } catch (error) {
      console.error('Failed to send connection request:', error);
      setConnectionStatuses(prev => ({ ...prev, [id]: 'none' }));
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const toggleYear = (year: string) => {
    setSelectedYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Discover Students" 
        subtitle="Find and connect with peers sharing similar interests."
      />

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Mobile Filter Toggle & Search */}
        <div className="md:hidden mb-2 flex gap-2">
          <Input 
            placeholder="Search students..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            Filters
          </Button>
        </div>

        {/* Filter Sidebar */}
        <div className={`w-full md:w-64 shrink-0 bg-surface border border-border rounded-2xl p-5 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="hidden md:block mb-6">
            <Input 
              placeholder="Search by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-6">
            {/* Interests Filter */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Interests</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {AVAILABLE_INTERESTS.map(interest => (
                  <label key={interest} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded text-primary focus:ring-primary border-gray-300"
                      checked={selectedInterests.includes(interest)}
                      onChange={() => toggleInterest(interest)}
                    />
                    <span className="text-sm text-gray-700">{interest}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Year Filter */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Year</h4>
              <div className="space-y-2">
                {YEARS.map(year => (
                  <label key={year} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded text-primary focus:ring-primary border-gray-300"
                      checked={selectedYears.includes(year)}
                      onChange={() => toggleYear(year)}
                    />
                    <span className="text-sm text-gray-700">{year} Year</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Degree Filter */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Degree</h4>
              <select 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
                value={degreeFilter}
                onChange={(e) => setDegreeFilter(e.target.value)}
              >
                <option value="">All Degrees</option>
                <option value="B.Tech">B.Tech</option>
                <option value="B.Sc">B.Sc</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="M.Tech">M.Tech</option>
                <option value="MBA">MBA</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Branch</h4>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
              >
                <option value="">All Branches</option>
                <option value="CSE Core">CSE Core</option>
                <option value="CSE AIML">CSE AIML</option>
                <option value="CSE Software">CSE Software</option>
                <option value="CSE Cybersecurity">CSE Cybersecurity</option>
                <option value="CSE IT">CSE IT</option>
                <option value="CSE DS">CSE DS</option>
              </select>
            </div>

            <div className="pt-4 border-t border-border flex flex-col gap-2">
              <Button onClick={handleApplyFilters} className="w-full">Apply Filters</Button>
              <Button variant="ghost" onClick={handleClearFilters} className="w-full">Clear All</Button>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : students.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map(student => (
                <StudentCard 
                  key={student.id} 
                  profile={student} 
                  connectionStatus={connectionStatuses[student.id] || 'none'} 
                  onConnect={handleConnect} 
                />
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <EmptyState 
                icon="🔍"
                heading="No students found"
                subtext="We couldn't find any students matching your filters. Try adjusting your search criteria."
              />
            </div>
          )}
        </div>
        
      </div>
    </AppLayout>
  );
}
