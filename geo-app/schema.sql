-- Enable the PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Create Users Table (Public Profile)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create POIs Table
CREATE TABLE IF NOT EXISTS public.pois (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL, -- Longitude/Latitude
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS pois_location_idx ON public.pois USING GIST (location);

-- 3. Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poi_id UUID REFERENCES public.pois(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Reactions Table
CREATE TABLE IF NOT EXISTS public.reactions (
  poi_id UUID REFERENCES public.pois(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('upvote', 'downvote')),
  PRIMARY KEY (poi_id, user_id)
);

-- 5. Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Users Policies
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." 
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- POIs Policies
CREATE POLICY "POIs are viewable by everyone." 
  ON public.pois FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert POIs." 
  ON public.pois FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own POIs." 
  ON public.pois FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own POIs." 
  ON public.pois FOR DELETE USING (auth.uid() = creator_id);

-- Comments Policies
CREATE POLICY "Comments are viewable by everyone." 
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments." 
  ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments." 
  ON public.comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments." 
  ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Reactions Policies
CREATE POLICY "Reactions are viewable by everyone." 
  ON public.reactions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can react." 
  ON public.reactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own reactions." 
  ON public.reactions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions." 
  ON public.reactions FOR DELETE USING (auth.uid() = user_id);

-- 6. Stored Procedures for atomic reaction updates
CREATE OR REPLACE FUNCTION toggle_reaction(p_poi_id UUID, p_type TEXT)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_existing_type TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check existing reaction
  SELECT type INTO v_existing_type FROM public.reactions WHERE poi_id = p_poi_id AND user_id = v_user_id;

  IF v_existing_type IS NULL THEN
    -- No existing reaction, insert new
    INSERT INTO public.reactions (poi_id, user_id, type) VALUES (p_poi_id, v_user_id, p_type);
    IF p_type = 'upvote' THEN
      UPDATE public.pois SET upvotes = upvotes + 1 WHERE id = p_poi_id;
    ELSE
      UPDATE public.pois SET downvotes = downvotes + 1 WHERE id = p_poi_id;
    END IF;
  ELSIF v_existing_type = p_type THEN
    -- Same reaction, remove it (toggle off)
    DELETE FROM public.reactions WHERE poi_id = p_poi_id AND user_id = v_user_id;
    IF p_type = 'upvote' THEN
      UPDATE public.pois SET upvotes = upvotes - 1 WHERE id = p_poi_id;
    ELSE
      UPDATE public.pois SET downvotes = downvotes - 1 WHERE id = p_poi_id;
    END IF;
  ELSE
    -- Different reaction, switch it
    UPDATE public.reactions SET type = p_type WHERE poi_id = p_poi_id AND user_id = v_user_id;
    IF p_type = 'upvote' THEN
      UPDATE public.pois SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = p_poi_id;
    ELSE
      UPDATE public.pois SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = p_poi_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
