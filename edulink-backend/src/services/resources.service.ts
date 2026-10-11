import { supabase } from "../lib/supabase";
import { Resource, ResourceType } from "../types";

export interface ResourceFilters {
  department?: string;
  semester?: number;
  subject?: string;
  resource_type?: ResourceType;
  search?: string;
  sortBy?: "popular" | "recent" | "downloads";
  page?: number;
  limit?: number;
  uploaded_by?: string;
  bookmarked_by?: string;
}

export interface CreateResourceDTO {
  title: string;
  description?: string;
  resource_type: ResourceType;
  subject_name: string;
  subject_code?: string;
  department: string;
  year: number;
  semester: number;
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
}

const appError = (message: string, status = 500): Error & { status: number } => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

export const listResources = async (
  userId: string,
  filters: ResourceFilters
): Promise<{ resources: Resource[]; total: number }> => {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(50, filters.limit || 20);
  const offset = (page - 1) * limit;

  let query = supabase
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
  if (filters.resource_type && filters.resource_type !== "all" as any) {
    query = query.eq("resource_type", filters.resource_type);
  }
  if (filters.uploaded_by) {
    query = query.eq("uploaded_by", filters.uploaded_by);
  }
  if (filters.subject) {
    query = query.ilike("subject_name", `%${filters.subject}%`);
  }
  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,subject_name.ilike.%${filters.search}%,subject_code.ilike.%${filters.search}%`
    );
  }

  // Sorting
  if (filters.sortBy === "popular") {
    query = query.order("upvotes_count", { ascending: false });
  } else if (filters.sortBy === "downloads") {
    query = query.order("downloads_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data: rawResources, error, count } = await query;
  if (error) {
    throw appError(`Failed to fetch resources: ${error.message}`);
  }

  const resources = rawResources || [];
  const resourceIds = resources.map((r) => r.id);

  let userUpvotes = new Set<string>();
  let userBookmarks = new Set<string>();

  if (userId && resourceIds.length > 0) {
    const { data: upvotes } = await supabase
      .from("resource_upvotes")
      .select("resource_id")
      .eq("user_id", userId)
      .in("resource_id", resourceIds);

    const { data: bookmarks } = await supabase
      .from("resource_bookmarks")
      .select("resource_id")
      .eq("user_id", userId)
      .in("resource_id", resourceIds);

    userUpvotes = new Set((upvotes || []).map((u) => u.resource_id));
    userBookmarks = new Set((bookmarks || []).map((b) => b.resource_id));
  }

  const mappedResources: Resource[] = resources.map((r) => ({
    ...r,
    has_upvoted: userUpvotes.has(r.id),
    has_bookmarked: userBookmarks.has(r.id),
  }));

  return { resources: mappedResources, total: count || 0 };
};

export const getResourceById = async (
  resourceId: string,
  userId?: string
): Promise<Resource> => {
  const { data: resource, error } = await supabase
    .from("resources")
    .select("*, uploader:profiles!uploaded_by(id, full_name, avatar_url, branch)")
    .eq("id", resourceId)
    .single();

  if (error || !resource) {
    throw appError("Resource not found", 404);
  }

  // Increment view count asynchronously
  supabase
    .from("resources")
    .update({ views_count: (resource.views_count || 0) + 1 })
    .eq("id", resourceId)
    .then();

  let has_upvoted = false;
  let has_bookmarked = false;

  if (userId) {
    const { data: upvote } = await supabase
      .from("resource_upvotes")
      .select("id")
      .eq("resource_id", resourceId)
      .eq("user_id", userId)
      .maybeSingle();

    const { data: bookmark } = await supabase
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

export const createResource = async (
  userId: string,
  data: CreateResourceDTO
): Promise<Resource> => {
  const { data: created, error } = await supabase
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

export const toggleUpvoteResource = async (
  userId: string,
  resourceId: string
): Promise<{ has_upvoted: boolean; upvotes_count: number }> => {
  const { data: existing } = await supabase
    .from("resource_upvotes")
    .select("id")
    .eq("resource_id", resourceId)
    .eq("user_id", userId)
    .maybeSingle();

  const { data: currentRes } = await supabase
    .from("resources")
    .select("upvotes_count")
    .eq("id", resourceId)
    .single();

  const currentCount = currentRes?.upvotes_count || 0;

  if (existing) {
    await supabase.from("resource_upvotes").delete().eq("id", existing.id);
    const newCount = Math.max(0, currentCount - 1);
    await supabase.from("resources").update({ upvotes_count: newCount }).eq("id", resourceId);
    return { has_upvoted: false, upvotes_count: newCount };
  } else {
    await supabase.from("resource_upvotes").insert({ resource_id: resourceId, user_id: userId });
    const newCount = currentCount + 1;
    await supabase.from("resources").update({ upvotes_count: newCount }).eq("id", resourceId);
    return { has_upvoted: true, upvotes_count: newCount };
  }
};

export const toggleBookmarkResource = async (
  userId: string,
  resourceId: string
): Promise<{ has_bookmarked: boolean }> => {
  const { data: existing } = await supabase
    .from("resource_bookmarks")
    .select("id")
    .eq("resource_id", resourceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("resource_bookmarks").delete().eq("id", existing.id);
    return { has_bookmarked: false };
  } else {
    await supabase.from("resource_bookmarks").insert({ resource_id: resourceId, user_id: userId });
    return { has_bookmarked: true };
  }
};

export const recordDownload = async (resourceId: string): Promise<void> => {
  const { data: res } = await supabase
    .from("resources")
    .select("downloads_count")
    .eq("id", resourceId)
    .single();

  if (res) {
    await supabase
      .from("resources")
      .update({ downloads_count: (res.downloads_count || 0) + 1 })
      .eq("id", resourceId);
  }
};
