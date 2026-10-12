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
export const getResources = async (params?: Record<string, string | number | undefined>): Promise<{ resources: ResourceItem[]; total: number }> => {
  const isLocalBackendBlocked = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost'));

  if (!isLocalBackendBlocked) {
    try {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== '') query.append(key, String(val));
        });
      }
      return await apiFetch<{ resources: ResourceItem[]; total: number }>(`/api/resources?${query.toString()}`);
    } catch (err) {
      console.warn('apiFetch getResources failed, falling back to direct Supabase:', err);
    }
  }

  const supabase = createClientComponentClient();
  let query = supabase
    .from('resources')
    .select('*, uploader:profiles(id, full_name, avatar_url, branch)', { count: 'exact' });

  if (params?.department && params.department !== 'All Departments') {
    query = query.eq('department', params.department);
  }
  if (params?.semester) {
    query = query.eq('semester', Number(params.semester));
  }
  if (params?.resource_type && params.resource_type !== 'all') {
    query = query.eq('resource_type', params.resource_type);
  }
  if (params?.search) {
    query = query.or(`title.ilike.%${params.search}%,subject_name.ilike.%${params.search}%`);
  }

  if (params?.sortBy === 'recent') {
    query = query.order('created_at', { ascending: false });
  } else if (params?.sortBy === 'downloads') {
    query = query.order('downloads_count', { ascending: false });
  } else {
    query = query.order('upvotes_count', { ascending: false });
  }

  if (params?.limit) {
    query = query.limit(Number(params.limit));
  }

  const { data, count, error } = await query;
  if (error) {
    console.error('Supabase getResources error:', error);
    return { resources: [], total: 0 };
  }
  return { resources: (data || []) as ResourceItem[], total: count || 0 };
};

export const getResourceById = async (id: string): Promise<ResourceItem> => {
  const isLocalBackendBlocked = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost'));

  if (!isLocalBackendBlocked) {
    try {
      return await apiFetch<ResourceItem>(`/api/resources/${id}`);
    } catch (err) {
      console.warn('apiFetch getResourceById failed, falling back to Supabase:', err);
    }
  }

  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*, uploader:profiles(id, full_name, avatar_url, branch)')
    .eq('id', id)
    .single();

  if (error || !data) throw new Error('Resource not found');
  return data as ResourceItem;
};

