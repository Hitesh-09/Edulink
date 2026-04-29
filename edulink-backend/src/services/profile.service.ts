import { supabase } from "../lib/supabase";
import { Interest, Profile } from "../types";

const appError = (message: string, status = 500): Error & { status: number } => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

/** Fetches a profile and all linked interests by user ID. */
export const getProfileById = async (
  userId: string
): Promise<{ profile: Profile; interests: Interest[] }> => {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw appError("Profile not found", 404);
  }

  const { data: profileInterests, error: interestsError } = await supabase
    .from("profile_interests")
    .select("interests(id, name)")
    .eq("profile_id", userId);

  if (interestsError) {
    throw appError("Failed to fetch profile interests");
  }

  const interests =
    profileInterests
      ?.map((row) => {
        const nested = row.interests as Interest | Interest[] | null;
        return Array.isArray(nested) ? nested[0] : nested;
      })
      .filter((item): item is Interest => Boolean(item)) ?? [];

  return { profile: profile as Profile, interests };
};

/** Upserts profile data and replaces interests for the given user ID. */
export const upsertOwnProfile = async (
  userId: string,
  payload: Omit<Profile, "id" | "is_complete"> & { interests?: string[] }
): Promise<{ profile: Profile; interests: Interest[] }> => {
  const { interests, ...profileFields } = payload;
  const { error: upsertError } = await supabase.from("profiles").upsert({
    id: userId,
    ...profileFields,
    is_complete: true,
  });

  if (upsertError) {
    throw appError("Failed to update profile");
  }

  if (Array.isArray(interests)) {
    const { error: deleteError } = await supabase
      .from("profile_interests")
      .delete()
      .eq("profile_id", userId);

    if (deleteError) {
      throw appError("Failed to reset profile interests");
    }

    if (interests.length > 0) {
      const { data: matchedInterests, error: fetchError } = await supabase
        .from("interests")
        .select("id")
        .in("name", interests);

      if (fetchError || !matchedInterests) {
        throw appError("Failed to resolve interest IDs");
      }

      const { error: insertError } = await supabase.from("profile_interests").insert(
        matchedInterests.map((interest) => ({
          profile_id: userId,
          interest_id: interest.id,
        }))
      );

      if (insertError) {
        throw appError("Failed to save profile interests");
      }
    }
  }

  return getProfileById(userId);
};
