"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptAnswer = exports.toggleUpvoteAnswer = exports.toggleUpvoteDoubt = exports.createAnswer = exports.createDoubt = exports.getDoubtById = exports.listDoubts = void 0;
const supabase_1 = require("../lib/supabase");
const appError = (message, status = 500) => {
    const error = new Error(message);
    error.status = status;
    return error;
};
const listDoubts = async (userId, filters) => {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, filters.limit || 20);
    const offset = (page - 1) * limit;
    let query = supabase_1.supabase
        .from("doubts")
        .select("*, author:profiles!author_id(id, full_name, avatar_url, branch, year)", {
        count: "exact",
    });
    if (filters.department && filters.department !== "all") {
        query = query.eq("department", filters.department);
    }
    if (filters.semester && Number(filters.semester) > 0) {
        query = query.eq("semester", Number(filters.semester));
    }
    if (filters.status === "resolved") {
        query = query.eq("is_resolved", true);
    }
    else if (filters.status === "unresolved") {
        query = query.eq("is_resolved", false);
    }
    if (filters.author_id) {
        query = query.eq("author_id", filters.author_id);
    }
    if (filters.subject) {
        query = query.ilike("subject_name", `%${filters.subject}%`);
    }
    if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%,subject_name.ilike.%${filters.search}%`);
    }
    // Sorting
    if (filters.sortBy === "popular") {
        query = query.order("upvotes_count", { ascending: false });
    }
    else if (filters.sortBy === "unanswered") {
        query = query.eq("answers_count", 0).order("created_at", { ascending: false });
    }
    else {
        query = query.order("created_at", { ascending: false });
    }
    query = query.range(offset, offset + limit - 1);
    const { data: rawDoubts, error, count } = await query;
    if (error) {
        throw appError(`Failed to fetch doubts: ${error.message}`);
    }
    const doubts = rawDoubts || [];
    const doubtIds = doubts.map((d) => d.id);
    let userUpvotes = new Set();
    if (userId && doubtIds.length > 0) {
        const { data: upvotes } = await supabase_1.supabase
            .from("doubt_upvotes")
            .select("doubt_id")
            .eq("user_id", userId)
            .in("doubt_id", doubtIds);
        userUpvotes = new Set((upvotes || []).map((u) => u.doubt_id));
    }
    const mappedDoubts = doubts.map((d) => ({
        ...d,
        has_upvoted: userUpvotes.has(d.id),
    }));
    return { doubts: mappedDoubts, total: count || 0 };
};
exports.listDoubts = listDoubts;
const getDoubtById = async (doubtId, userId) => {
    const { data: doubt, error } = await supabase_1.supabase
        .from("doubts")
        .select("*, author:profiles!author_id(id, full_name, avatar_url, branch, year)")
        .eq("id", doubtId)
        .single();
    if (error || !doubt) {
        throw appError("Doubt not found", 404);
    }
    // Increment view count asynchronously
    supabase_1.supabase
        .from("doubts")
        .update({ views_count: (doubt.views_count || 0) + 1 })
        .eq("id", doubtId)
        .then();
    // Fetch answers
    const { data: rawAnswers, error: answersError } = await supabase_1.supabase
        .from("doubt_answers")
        .select("*, author:profiles!author_id(id, full_name, avatar_url, branch)")
        .eq("doubt_id", doubtId)
        .order("is_accepted", { ascending: false })
        .order("upvotes_count", { ascending: false })
        .order("created_at", { ascending: true });
    if (answersError) {
        throw appError(`Failed to fetch answers: ${answersError.message}`);
    }
    const answers = rawAnswers || [];
    let has_upvoted = false;
    let userUpvotedAnswers = new Set();
    if (userId) {
        const { data: doubtUpvote } = await supabase_1.supabase
            .from("doubt_upvotes")
            .select("id")
            .eq("doubt_id", doubtId)
            .eq("user_id", userId)
            .maybeSingle();
        has_upvoted = Boolean(doubtUpvote);
        if (answers.length > 0) {
            const { data: answerUpvotes } = await supabase_1.supabase
                .from("answer_upvotes")
                .select("answer_id")
                .eq("user_id", userId)
                .in("answer_id", answers.map((a) => a.id));
            userUpvotedAnswers = new Set((answerUpvotes || []).map((a) => a.answer_id));
        }
    }
    const mappedAnswers = answers.map((a) => ({
        ...a,
        has_upvoted: userUpvotedAnswers.has(a.id),
    }));
    return {
        doubt: {
            ...doubt,
            has_upvoted,
        },
        answers: mappedAnswers,
    };
};
exports.getDoubtById = getDoubtById;
const createDoubt = async (userId, data) => {
    const { data: created, error } = await supabase_1.supabase
        .from("doubts")
        .insert({
        ...data,
        author_id: userId,
        is_resolved: false,
        upvotes_count: 0,
        answers_count: 0,
        views_count: 0,
    })
        .select("*, author:profiles!author_id(id, full_name, avatar_url, branch, year)")
        .single();
    if (error || !created) {
        throw appError(`Failed to create doubt: ${error?.message}`);
    }
    return created;
};
exports.createDoubt = createDoubt;
const createAnswer = async (userId, doubtId, content) => {
    const { data: created, error } = await supabase_1.supabase
        .from("doubt_answers")
        .insert({
        doubt_id: doubtId,
        author_id: userId,
        content,
        is_accepted: false,
        upvotes_count: 0,
    })
        .select("*, author:profiles!author_id(id, full_name, avatar_url, branch)")
        .single();
    if (error || !created) {
        throw appError(`Failed to post answer: ${error?.message}`);
    }
    // Increment answers count on doubt
    const { data: currentDoubt } = await supabase_1.supabase
        .from("doubts")
        .select("answers_count")
        .eq("id", doubtId)
        .single();
    await supabase_1.supabase
        .from("doubts")
        .update({ answers_count: (currentDoubt?.answers_count || 0) + 1 })
        .eq("id", doubtId);
    return created;
};
exports.createAnswer = createAnswer;
const toggleUpvoteDoubt = async (userId, doubtId) => {
    const { data: existing } = await supabase_1.supabase
        .from("doubt_upvotes")
        .select("id")
        .eq("doubt_id", doubtId)
        .eq("user_id", userId)
        .maybeSingle();
    const { data: currentDoubt } = await supabase_1.supabase
        .from("doubts")
        .select("upvotes_count")
        .eq("id", doubtId)
        .single();
    const currentCount = currentDoubt?.upvotes_count || 0;
    if (existing) {
        await supabase_1.supabase.from("doubt_upvotes").delete().eq("id", existing.id);
        const newCount = Math.max(0, currentCount - 1);
        await supabase_1.supabase.from("doubts").update({ upvotes_count: newCount }).eq("id", doubtId);
        return { has_upvoted: false, upvotes_count: newCount };
    }
    else {
        await supabase_1.supabase.from("doubt_upvotes").insert({ doubt_id: doubtId, user_id: userId });
        const newCount = currentCount + 1;
        await supabase_1.supabase.from("doubts").update({ upvotes_count: newCount }).eq("id", doubtId);
        return { has_upvoted: true, upvotes_count: newCount };
    }
};
exports.toggleUpvoteDoubt = toggleUpvoteDoubt;
const toggleUpvoteAnswer = async (userId, answerId) => {
    const { data: existing } = await supabase_1.supabase
        .from("answer_upvotes")
        .select("id")
        .eq("answer_id", answerId)
        .eq("user_id", userId)
        .maybeSingle();
    const { data: currentAnswer } = await supabase_1.supabase
        .from("doubt_answers")
        .select("upvotes_count")
        .eq("id", answerId)
        .single();
    const currentCount = currentAnswer?.upvotes_count || 0;
    if (existing) {
        await supabase_1.supabase.from("answer_upvotes").delete().eq("id", existing.id);
        const newCount = Math.max(0, currentCount - 1);
        await supabase_1.supabase.from("doubt_answers").update({ upvotes_count: newCount }).eq("id", answerId);
        return { has_upvoted: false, upvotes_count: newCount };
    }
    else {
        await supabase_1.supabase.from("answer_upvotes").insert({ answer_id: answerId, user_id: userId });
        const newCount = currentCount + 1;
        await supabase_1.supabase.from("doubt_answers").update({ upvotes_count: newCount }).eq("id", answerId);
        return { has_upvoted: true, upvotes_count: newCount };
    }
};
exports.toggleUpvoteAnswer = toggleUpvoteAnswer;
const acceptAnswer = async (userId, answerId) => {
    // Get answer and doubt
    const { data: answer, error } = await supabase_1.supabase
        .from("doubt_answers")
        .select("id, doubt_id, doubts!doubt_id(author_id)")
        .eq("id", answerId)
        .single();
    if (error || !answer) {
        throw appError("Answer not found", 404);
    }
    const doubt = answer.doubts;
    if (doubt?.author_id !== userId) {
        throw appError("Only the author of this doubt can accept an answer", 403);
    }
    // Unaccept other answers on this doubt
    await supabase_1.supabase
        .from("doubt_answers")
        .update({ is_accepted: false })
        .eq("doubt_id", answer.doubt_id);
    // Accept this answer
    await supabase_1.supabase
        .from("doubt_answers")
        .update({ is_accepted: true })
        .eq("id", answerId);
    // Mark doubt resolved
    await supabase_1.supabase
        .from("doubts")
        .update({ is_resolved: true })
        .eq("id", answer.doubt_id);
    return { success: true };
};
exports.acceptAnswer = acceptAnswer;
