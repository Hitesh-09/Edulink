export interface Profile {
  id: string;
  full_name: string;
  register_no?: string;
  college: string;
  campus: string;
  degree: string;
  branch: string;
  year: number;
  semester: number;
  avatar_url?: string;
  is_complete: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ResourceType = 'notes' | 'pyq' | 'lab_manual' | 'book' | 'assignment' | 'syllabus';

export interface Resource {
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
  created_at?: string;
  updated_at?: string;
  uploader?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    branch?: string;
  };
  has_upvoted?: boolean;
  has_bookmarked?: boolean;
}

export interface Doubt {
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
  created_at?: string;
  updated_at?: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    branch?: string;
    year?: number;
  };
  has_upvoted?: boolean;
}

export interface DoubtAnswer {
  id: string;
  doubt_id: string;
  author_id: string;
  content: string;
  is_accepted: boolean;
  upvotes_count: number;
  created_at?: string;
  updated_at?: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    branch?: string;
  };
  has_upvoted?: boolean;
}

export interface Interest {
  id: string;
  name: string;
}

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at?: string;
  updated_at?: string;
}

export interface Connection {
  id: string;
  user_a: string;
  user_b: string;
  created_at?: string;
}

export interface StudySession {
  id: string;
  creator_id: string;
  group_name: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: "upcoming" | "completed" | "cancelled";
  created_at?: string;
  updated_at?: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  created_at?: string;
}

export interface StudyLog {
  id: string;
  user_id: string;
  duration_minutes: number;
  study_date: string;
  created_at?: string;
}

export interface InsightsResponse {
  totalStudyMinutes: number;
  totalTime: string;
  dailyStreak: number;
  streak: string;
  studyStreak: number;
  sessionsAttended: number;
  totalSessions: number;
  weeklyMinutes: number[];
  connectionsCount: number;
  activeConnections: number;
}

export interface AuthUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
