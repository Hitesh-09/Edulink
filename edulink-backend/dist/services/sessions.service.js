"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSession = exports.updateSession = exports.listSessions = exports.createSession = void 0;
const supabase_1 = require("../lib/supabase");
const appError = (message, status = 500) => {
    const error = new Error(message);
    error.status = status;
    return error;
};
const isConnected = async (userId, peerId) => {
    const [userA, userB] = [userId, peerId].sort();
    const { data, error } = await supabase_1.supabase
        .from("connections")
        .select("id")
        .eq("user_a", userA)
        .eq("user_b", userB)
        .limit(1);
    if (error)
        throw appError("Failed to validate participant connections");
    return (data ?? []).length > 0;
};
/** Creates a study session and enrolls all participants. */
const createSession = async (creatorId, payload) => {
    const uniqueParticipantIds = [...new Set(payload.participantIds.filter((id) => id !== creatorId))];
    for (const participantId of uniqueParticipantIds) {
        if (!(await isConnected(creatorId, participantId))) {
            throw appError("All participants must be connected with the creator", 400);
        }
    }
    const { data: session, error: sessionError } = await supabase_1.supabase
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
    if (sessionError || !session)
        throw appError("Failed to create study session");
    const participantRows = [creatorId, ...uniqueParticipantIds].map((userId) => ({
        session_id: session.id,
        user_id: userId,
    }));
    const { error: participantError } = await supabase_1.supabase
        .from("session_participants")
        .insert(participantRows);
    if (participantError)
        throw appError("Failed to add session participants");
    const { data: participants, error: participantFetchError } = await supabase_1.supabase
        .from("session_participants")
        .select("*, profile:profiles(*)")
        .eq("session_id", session.id);
    if (participantFetchError)
        throw appError("Failed to fetch session participants");
    return { session, participants: participants ?? [] };
};
exports.createSession = createSession;
/** Lists sessions visible to the user and normalizes stale statuses. */
const listSessions = async (userId) => {
    const { data: memberships, error: membershipError } = await supabase_1.supabase
        .from("session_participants")
        .select("session_id")
        .eq("user_id", userId);
    if (membershipError)
        throw appError("Failed to fetch session memberships");
    const sessionIds = (memberships ?? []).map((row) => row.session_id);
    if (sessionIds.length === 0)
        return [];
    const { data: sessions, error: sessionError } = await supabase_1.supabase
        .from("study_sessions")
        .select("*")
        .in("id", sessionIds)
        .order("scheduled_at", { ascending: true });
    if (sessionError)
        throw appError("Failed to fetch study sessions");
    const now = new Date();
    for (const session of sessions ?? []) {
        const endTime = new Date(session.scheduled_at);
        endTime.setMinutes(endTime.getMinutes() + session.duration_minutes);
        if (session.status !== "completed" && endTime < now) {
            await supabase_1.supabase.from("study_sessions").update({ status: "completed" }).eq("id", session.id);
            session.status = "completed";
        }
    }
    const rows = await Promise.all((sessions ?? []).map(async (session) => {
        const { data: participants } = await supabase_1.supabase
            .from("session_participants")
            .select("*, profile:profiles(*)")
            .eq("session_id", session.id);
        return { ...session, participants: participants ?? [] };
    }));
    return rows;
};
exports.listSessions = listSessions;
/** Updates session fields when requestor is the session creator. */
const updateSession = async (sessionId, userId, payload) => {
    const { data: session, error: sessionError } = await supabase_1.supabase
        .from("study_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
    if (sessionError || !session)
        throw appError("Session not found", 404);
    if (session.creator_id !== userId)
        throw appError("Forbidden", 403);
    const { data, error } = await supabase_1.supabase
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
    if (error || !data)
        throw appError("Failed to update session");
    return data;
};
exports.updateSession = updateSession;
/** Deletes a session when requestor is its creator. */
const deleteSession = async (sessionId, userId) => {
    const { data: session, error: sessionError } = await supabase_1.supabase
        .from("study_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
    if (sessionError || !session)
        throw appError("Session not found", 404);
    if (session.creator_id !== userId)
        throw appError("Forbidden", 403);
    const { error } = await supabase_1.supabase.from("study_sessions").delete().eq("id", sessionId);
    if (error)
        throw appError("Failed to delete session");
};
exports.deleteSession = deleteSession;
