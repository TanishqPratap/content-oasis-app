
-- Create user roles enum
CREATE TYPE user_role AS ENUM ('creator', 'subscriber', 'admin');

-- Create profiles table with role-based information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'subscriber',
  is_verified BOOLEAN DEFAULT FALSE,
  subscription_price DECIMAL(10,2), -- Monthly subscription price for creators
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create content table for posts
CREATE TABLE public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'video')),
  media_url TEXT, -- For images/videos stored in Supabase Storage
  is_premium BOOLEAN DEFAULT TRUE, -- Whether content requires subscription
  price DECIMAL(10,2), -- Optional tip/pay-per-view price
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(subscriber_id, creator_id)
);

-- Create follows table
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Create tips table
CREATE TABLE public.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Content policies
CREATE POLICY "Anyone can view public content" ON public.content FOR SELECT USING (
  NOT is_premium OR 
  creator_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE subscriber_id = auth.uid() 
    AND creator_id = content.creator_id 
    AND status = 'active'
  )
);
CREATE POLICY "Creators can manage own content" ON public.content FOR ALL USING (creator_id = auth.uid());

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (
  subscriber_id = auth.uid() OR creator_id = auth.uid()
);
CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions FOR ALL USING (
  subscriber_id = auth.uid()
);

-- Follows policies
CREATE POLICY "Users can view all follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON public.follows FOR ALL USING (follower_id = auth.uid());

-- Tips policies
CREATE POLICY "Users can view relevant tips" ON public.tips FOR SELECT USING (
  tipper_id = auth.uid() OR creator_id = auth.uid()
);
CREATE POLICY "Users can create tips" ON public.tips FOR INSERT WITH CHECK (tipper_id = auth.uid());

-- Function to handle user signup and create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for media content
INSERT INTO storage.buckets (id, name, public) VALUES ('content-media', 'content-media', true);

-- Storage policies for content media
CREATE POLICY "Authenticated users can upload content" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'content-media' AND auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view content media" ON storage.objects FOR SELECT USING (
  bucket_id = 'content-media'
);

CREATE POLICY "Users can update own content media" ON storage.objects FOR UPDATE USING (
  bucket_id = 'content-media' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own content media" ON storage.objects FOR DELETE USING (
  bucket_id = 'content-media' AND auth.uid()::text = (storage.foldername(name))[1]
);
