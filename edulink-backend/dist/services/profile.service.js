"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertOwnProfile = exports.getProfileById = void 0;
const supabase_1 = require("../lib/supabase");
const appError = (message, status = 500) => {
    const error = new Error(message);
    error.status = status;
    return error;
};
/** Fetches a profile and all linked interests by user ID. */
const getProfileById = async (userId) => {
    const { data: profile, error: profileError } = await supabase_1.supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
    if (profileError || !profile) {
        throw appError("Profile not found", 404);
    }
    const { data: profileInterests, error: interestsError } = await supabase_1.supabase
        .from("profile_interests")
        .select("interests(id, name)")
        .eq("profile_id", userId);
    if (interestsError) {
        throw appError("Failed to fetch profile interests");
    }
    const interests = profileInterests
        ?.map((row) => {
        const nested = row.interests;
        return Array.isArray(nested) ? nested[0] : nested;
    })
        .filter((item) => Boolean(item)) ?? [];
    return { profile: profile, interests };
};
exports.getProfileById = getProfileById;
/** Upserts profile data and replaces interests for the given user ID. */
const upsertOwnProfile = async (userId, payload) => {
    const { interests, ...profileFields } = payload;
    const { error: upsertError } = await supabase_1.supabase.from("profiles").upsert({
        id: userId,
        ...profileFields,
        is_complete: true,
    });
    if (upsertError) {
        throw appError("Failed to update profile");
    }
    if (Array.isArray(interests)) {
        const { error: deleteError } = await supabase_1.supabase
            .from("profile_interests")
            .delete()
            .eq("profile_id", userId);
        if (deleteError) {
            throw appError("Failed to reset profile interests");
        }
        if (interests.length > 0) {
            const { error: insertError } = await supabase_1.supabase.from("profile_interests").insert(interests.map((interestId) => ({
                profile_id: userId,
                interest_id: interestId,
            })));
            if (insertError) {
                throw appError("Failed to save profile interests");
            }
        }
    }
    return (0, exports.getProfileById)(userId);
};
exports.upsertOwnProfile = upsertOwnProfile;
