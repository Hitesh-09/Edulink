import { supabase } from "../lib/supabase";

const appError = (message: string, status = 500): Error & { status: number } => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

/** Sends a new connection request if not duplicate/already connected. */
export const sendConnectionRequest = async (senderId: string, receiverId: string) => {
  if (senderId === receiverId) throw appError("You cannot connect with yourself", 400);

  const { data: existingRequest, error: existingRequestError } = await supabase
    .from("connection_requests")
    .select("id")
    .or(
      `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
    )
    .limit(1);

  if (existingRequestError) throw appError("Failed to validate existing requests");
  if ((existingRequest ?? []).length > 0) throw appError("Connection request already exists", 409);

  const [userA, userB] = [senderId, receiverId].sort();
  const { data: existingConnection, error: connectionError } = await supabase
    .from("connections")
    .select("id")
    .eq("user_a", userA)
    .eq("user_b", userB)
    .limit(1);

  if (connectionError) throw appError("Failed to validate existing connections");
  if ((existingConnection ?? []).length > 0) throw appError("Users are already connected", 409);

  const { data, error } = await supabase
    .from("connection_requests")
    .insert({ sender_id: senderId, receiver_id: receiverId, status: "pending" })
    .select("*")
    .single();

  if (error || !data) throw appError("Failed to send connection request");
  return data;
};

/** Accepts or rejects a received connection request by receiver. */
export const respondToConnectionRequest = async (
  requestId: string,
  actingUserId: string,
  status: "accepted" | "rejected"
) => {
  const { data: request, error: requestError } = await supabase
    .from("connection_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (requestError || !request) throw appError("Connection request not found", 404);
  if (request.receiver_id !== actingUserId) throw appError("Forbidden", 403);

  const { data: updatedRequest, error: updateError } = await supabase
    .from("connection_requests")
    .update({ status })
    .eq("id", requestId)
    .select("*")
    .single();

  if (updateError || !updatedRequest) throw appError("Failed to update connection request");

  if (status === "accepted") {
    const [userA, userB] = [request.sender_id, request.receiver_id].sort();
    const { error: insertConnectionError } = await supabase
      .from("connections")
      .insert({ user_a: userA, user_b: userB });

    if (insertConnectionError) throw appError("Failed to create connection");
  }

  return updatedRequest;
};

/** Fetches accepted connections for a user with other profile and interests. */
export const getConnections = async (userId: string) => {
  const { data: connections, error } = await supabase
    .from("connections")
    .select("*")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`);

  if (error) throw appError("Failed to fetch connections");

  const rows = await Promise.all(
    (connections ?? []).map(async (connection) => {
      const otherUserId = connection.user_a === userId ? connection.user_b : connection.user_a;
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", otherUserId).single();
      const { data: interests } = await supabase
        .from("profile_interests")
        .select("interests(id, name)")
        .eq("profile_id", otherUserId);

      return {
        connection,
        otherUserProfile: profile,
        interests: (interests ?? []).map((entry) => entry.interests).filter(Boolean),
      };
    })
  );

  return rows;
};

/** Lists received pending requests for a user. */
export const getReceivedRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from("connection_requests")
    .select("*, sender:profiles!connection_requests_sender_id_fkey(*)")
    .eq("receiver_id", userId)
    .eq("status", "pending");

  if (error) throw appError("Failed to fetch received requests");
  return data ?? [];
};

/** Lists sent pending requests for a user. */
export const getSentRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from("connection_requests")
    .select("*, receiver:profiles!connection_requests_receiver_id_fkey(*)")
    .eq("sender_id", userId)
    .eq("status", "pending");

  if (error) throw appError("Failed to fetch sent requests");
  return data ?? [];
};
