import { supabase } from "../lib/supabase";
import { Profile } from "../types";

const appError = (message: string, status = 500): Error & { status: number } => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

/** Fetches a profile by user ID. */
export const getProfileById = async (
  userId: string
): Promise<{ profile: Profile; interests?: any[] }> => {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw appError("Profile not found", 404);
  }

  return { profile: profile as Profile, interests: [] };
};

/** Upserts profile data for the given user ID. */
export const upsertOwnProfile = async (
  userId: string,
  payload: Omit<Profile, "id" | "is_complete"> & { interests?: string[] },
  userEmail?: string
): Promise<{ profile: Profile; interests?: any[] }> => {
  const { interests, ...profileFields } = payload;
  const { error: upsertError } = await supabase.from("profiles").upsert({
    id: userId,
    ...profileFields,
    is_complete: true,
    updated_at: new Date().toISOString(),
  });

  if (upsertError) {
    throw appError(`Failed to update profile: ${upsertError.message}`);
  }

  return getProfileById(userId);
};

