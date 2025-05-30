-- Create the playlists table
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  spotify_playlist_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- Stores genres, moods, regions, eras, etc.
  track_count INTEGER DEFAULT 0,
  spotify_url TEXT, -- URL to the playlist on Spotify
  image_url TEXT, -- URL to the playlist cover image
  is_public BOOLEAN DEFAULT true, -- Whether the playlist is public on Spotify
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own playlists
CREATE POLICY "Users can read own playlists" ON public.playlists
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own playlists
CREATE POLICY "Users can insert own playlists" ON public.playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own playlists
CREATE POLICY "Users can update own playlists" ON public.playlists
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own playlists
CREATE POLICY "Users can delete own playlists" ON public.playlists
  FOR DELETE USING (auth.uid() = user_id);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS playlists_user_id_idx ON public.playlists (user_id); 