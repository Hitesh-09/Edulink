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
  const { data: requests, error } = await supabase
    .from("connection_requests")
    .select("*")
    .eq("receiver_id", userId)
    .eq("status", "pending");

  if (error) throw appError(`Failed to fetch received requests: ${error.message}`);
  if (!requests || requests.length === 0) return [];

  // Manual join: fetch profiles for all senders
  const senderIds = requests.map(r => r.sender_id);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", senderIds);

  if (profileError) throw appError(`Failed to fetch requester profiles: ${profileError.message}`);

  const profileMap = new Map(profiles?.map(p => [p.id, p]));
  
  return requests.map(req => ({
    ...req,
    sender: profileMap.get(req.sender_id) || null
  }));
};

/** Lists sent pending requests for a user. */
export const getSentRequests = async (userId: string) => {
  const { data: requests, error } = await supabase
    .from("connection_requests")
    .select("*")
    .eq("sender_id", userId)
    .eq("status", "pending");

  if (error) throw appError(`Failed to fetch sent requests: ${error.message}`);
  if (!requests || requests.length === 0) return [];

  // Manual join: fetch profiles for all receivers
  const receiverIds = requests.map(r => r.receiver_id);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", receiverIds);

  if (profileError) throw appError(`Failed to fetch receiver profiles: ${profileError.message}`);

  const profileMap = new Map(profiles?.map(p => [p.id, p]));
  
  return requests.map(req => ({
    ...req,
    receiver: profileMap.get(req.receiver_id) || null
  }));
};
