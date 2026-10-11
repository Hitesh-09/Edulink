import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const supabase = createClientComponentClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
      ...options?.headers,
    },
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = errorText;
    try {
      const parsed = JSON.parse(errorText);
      errorMessage = parsed.error || parsed.message || errorText;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }
  
  return res.json();
}

export type ResourceType = 'notes' | 'pyq' | 'lab_manual' | 'book' | 'assignment' | 'syllabus';

export interface ResourceItem {
  id: string;
  title: string;
  description?: string;
  resource_type: ResourceType;
  subject_name: string;
  subject_code?: string;
  department: string;
  year: number;
  semester: number;
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  uploaded_by: string;
  upvotes_count: number;
  downloads_count: number;
  views_count: number;
  created_at: string;
  uploader?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    branch?: string;
  };
  has_upvoted?: boolean;
  has_bookmarked?: boolean;
}

export interface DoubtItem {
  id: string;
  title: string;
  content: string;
  subject_name: string;
  department?: string;
  year?: number;
  semester?: number;
  tags?: string[];
  author_id: string;
  is_resolved: boolean;
  upvotes_count: number;
  answers_count: number;
  views_count: number;
  created_at: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    branch?: string;
    year?: number;
  };
  has_upvoted?: boolean;
}

export interface DoubtAnswerItem {
  id: string;
  doubt_id: string;
  author_id: string;
  content: string;
  is_accepted: boolean;
  upvotes_count: number;
  created_at: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    branch?: string;
  };
  has_upvoted?: boolean;
}

// Resources API
export const getResources = (params?: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') query.append(key, String(val));
    });
  }
  return apiFetch<{ resources: ResourceItem[]; total: number }>(`/api/resources?${query.toString()}`);
};

export const getResourceById = (id: string) => {
  return apiFetch<ResourceItem>(`/api/resources/${id}`);
};

export const createResource = (payload: any) => {
  return apiFetch<ResourceItem>('/api/resources', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const upvoteResource = (id: string) => {
  return apiFetch<{ has_upvoted: boolean; upvotes_count: number }>(`/api/resources/${id}/upvote`, {
    method: 'POST',
  });
};

export const bookmarkResource = (id: string) => {
  return apiFetch<{ has_bookmarked: boolean }>(`/api/resources/${id}/bookmark`, {
    method: 'POST',
  });
};

export const downloadResource = (id: string) => {
  return apiFetch<{ success: boolean }>(`/api/resources/${id}/download`, {
    method: 'POST',
  });
};

// Doubts API
export const getDoubts = (params?: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') query.append(key, String(val));
    });
  }
  return apiFetch<{ doubts: DoubtItem[]; total: number }>(`/api/doubts?${query.toString()}`);
};

export const getDoubtById = (id: string) => {
  return apiFetch<{ doubt: DoubtItem; answers: DoubtAnswerItem[] }>(`/api/doubts/${id}`);
};

export const createDoubt = (payload: any) => {
  return apiFetch<DoubtItem>('/api/doubts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const postDoubtAnswer = (doubtId: string, content: string) => {
  return apiFetch<DoubtAnswerItem>(`/api/doubts/${doubtId}/answers`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
};

export const upvoteDoubt = (id: string) => {
  return apiFetch<{ has_upvoted: boolean; upvotes_count: number }>(`/api/doubts/${id}/upvote`, {
    method: 'POST',
  });
};

export const upvoteAnswer = (answerId: string) => {
  return apiFetch<{ has_upvoted: boolean; upvotes_count: number }>(`/api/doubts/answers/${answerId}/upvote`, {
    method: 'POST',
  });
};

export const acceptAnswer = (answerId: string) => {
  return apiFetch<{ success: boolean }>(`/api/doubts/answers/${answerId}/accept`, {
    method: 'POST',
  });
};
