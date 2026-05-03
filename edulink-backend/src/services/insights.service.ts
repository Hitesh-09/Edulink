import { supabase } from "../lib/supabase";
import { InsightsResponse, StudyLog } from "../types";

const appError = (message: string, status = 500): Error & { status: number } => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

const normalizeDateKey = (date: Date): string => date.toISOString().slice(0, 10);

/** Calculates aggregate insights dashboard data for a user. */
export const getUserInsights = async (userId: string): Promise<InsightsResponse> => {
  const { data: studyLogs, error: logsError } = await supabase
    .from("study_logs")
    .select("*")
    .eq("user_id", userId)
    .order("study_date", { ascending: false });
  if (logsError) throw appError("Failed to fetch study logs");

  const logs = (studyLogs ?? []) as StudyLog[];
  const totalStudyMinutes = logs.reduce((sum, log) => sum + log.duration_minutes, 0);

  const logDates = new Set(logs.map((log) => normalizeDateKey(new Date(log.study_date))));
  let dailyStreak = 0;
  let cursor = new Date();
  while (logDates.has(normalizeDateKey(cursor))) {
    dailyStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const monday = new Date();
  const weekday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - weekday);
  monday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);

  const weeklyMinutes = [0, 0, 0, 0, 0, 0, 0];
  for (const log of logs) {
    const date = new Date(log.study_date);
    if (date >= monday && date < nextMonday) {
      const index = (date.getDay() + 6) % 7;
      weeklyMinutes[index] += log.duration_minutes;
    }
  }

  const { count: sessionsAttended, error: sessionsError } = await supabase
    .from("session_participants")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (sessionsError) throw appError("Failed to fetch sessions attended");

  const { count: connectionsCount, error: connectionsError } = await supabase
    .from("connections")
    .select("*", { count: "exact", head: true })
    .or(`user_a.eq.${userId},user_b.eq.${userId}`);
  if (connectionsError) throw appError("Failed to fetch connections count");

  return {
    totalStudyMinutes,
    dailyStreak,
    sessionsAttended: sessionsAttended ?? 0,
    weeklyMinutes,
    connectionsCount: connectionsCount ?? 0,
  };
};
