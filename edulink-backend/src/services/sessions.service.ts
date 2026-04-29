import { supabase } from "../lib/supabase";

type CreateSessionPayload = {
  groupName: string;
  description?: string;
  participantIds: string[];
  scheduledAt: string;
  durationMinutes: number;
};

const appError = (message: string, status = 500): Error & { status: number } => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

const isConnected = async (userId: string, peerId: string): Promise<boolean> => {
  const [userA, userB] = [userId, peerId].sort();
  const { data, error } = await supabase
    .from("connections")
    .select("id")
    .eq("user_a", userA)
    .eq("user_b", userB)
    .limit(1);
  if (error) throw appError("Failed to validate participant connections");
  return (data ?? []).length > 0;
};

/** Creates a study session and enrolls all participants. */
export const createSession = async (creatorId: string, payload: CreateSessionPayload) => {
  const uniqueParticipantIds = [...new Set(payload.participantIds.filter((id) => id !== creatorId))];
  for (const participantId of uniqueParticipantIds) {
    if (!(await isConnected(creatorId, participantId))) {
      throw appError("All participants must be connected with the creator", 400);
    }
  }

  const { data: session, error: sessionError } = await supabase
    .from("study_sessions")
    .insert({
      creator_id: creatorId,
      group_name: payload.groupName,
      description: payload.description ?? null,
      scheduled_at: payload.scheduledAt,
      duration_minutes: payload.durationMinutes,
      status: "upcoming",
    })
    .select("*")
    .single();

  if (sessionError || !session) throw appError("Failed to create study session");

  const participantRows = [creatorId, ...uniqueParticipantIds].map((userId) => ({
    session_id: session.id,
    user_id: userId,
  }));
  const { error: participantError } = await supabase
    .from("session_participants")
    .insert(participantRows);
  if (participantError) throw appError("Failed to add session participants");

  const { data: participants, error: participantFetchError } = await supabase
    .from("session_participants")
    .select("*, profile:profiles(*)")
    .eq("session_id", session.id);
  if (participantFetchError) throw appError("Failed to fetch session participants");

  return { session, participants: participants ?? [] };
};

/** Lists sessions visible to the user and normalizes stale statuses. */
export const listSessions = async (userId: string) => {
  const { data: memberships, error: membershipError } = await supabase
    .from("session_participants")
    .select("session_id")
    .eq("user_id", userId);
  if (membershipError) throw appError("Failed to fetch session memberships");

  const sessionIds = (memberships ?? []).map((row) => row.session_id);
  if (sessionIds.length === 0) return [];

  const { data: sessions, error: sessionError } = await supabase
    .from("study_sessions")
    .select("*")
    .in("id", sessionIds)
    .order("scheduled_at", { ascending: true });
  if (sessionError) throw appError("Failed to fetch study sessions");

  const now = new Date();
  for (const session of sessions ?? []) {
    const endTime = new Date(session.scheduled_at);
    endTime.setMinutes(endTime.getMinutes() + session.duration_minutes);
    if (session.status !== "completed" && endTime < now) {
      await supabase.from("study_sessions").update({ status: "completed" }).eq("id", session.id);
      session.status = "completed";
    }
  }

  const rows = await Promise.all(
    (sessions ?? []).map(async (session) => {
      const { data: participants } = await supabase
        .from("session_participants")
        .select("*, profile:profiles(*)")
        .eq("session_id", session.id);
      return { ...session, participants: participants ?? [] };
    })
  );

  return rows;
};

/** Updates session fields when requestor is the session creator. */
export const updateSession = async (
  sessionId: string,
  userId: string,
  payload: Partial<{
    groupName: string;
    description: string;
    scheduledAt: string;
    durationMinutes: number;
    status: "upcoming" | "completed" | "cancelled";
  }>
) => {
  const { data: session, error: sessionError } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  if (sessionError || !session) throw appError("Session not found", 404);
  if (session.creator_id !== userId) throw appError("Forbidden", 403);

  const { data, error } = await supabase
    .from("study_sessions")
    .update({
      group_name: payload.groupName ?? session.group_name,
      description: payload.description ?? session.description,
      scheduled_at: payload.scheduledAt ?? session.scheduled_at,
      duration_minutes: payload.durationMinutes ?? session.duration_minutes,
      status: payload.status ?? session.status,
    })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error || !data) throw appError("Failed to update session");
  return data;
};

/** Deletes a session when requestor is its creator. */
export const deleteSession = async (sessionId: string, userId: string): Promise<void> => {
  const { data: session, error: sessionError } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  if (sessionError || !session) throw appError("Session not found", 404);
  if (session.creator_id !== userId) throw appError("Forbidden", 403);

  const { error } = await supabase.from("study_sessions").delete().eq("id", sessionId);
  if (error) throw appError("Failed to delete session");
};
