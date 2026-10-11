-- ==========================================================
-- EDULINK COMPLETE SUPABASE DATABASE SCHEMA
-- Run this in the Supabase Dashboard -> SQL Editor
-- ==========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE (Links Supabase auth.users to public schema)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  register_no TEXT,
  college TEXT DEFAULT 'SRM Institute of Science and Technology',
  campus TEXT DEFAULT 'KTR',
  degree TEXT DEFAULT 'B.Tech',
  branch TEXT,
  year INTEGER,
  semester INTEGER DEFAULT 1,
  avatar_url TEXT,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent migrations for existing installations
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS register_no TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS campus TEXT DEFAULT 'KTR';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS semester INTEGER DEFAULT 1;

-- 3. INTERESTS TABLE
CREATE TABLE IF NOT EXISTS public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

-- Seed default interests
INSERT INTO public.interests (name) VALUES
  ('DSA'),
  ('Web Dev'),
  ('AI/ML'),
  ('Cybersecurity'),
  ('Mobile Dev'),
  ('DevOps'),
  ('Data Science'),
  ('UI/UX')
ON CONFLICT (name) DO NOTHING;

-- 4. PROFILE INTERESTS JUNCTION
CREATE TABLE IF NOT EXISTS public.profile_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
  UNIQUE(profile_id, interest_id)
);

-- 5. CONNECTION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CONNECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_a, user_b)
);

-- 7. STUDY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'completed', 'cancelled')) DEFAULT 'upcoming',
  goals JSONB DEFAULT '[]'::jsonB,
  resources JSONB DEFAULT '[]'::jsonB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SESSION PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- 9. STUDY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.study_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  study_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. REALTIME SESSION MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. DIRECT 1-ON-1 MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- AUTOMATIC USER & PROFILE TRIGGER ON SIGNUP
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Insert into public.users first to satisfy foreign key constraints
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;

  -- 2. Insert stub profile into public.profiles
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

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

-- Users: Read for authenticated, insert/update own
DROP POLICY IF EXISTS "Users read policy" ON public.users;
CREATE POLICY "Users read policy" ON public.users FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users update policy" ON public.users;
CREATE POLICY "Users update policy" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);
ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Interests: Anyone authenticated can read
DROP POLICY IF EXISTS "Interests read policy" ON public.interests;
CREATE POLICY "Interests read policy" ON public.interests FOR SELECT TO authenticated USING (true);

-- Profiles: Anyone authenticated can read profiles; owners can update their own
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
CREATE POLICY "Profiles read policy" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Profile Interests: Anyone authenticated can view; owner can modify
DROP POLICY IF EXISTS "Profile interests select" ON public.profile_interests;
CREATE POLICY "Profile interests select" ON public.profile_interests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Profile interests insert" ON public.profile_interests;
CREATE POLICY "Profile interests insert" ON public.profile_interests FOR ALL TO authenticated USING (auth.uid() = profile_id);

-- Session messages: Anyone in the session can view and post
DROP POLICY IF EXISTS "Session messages select" ON public.session_messages;
CREATE POLICY "Session messages select" ON public.session_messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Session messages insert" ON public.session_messages;
CREATE POLICY "Session messages insert" ON public.session_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Direct messages: Senders and receivers can view and send
DROP POLICY IF EXISTS "Direct messages select" ON public.direct_messages;
CREATE POLICY "Direct messages select" ON public.direct_messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Direct messages insert" ON public.direct_messages;
CREATE POLICY "Direct messages insert" ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- ==========================================================
-- ENABLE REALTIME FOR CHAT TABLES
-- ==========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'session_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.session_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'direct_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  END IF;
END $$;

-- ==========================================================
-- BACKFILL EXISTING AUTH USERS INTO USERS & PROFILES
-- ==========================================================
INSERT INTO public.users (id, email, created_at)
SELECT id, email, created_at FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, is_complete)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', ''), FALSE
FROM auth.users
ON CONFLICT (id) DO NOTHING;

