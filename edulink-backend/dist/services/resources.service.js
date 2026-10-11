"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordDownload = exports.toggleBookmarkResource = exports.toggleUpvoteResource = exports.createResource = exports.getResourceById = exports.listResources = void 0;
const supabase_1 = require("../lib/supabase");
const appError = (message, status = 500) => {
    const error = new Error(message);
    error.status = status;
    return error;
};
const listResources = async (userId, filters) => {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, filters.limit || 20);
    const offset = (page - 1) * limit;
    let query = supabase_1.supabase
        .from("resources")
        .select("*, uploader:profiles!uploaded_by(id, full_name, avatar_url, branch)", {
        count: "exact",
    });
    if (filters.department && filters.department !== "all") {
        query = query.eq("department", filters.department);
    }
    if (filters.semester && Number(filters.semester) > 0) {
        query = query.eq("semester", Number(filters.semester));
    }
    if (filters.resource_type && filters.resource_type !== "all") {
        query = query.eq("resource_type", filters.resource_type);
    }
    if (filters.uploaded_by) {
        query = query.eq("uploaded_by", filters.uploaded_by);
    }
    if (filters.subject) {
        query = query.ilike("subject_name", `%${filters.subject}%`);
    }
    if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,subject_name.ilike.%${filters.search}%,subject_code.ilike.%${filters.search}%`);
    }
    // Sorting
    if (filters.sortBy === "popular") {
        query = query.order("upvotes_count", { ascending: false });
    }
    else if (filters.sortBy === "downloads") {
        query = query.order("downloads_count", { ascending: false });
    }
    else {
        query = query.order("created_at", { ascending: false });
    }
    query = query.range(offset, offset + limit - 1);
    const { data: rawResources, error, count } = await query;
    if (error) {
        throw appError(`Failed to fetch resources: ${error.message}`);
    }
    const resources = rawResources || [];
    const resourceIds = resources.map((r) => r.id);
    let userUpvotes = new Set();
    let userBookmarks = new Set();
    if (userId && resourceIds.length > 0) {
        const { data: upvotes } = await supabase_1.supabase
            .from("resource_upvotes")
            .select("resource_id")
            .eq("user_id", userId)
            .in("resource_id", resourceIds);
        const { data: bookmarks } = await supabase_1.supabase
            .from("resource_bookmarks")
            .select("resource_id")
            .eq("user_id", userId)
            .in("resource_id", resourceIds);
        userUpvotes = new Set((upvotes || []).map((u) => u.resource_id));
        userBookmarks = new Set((bookmarks || []).map((b) => b.resource_id));
    }
    const mappedResources = resources.map((r) => ({
        ...r,
        has_upvoted: userUpvotes.has(r.id),
        has_bookmarked: userBookmarks.has(r.id),
    }));
    return { resources: mappedResources, total: count || 0 };
};
exports.listResources = listResources;
const getResourceById = async (resourceId, userId) => {
    const { data: resource, error } = await supabase_1.supabase
        .from("resources")
        .select("*, uploader:profiles!uploaded_by(id, full_name, avatar_url, branch)")
        .eq("id", resourceId)
        .single();
    if (error || !resource) {
        throw appError("Resource not found", 404);
    }
    // Increment view count asynchronously
    supabase_1.supabase
        .from("resources")
        .update({ views_count: (resource.views_count || 0) + 1 })
        .eq("id", resourceId)
        .then();
    let has_upvoted = false;
    let has_bookmarked = false;
    if (userId) {
        const { data: upvote } = await supabase_1.supabase
            .from("resource_upvotes")
            .select("id")
            .eq("resource_id", resourceId)
            .eq("user_id", userId)
            .maybeSingle();
        const { data: bookmark } = await supabase_1.supabase
            .from("resource_bookmarks")
            .select("id")
            .eq("resource_id", resourceId)
            .eq("user_id", userId)
            .maybeSingle();
        has_upvoted = Boolean(upvote);
        has_bookmarked = Boolean(bookmark);
    }
    return {
        ...resource,
        has_upvoted,
        has_bookmarked,
    };
};
exports.getResourceById = getResourceById;
const createResource = async (userId, data) => {
    const { data: created, error } = await supabase_1.supabase
        .from("resources")
        .insert({
        ...data,
        uploaded_by: userId,
        upvotes_count: 0,
        downloads_count: 0,
        views_count: 0,
    })
        .select("*, uploader:profiles!uploaded_by(id, full_name, avatar_url, branch)")
        .single();
    if (error || !created) {
        throw appError(`Failed to create resource: ${error?.message}`);
    }
    return created;
};
exports.createResource = createResource;
const toggleUpvoteResource = async (userId, resourceId) => {
    const { data: existing } = await supabase_1.supabase
        .from("resource_upvotes")
        .select("id")
        .eq("resource_id", resourceId)
        .eq("user_id", userId)
        .maybeSingle();
    const { data: currentRes } = await supabase_1.supabase
        .from("resources")
        .select("upvotes_count")
        .eq("id", resourceId)
        .single();
    const currentCount = currentRes?.upvotes_count || 0;
    if (existing) {
        await supabase_1.supabase.from("resource_upvotes").delete().eq("id", existing.id);
        const newCount = Math.max(0, currentCount - 1);
        await supabase_1.supabase.from("resources").update({ upvotes_count: newCount }).eq("id", resourceId);
        return { has_upvoted: false, upvotes_count: newCount };
    }
    else {
        await supabase_1.supabase.from("resource_upvotes").insert({ resource_id: resourceId, user_id: userId });
        const newCount = currentCount + 1;
        await supabase_1.supabase.from("resources").update({ upvotes_count: newCount }).eq("id", resourceId);
        return { has_upvoted: true, upvotes_count: newCount };
    }
};
exports.toggleUpvoteResource = toggleUpvoteResource;
const toggleBookmarkResource = async (userId, resourceId) => {
    const { data: existing } = await supabase_1.supabase
        .from("resource_bookmarks")
        .select("id")
        .eq("resource_id", resourceId)
        .eq("user_id", userId)
        .maybeSingle();
    if (existing) {
        await supabase_1.supabase.from("resource_bookmarks").delete().eq("id", existing.id);
        return { has_bookmarked: false };
    }
    else {
        await supabase_1.supabase.from("resource_bookmarks").insert({ resource_id: resourceId, user_id: userId });
        return { has_bookmarked: true };
    }
};
exports.toggleBookmarkResource = toggleBookmarkResource;
const recordDownload = async (resourceId) => {
    const { data: res } = await supabase_1.supabase
        .from("resources")
        .select("downloads_count")
        .eq("id", resourceId)
        .single();
    if (res) {
        await supabase_1.supabase
            .from("resources")
            .update({ downloads_count: (res.downloads_count || 0) + 1 })
            .eq("id", resourceId);
    }
};
exports.recordDownload = recordDownload;
