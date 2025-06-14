
-- Create a table for live streaming sessions
CREATE TABLE public.live_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stream_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('offline', 'live', 'ended')),
  viewer_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on live_streams
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- Allow creators to manage their own streams
CREATE POLICY "Creators can manage their own streams" 
  ON public.live_streams 
  FOR ALL 
  USING (creator_id = auth.uid());

-- Allow public read access to live streams for subscribers
CREATE POLICY "Public can view live streams" 
  ON public.live_streams 
  FOR SELECT 
  TO public 
  USING (true);

-- Create a table for stream viewers
CREATE TABLE public.stream_viewers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(stream_id, viewer_id)
);

-- Enable RLS on stream_viewers
ALTER TABLE public.stream_viewers ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own viewing sessions
CREATE POLICY "Users can manage their viewing sessions" 
  ON public.stream_viewers 
  FOR ALL 
  USING (viewer_id = auth.uid());

-- Allow stream owners to see their viewers
CREATE POLICY "Creators can see their stream viewers" 
  ON public.stream_viewers 
  FOR SELECT 
  USING (
    stream_id IN (
      SELECT id FROM live_streams WHERE creator_id = auth.uid()
    )
  );
