"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertOwnProfile = exports.getProfileById = void 0;
const supabase_1 = require("../lib/supabase");
const appError = (message, status = 500) => {
    const error = new Error(message);
    error.status = status;
    return error;
};
/** Fetches a profile by user ID. */
const getProfileById = async (userId) => {
    const { data: profile, error: profileError } = await supabase_1.supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
    if (profileError || !profile) {
        throw appError("Profile not found", 404);
    }
    return { profile: profile, interests: [] };
};
exports.getProfileById = getProfileById;
/** Upserts profile data for the given user ID. */
const upsertOwnProfile = async (userId, payload, userEmail) => {
    const { interests, ...profileFields } = payload;
    const { error: upsertError } = await supabase_1.supabase.from("profiles").upsert({
        id: userId,
        ...profileFields,
        is_complete: true,
        updated_at: new Date().toISOString(),
    });
    if (upsertError) {
        throw appError(`Failed to update profile: ${upsertError.message}`);
    }
    return (0, exports.getProfileById)(userId);
};
exports.upsertOwnProfile = upsertOwnProfile;