export const createResource = async (payload: any): Promise<ResourceItem> => {
  const isLocalBackendBlocked = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost'));

  if (!isLocalBackendBlocked) {
    try {
      return await apiFetch<ResourceItem>('/api/resources', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('apiFetch createResource failed, falling back to Supabase:', err);
    }
  }

  const supabase = createClientComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to upload resources');

  const { data, error } = await supabase
    .from('resources')
    .insert({
      ...payload,
      uploaded_by: user.id,
    })
    .select('*, uploader:profiles(id, full_name, avatar_url, branch)')
    .single();

  if (error) throw error;
  return data as ResourceItem;
};

export const upvoteResource = async (id: string): Promise<{ has_upvoted: boolean; upvotes_count: number }> => {
  const isLocalBackendBlocked = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost'));

  if (!isLocalBackendBlocked) {
    try {
      return await apiFetch<{ has_upvoted: boolean; upvotes_count: number }>(`/api/resources/${id}/upvote`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('apiFetch upvoteResource failed, falling back to Supabase:', err);
    }
  }

  const supabase = createClientComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in to upvote');

  const { data: existing } = await supabase
    .from('resource_upvotes')
    .select('id')
    .eq('resource_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: resData } = await supabase.from('resources').select('upvotes_count').eq('id', id).single();
  const currentCount = resData?.upvotes_count || 0;

  if (existing) {
    await supabase.from('resource_upvotes').delete().eq('id', existing.id);
    const newCount = Math.max(0, currentCount - 1);
    await supabase.from('resources').update({ upvotes_count: newCount }).eq('id', id);
    return { has_upvoted: false, upvotes_count: newCount };
  } else {
    await supabase.from('resource_upvotes').insert({ resource_id: id, user_id: user.id });
    const newCount = currentCount + 1;
    await supabase.from('resources').update({ upvotes_count: newCount }).eq('id', id);
    return { has_upvoted: true, upvotes_count: newCount };
  }
};

export const bookmarkResource = async (id: string): Promise<{ has_bookmarked: boolean }> => {
  const isLocalBackendBlocked = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost'));

  if (!isLocalBackendBlocked) {
    try {
      return await apiFetch<{ has_bookmarked: boolean }>(`/api/resources/${id}/bookmark`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('apiFetch bookmarkResource failed, falling back to Supabase:', err);
    }
  }

  const supabase = createClientComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in to bookmark');

  const { data: existing } = await supabase
    .from('resource_bookmarks')
    .select('id')
    .eq('resource_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from('resource_bookmarks').delete().eq('id', existing.id);
    return { has_bookmarked: false };
  } else {
    await supabase.from('resource_bookmarks').insert({ resource_id: id, user_id: user.id });
    return { has_bookmarked: true };
  }
};

export const downloadResource = async (id: string): Promise<{ success: boolean }> => {
  const isLocalBackendBlocked = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost'));

  if (!isLocalBackendBlocked) {
    try {
      return await apiFetch<{ success: boolean }>(`/api/resources/${id}/download`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('apiFetch downloadResource failed, falling back to Supabase:', err);
    }
  }

  const supabase = createClientComponentClient();
  const { data: resData } = await supabase.from('resources').select('downloads_count').eq('id', id).single();
  if (resData) {
    await supabase.from('resources').update({ downloads_count: (resData.downloads_count || 0) + 1 }).eq('id', id);
  }
  return { success: true };
};

// Doubts API
export const getDoubts = async (params?: Record<string, string | number | undefined>): Promise<{ doubts: DoubtItem[]; total: number }> => {
  const isLocalBackendBlocked = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost'));

  if (!isLocalBackendBlocked) {
    try {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== '') query.append(key, String(val));
        });
      }
      return await apiFetch<{ doubts: DoubtItem[]; total: number }>(`/api/doubts?${query.toString()}`);
    } catch (err) {
      console.warn('apiFetch getDoubts failed, falling back to Supabase:', err);
    }
  }

  const supabase = createClientComponentClient();
  let query = supabase
    .from('doubts')
    .select('*, author:profiles(id, full_name, avatar_url, branch, year)', { count: 'exact' });

  if (params?.department && params.department !== 'All Departments') {
    query = query.eq('department', params.department);
  }
  if (params?.semester) {
    query = query.eq('semester', Number(params.semester));
  }
  if (params?.status === 'unresolved') {
    query = query.eq('is_resolved', false);
  } else if (params?.status === 'resolved') {
    query = query.eq('is_resolved', true);
  }
  if (params?.search) {
    query = query.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%`);
  }

  if (params?.sortBy === 'upvotes') {
    query = query.order('upvotes_count', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  if (params?.limit) {
    query = query.limit(Number(params.limit));
  }

  const { data, count, error } = await query;
  if (error) {
    console.error('Supabase getDoubts error:', error);
    return { doubts: [], total: 0 };
  }
  return { doubts: (data || []) as DoubtItem[], total: count || 0 };
};

export const getDoubtById = async (id: string): Promise<{ doubt: DoubtItem; answers: DoubtAnswerItem[] }> => {
  const isLocalBackendBlocked = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost'));

  if (!isLocalBackendBlocked) {
    try {
      return await apiFetch<{ doubt: DoubtItem; answers: DoubtAnswerItem[] }>(`/api/doubts/${id}`);
    } catch (err) {
      console.warn('apiFetch getDoubtById failed, falling back to direct Supabase:', err);
    }
  }

  const supabase = createClientComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch doubt
  const { data: doubt, error: doubtError } = await supabase
    .from('doubts')
    .select('*, author:profiles(id, full_name, avatar_url, branch, year)')
    .eq('id', id)
    .single();

  if (doubtError || !doubt) {
    throw new Error('Doubt not found');
  }

  // 2. Fetch answers
  const { data: answersData, error: answersError } = await supabase
    .from('doubt_answers')
    .select('*, author:profiles(id, full_name, avatar_url, branch)')
    .eq('doubt_id', id)
    .order('is_accepted', { ascending: false })
    .order('upvotes_count', { ascending: false })
    .order('created_at', { ascending: true });

  if (answersError) {
    console.error('Error fetching answers:', answersError);
  }

  const rawAnswers = answersData || [];

  let has_upvoted = false;
  let userUpvotedAnswers = new Set<string>();

  if (user) {
    const { data: doubtUpvote } = await supabase
      .from('doubt_upvotes')
      .select('id')
      .eq('doubt_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    has_upvoted = Boolean(doubtUpvote);

    if (rawAnswers.length > 0) {
      const { data: answerUpvotes } = await supabase
        .from('answer_upvotes')
        .select('answer_id')
        .eq('user_id', user.id)
        .in('answer_id', rawAnswers.map((a: any) => a.id));

      userUpvotedAnswers = new Set((answerUpvotes || []).map((u: any) => u.answer_id));
    }
  }

  const answers: DoubtAnswerItem[] = rawAnswers.map((a: any) => ({
    ...a,
    has_upvoted: userUpvotedAnswers.has(a.id),
  }));

  return {
    doubt: {
      ...doubt,
      has_upvoted,
    } as DoubtItem,
    answers,
  };
};

export const createDoubt = async (payload: any): Promise<DoubtItem> => {
  const isLocalBackendBlocked = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost'));

  if (!isLocalBackendBlocked) {
    try {
      return await apiFetch<DoubtItem>('/api/doubts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('apiFetch createDoubt failed, falling back to Supabase:', err);
    }
  }

  const supabase = createClientComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to ask doubts');

  const { data, error } = await supabase
    .from('doubts')
    .insert({
      ...payload,
      author_id: user.id,
    })
    .select('*, author:profiles(id, full_name, avatar_url, branch, year)')
    .single();

  if (error) throw error;
  return data as DoubtItem;
};

export const postDoubtAnswer = async (doubtId: string, content: string): Promise<DoubtAnswerItem> => {
  const isLocalBackendBlocked = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost'));

  if (!isLocalBackendBlocked) {
    try {
      return await apiFetch<DoubtAnswerItem>(`/api/doubts/${doubtId}/answers`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    } catch (err) {
      console.warn('apiFetch postDoubtAnswer failed, falling back to Supabase:', err);
    }
  }

  const supabase = createClientComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to post an answer');

  const { data, error } = await supabase
    .from('doubt_answers')
    .insert({
      doubt_id: doubtId,
      author_id: user.id,
      content,
    })
    .select('*, author:profiles(id, full_name, avatar_url, branch)')
    .single();

  if (error) throw error;

  // Increment answers_count
  const { data: currentDoubt } = await supabase.from('doubts').select('answers_count').eq('id', doubtId).single();
  if (currentDoubt) {
    await supabase.from('doubts').update({ answers_count: (currentDoubt.answers_count || 0) + 1 }).eq('id', doubtId);
  }

  return data as DoubtAnswerItem;
};

export const upvoteDoubt = async (id: string): Promise<{ has_upvoted: boolean; upvotes_count: number }> => {
  const isLocalBackendBlocked = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost'));

  if (!isLocalBackendBlocked) {
    try {
      return await apiFetch<{ has_upvoted: boolean; upvotes_count: number }>(`/api/doubts/${id}/upvote`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('apiFetch upvoteDoubt failed, falling back to Supabase:', err);
    }
  }

  const supabase = createClientComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in to upvote');

  const { data: existing } = await supabase
    .from('doubt_upvotes')
    .select('id')
    .eq('doubt_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: doubt } = await supabase.from('doubts').select('upvotes_count').eq('id', id).single();
  const currentCount = doubt?.upvotes_count || 0;

  if (existing) {
    await supabase.from('doubt_upvotes').delete().eq('id', existing.id);
    const newCount = Math.max(0, currentCount - 1);
    await supabase.from('doubts').update({ upvotes_count: newCount }).eq('id', id);
    return { has_upvoted: false, upvotes_count: newCount };
  } else {
    await supabase.from('doubt_upvotes').insert({ doubt_id: id, user_id: user.id });
    const newCount = currentCount + 1;
    await supabase.from('doubts').update({ upvotes_count: newCount }).eq('id', id);
    return { has_upvoted: true, upvotes_count: newCount };
  }
};

export const upvoteAnswer = async (answerId: string): Promise<{ has_upvoted: boolean; upvotes_count: number }> => {
  const isLocalBackendBlocked = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost'));

  if (!isLocalBackendBlocked) {
    try {
      return await apiFetch<{ has_upvoted: boolean; upvotes_count: number }>(`/api/doubts/answers/${answerId}/upvote`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('apiFetch upvoteAnswer failed, falling back to Supabase:', err);
    }
  }

  const supabase = createClientComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in to upvote');

  const { data: existing } = await supabase
    .from('answer_upvotes')
    .select('id')
    .eq('answer_id', answerId)
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: answer } = await supabase.from('doubt_answers').select('upvotes_count').eq('id', answerId).single();
  const currentCount = answer?.upvotes_count || 0;

  if (existing) {
    await supabase.from('answer_upvotes').delete().eq('id', existing.id);
    const newCount = Math.max(0, currentCount - 1);
    await supabase.from('doubt_answers').update({ upvotes_count: newCount }).eq('id', answerId);
    return { has_upvoted: false, upvotes_count: newCount };
  } else {
    await supabase.from('answer_upvotes').insert({ answer_id: answerId, user_id: user.id });
    const newCount = currentCount + 1;
    await supabase.from('doubt_answers').update({ upvotes_count: newCount }).eq('id', answerId);
    return { has_upvoted: true, upvotes_count: newCount };
  }
};

export const acceptAnswer = async (answerId: string): Promise<{ success: boolean }> => {
  const isLocalBackendBlocked = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost'));

  if (!isLocalBackendBlocked) {
    try {
      return await apiFetch<{ success: boolean }>(`/api/doubts/answers/${answerId}/accept`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('apiFetch acceptAnswer failed, falling back to Supabase:', err);
    }
  }

  const supabase = createClientComponentClient();
  const { data: answer } = await supabase.from('doubt_answers').select('doubt_id').eq('id', answerId).single();
  if (!answer) throw new Error('Answer not found');

  await supabase.from('doubt_answers').update({ is_accepted: false }).eq('doubt_id', answer.doubt_id);
  await supabase.from('doubt_answers').update({ is_accepted: true }).eq('id', answerId);
  await supabase.from('doubts').update({ is_resolved: true }).eq('id', answer.doubt_id);

  return { success: true };
};
