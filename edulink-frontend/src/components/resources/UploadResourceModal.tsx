'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { X, UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { createResource } from '@/lib/api';

interface UploadResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDepartment?: string;
  defaultSemester?: number;
}

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
  'Computer Applications (BCA/MCA)',
  'Other',
];

const RESOURCE_TYPES = [
  { value: 'notes', label: 'Lecture Notes' },
  { value: 'pyq', label: 'Previous Year Question (PYQ)' },
  { value: 'lab_manual', label: 'Lab Manual & Records' },
  { value: 'book', label: 'Reference Book / Textbook' },
  { value: 'assignment', label: 'Assignment / Solution' },
  { value: 'syllabus', label: 'Syllabus / Guide' },
];

export function UploadResourceModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDepartment,
  defaultSemester,
}: UploadResourceModalProps) {
  const supabase = createClientComponentClient();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState('notes');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [department, setDepartment] = useState(defaultDepartment || 'CSE Core');
  const [year, setYear] = useState('2');
  const [semester, setSemester] = useState(String(defaultSemester || '3'));

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        // Derive clean title from filename
        const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    if (!title.trim() || !subjectName.trim()) {
      setError('Title and Subject Name are required');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop() || 'pdf';
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${Date.now()}_${cleanFileName}`;

      // 1. Upload to Supabase Storage 'resources' bucket
      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      // 2. Get Public URL
      const { data: urlData } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      // 3. Post resource record to API
      await createResource({
        title: title.trim(),
        description: description.trim() || undefined,
        resource_type: resourceType,
        subject_name: subjectName.trim(),
        subject_code: subjectCode.trim() ? subjectCode.trim().toUpperCase() : undefined,
        department,
        year: Number(year),
        semester: Number(semester),
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: fileExt.toLowerCase(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload resource');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-text-main">Upload Study Material</h2>
            <p className="text-xs text-text-muted">Share notes, PYQs, and manuals with fellow SRM students</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-main hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* File Picker */}
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">
              Select Document (PDF, DOCX, PPT, Images) *
            </label>
            <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-5 text-center cursor-pointer transition-colors relative bg-gray-50/50 dark:bg-gray-800/20">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium">
                  <CheckCircle size={18} className="text-emerald-500" />
                  <span className="truncate max-w-[280px]">{file.name}</span>
                  <span className="text-xs text-text-muted">({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-text-muted">
                  <UploadCloud size={28} className="text-primary/70" />
                  <span className="text-xs font-medium text-text-main">Click or drag document here</span>
                  <span className="text-[11px]">Supports PDF, DOCX up to 50MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 2 Tree Traversals & BST Detailed Notes"
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
          </div>

          {/* Resource Type & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1">
                Resource Category *
              </label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-main mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Data Structures & Algorithms"
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
          </div>

          {/* Subject Code & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1">
                Subject Code (Optional)
              </label>
              <input
                type="text"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="e.g. 21CSC201J"
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-main mb-1">
                Department / Branch *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1">
                Academic Year *
              </label>
              <select
                value={year}
                onChange={(e) => {
                  const y = e.target.value;
                  setYear(y);
                  setSemester(String((Number(y) - 1) * 2 + 1));
                }}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-main mb-1">
                Semester *
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={String(s)}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1">
              Description / Topics Covered (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Includes syllabus questions, solved proofs, and past exam patterns..."
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {uploading && <Loader2 size={16} className="animate-spin" />}
              <span>{uploading ? 'Uploading...' : 'Publish Material'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
