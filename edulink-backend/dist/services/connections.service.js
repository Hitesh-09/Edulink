"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSentRequests = exports.getReceivedRequests = exports.getConnections = exports.respondToConnectionRequest = exports.sendConnectionRequest = void 0;
const supabase_1 = require("../lib/supabase");
const appError = (message, status = 500) => {
    const error = new Error(message);
    error.status = status;
    return error;
};
/** Sends a new connection request if not duplicate/already connected. */
const sendConnectionRequest = async (senderId, receiverId) => {
    if (senderId === receiverId)
        throw appError("You cannot connect with yourself", 400);
    const { data: existingRequest, error: existingRequestError } = await supabase_1.supabase
        .from("connection_requests")
        .select("id")
        .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
        .limit(1);
    if (existingRequestError)
        throw appError("Failed to validate existing requests");
    if ((existingRequest ?? []).length > 0)
        throw appError("Connection request already exists", 409);
    const [userA, userB] = [senderId, receiverId].sort();
    const { data: existingConnection, error: connectionError } = await supabase_1.supabase
        .from("connections")
        .select("id")
        .eq("user_a", userA)
        .eq("user_b", userB)
        .limit(1);
    if (connectionError)
        throw appError("Failed to validate existing connections");
    if ((existingConnection ?? []).length > 0)
        throw appError("Users are already connected", 409);
    const { data, error } = await supabase_1.supabase
        .from("connection_requests")
        .insert({ sender_id: senderId, receiver_id: receiverId, status: "pending" })
        .select("*")
        .single();
    if (error || !data)
        throw appError("Failed to send connection request");
    return data;
};
exports.sendConnectionRequest = sendConnectionRequest;
/** Accepts or rejects a received connection request by receiver. */
const respondToConnectionRequest = async (requestId, actingUserId, status) => {
    const { data: request, error: requestError } = await supabase_1.supabase
        .from("connection_requests")
        .select("*")
        .eq("id", requestId)
        .single();
    if (requestError || !request)
        throw appError("Connection request not found", 404);
    if (request.receiver_id !== actingUserId)
        throw appError("Forbidden", 403);
    const { data: updatedRequest, error: updateError } = await supabase_1.supabase
        .from("connection_requests")
        .update({ status })
        .eq("id", requestId)
        .select("*")
        .single();
    if (updateError || !updatedRequest)
        throw appError("Failed to update connection request");
    if (status === "accepted") {
        const [userA, userB] = [request.sender_id, request.receiver_id].sort();
        const { error: insertConnectionError } = await supabase_1.supabase
            .from("connections")
            .insert({ user_a: userA, user_b: userB });
        if (insertConnectionError)
            throw appError("Failed to create connection");
    }
    return updatedRequest;
};
exports.respondToConnectionRequest = respondToConnectionRequest;
/** Fetches accepted connections for a user with other profile and interests. */
const getConnections = async (userId) => {
    const { data: connections, error } = await supabase_1.supabase
        .from("connections")
        .select("*")
        .or(`user_a.eq.${userId},user_b.eq.${userId}`);
    if (error)
        throw appError("Failed to fetch connections");
    const rows = await Promise.all((connections ?? []).map(async (connection) => {
        const otherUserId = connection.user_a === userId ? connection.user_b : connection.user_a;
        const { data: profile } = await supabase_1.supabase.from("profiles").select("*").eq("id", otherUserId).single();
        const { data: interests } = await supabase_1.supabase
            .from("profile_interests")
            .select("interests(id, name)")
            .eq("profile_id", otherUserId);
        return {
            connection,
            otherUserProfile: profile,
            interests: (interests ?? []).map((entry) => entry.interests).filter(Boolean),
        };
    }));
    return rows;
};
exports.getConnections = getConnections;
/** Lists received pending requests for a user. */
const getReceivedRequests = async (userId) => {
    const { data, error } = await supabase_1.supabase
        .from("connection_requests")
        // Disambiguate the join since `connection_requests` has *two* FKs to `profiles`
        // (`sender_id` and `receiver_id`). Using column-based join keeps this resilient
        // even if the FK constraint name differs across environments.
        .select("*, sender:profiles!sender_id(*)")
        .eq("receiver_id", userId)
        .eq("status", "pending");
    if (error)
        throw appError(`Failed to fetch received requests: ${error.message}`);
    return data ?? [];
};
exports.getReceivedRequests = getReceivedRequests;
/** Lists sent pending requests for a user. */
const getSentRequests = async (userId) => {
    const { data, error } = await supabase_1.supabase
        .from("connection_requests")
        // Disambiguate the join since `connection_requests` has *two* FKs to `profiles`
        // (`sender_id` and `receiver_id`). Using column-based join keeps this resilient
        // even if the FK constraint name differs across environments.
        .select("*, receiver:profiles!receiver_id(*)")
        .eq("sender_id", userId)
        .eq("status", "pending");
    if (error)
        throw appError(`Failed to fetch sent requests: ${error.message}`);
    return data ?? [];
};
exports.getSentRequests = getSentRequests;
