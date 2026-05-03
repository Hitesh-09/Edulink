import { supabase } from "../lib/supabase";

type UserFilters = {
  interest?: string;
  year?: number;
  degree?: string;
  branch?: string;
  search?: string;
};

const appError = (message: string, status = 500): Error & { status: number } => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

/** Lists other users with interests and caller-specific connection status. */
export const listUsers = async (userId: string, filters: UserFilters) => {
  let query = supabase
    .from("profiles")
    .select("*, profile_interests(interest_id, interests(id, name))")
    .neq("id", userId);

  if (filters.year) query = query.eq("year", filters.year);
  if (filters.degree) query = query.eq("degree", filters.degree);
  if (filters.branch) query = query.eq("branch", filters.branch);
  if (filters.search) query = query.ilike("full_name", `%${filters.search}%`);

  const { data: users, error } = await query;
  if (error) throw appError("Failed to fetch users");

  const profiles = users ?? [];
  const userIds = profiles.map((profile) => profile.id);
  const connectionMap = new Map<string, "none" | "pending" | "connected">();

  if (userIds.length > 0) {
    const { data: pendingRequests, error: requestError } = await supabase
      .from("connection_requests")
      .select("sender_id, receiver_id, status")
      .in("sender_id", [userId, ...userIds])
      .in("receiver_id", [userId, ...userIds])
      .eq("status", "pending");

    if (requestError) throw appError("Failed to fetch connection requests");

    const { data: connections, error: connectionError } = await supabase
      .from("connections")
      .select("user_a, user_b")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);

    if (connectionError) throw appError("Failed to fetch connection statuses");

    for (const connection of connections ?? []) {
      const otherId = connection.user_a === userId ? connection.user_b : connection.user_a;
      connectionMap.set(otherId, "connected");
    }

    for (const request of pendingRequests ?? []) {
      const otherId = request.sender_id === userId ? request.receiver_id : request.sender_id;
      if (!connectionMap.has(otherId)) {
        connectionMap.set(otherId, "pending");
      }
    }
  }

  const filteredProfiles =
    filters.interest && filters.interest.trim().length > 0
      ? profiles.filter((profile) =>
          (profile.profile_interests ?? []).some(
            (entry: { interests: { name: string } }) =>
              entry.interests?.name?.toLowerCase() === filters.interest?.toLowerCase()
          )
        )
      : profiles;

  return filteredProfiles.map((profile) => ({
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      college: profile.college,
      degree: profile.degree,
      branch: profile.branch,
      year: profile.year,
      is_complete: profile.is_complete,
    },
    interests: (profile.profile_interests ?? [])
      .map((entry: { interests: { id: string; name: string } }) => entry.interests)
      .filter(Boolean),
    connectionStatus: connectionMap.get(profile.id) ?? "none",
  }));
};
