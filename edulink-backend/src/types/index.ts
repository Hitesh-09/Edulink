export interface Profile {
  id: string;
  full_name: string;
  college: string;
  degree: string;
  branch: string;
  year: number;
  is_complete: boolean;
  created_at?: string;
  updated_at?: string;
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
  dailyStreak: number;
  sessionsAttended: number;
  weeklyMinutes: number[];
  connectionsCount: number;
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
