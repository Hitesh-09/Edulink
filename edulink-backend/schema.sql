-- ==========================================================
-- EDULINK SRM (KTR) COMPLETE DATABASE SCHEMA
-- ==========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE (Directly linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  register_no TEXT UNIQUE,
  college TEXT DEFAULT 'SRM Institute of Science and Technology',
  campus TEXT DEFAULT 'KTR',
  degree TEXT DEFAULT 'B.Tech',
  branch TEXT,
  year INTEGER CHECK (year >= 1 AND year <= 5),
  semester INTEGER CHECK (semester >= 1 AND semester <= 10) DEFAULT 1,
  avatar_url TEXT,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. AUTOMATIC PROFILE TRIGGER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_complete)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();

-- Backfill existing auth users
INSERT INTO public.profiles (id, full_name, is_complete)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', ''), FALSE
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. RESOURCES TABLE (StuDocu-Style Academic Library)
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('notes', 'pyq', 'lab_manual', 'book', 'assignment', 'syllabus')),
  subject_name TEXT NOT NULL,
  subject_code TEXT,
  department TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 5),
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 10),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  file_type TEXT DEFAULT 'pdf',
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  upvotes_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_dept_sem ON public.resources(department, semester);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON public.resources(subject_name);
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(resource_type);

-- 5. RESOURCE INTERACTIONS (Upvotes & Bookmarks)
CREATE TABLE IF NOT EXISTS public.resource_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resource_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.resource_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resource_id, user_id)
);

-- 6. DOUBTS & COMMUNITY QUESTIONS
CREATE TABLE IF NOT EXISTS public.doubts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  department TEXT,
  year INTEGER,
  semester INTEGER,
  tags TEXT[] DEFAULT '{}',
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_resolved BOOLEAN DEFAULT FALSE,
  upvotes_count INTEGER DEFAULT 0,
  answers_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doubts_dept_sem ON public.doubts(department, semester);
CREATE INDEX IF NOT EXISTS idx_doubts_subject ON public.doubts(subject_name);

-- 7. DOUBT ANSWERS
CREATE TABLE IF NOT EXISTS public.doubt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doubt_id UUID NOT NULL REFERENCES public.doubts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_accepted BOOLEAN DEFAULT FALSE,
  upvotes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. DOUBT & ANSWER UPVOTES
CREATE TABLE IF NOT EXISTS public.doubt_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doubt_id UUID NOT NULL REFERENCES public.doubts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(doubt_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.answer_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES public.doubt_answers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(answer_id, user_id)
);

-- 9. DIRECT MESSAGES (1-on-1 Student Chat)
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubt_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Profiles: Authenticated users can read profiles; owners can insert and update
CREATE POLICY "Profiles select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Resources
CREATE POLICY "Resources select" ON public.resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Resources insert" ON public.resources FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Resources update" ON public.resources FOR UPDATE TO authenticated USING (auth.uid() = uploaded_by);
CREATE POLICY "Resources delete" ON public.resources FOR DELETE TO authenticated USING (auth.uid() = uploaded_by);

-- Resource Upvotes & Bookmarks
CREATE POLICY "Resource upvotes all" ON public.resource_upvotes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Resource bookmarks all" ON public.resource_bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Doubts
CREATE POLICY "Doubts select" ON public.doubts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Doubts insert" ON public.doubts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Doubts update" ON public.doubts FOR UPDATE TO authenticated USING (auth.uid() = author_id);

-- Doubt Answers
CREATE POLICY "Doubt answers select" ON public.doubt_answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Doubt answers insert" ON public.doubt_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Doubt answers update" ON public.doubt_answers FOR UPDATE TO authenticated USING (auth.uid() = author_id);

-- Doubt & Answer Upvotes
CREATE POLICY "Doubt upvotes all" ON public.doubt_upvotes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Answer upvotes all" ON public.answer_upvotes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Direct Messages
CREATE POLICY "Direct messages select" ON public.direct_messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Direct messages insert" ON public.direct_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- 11. STORAGE BUCKET FOR RESOURCES
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Resource Access" ON storage.objects;
CREATE POLICY "Public Resource Access" ON storage.objects FOR SELECT TO authenticated, anon USING (bucket_id = 'resources');

DROP POLICY IF EXISTS "Authenticated Resource Upload" ON storage.objects;
CREATE POLICY "Authenticated Resource Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resources');
