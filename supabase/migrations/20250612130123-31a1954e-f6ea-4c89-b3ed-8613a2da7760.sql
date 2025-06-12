
-- Create a storage bucket for content uploads (using content-media bucket that already exists)
-- The content-media bucket is already available, so we'll use that

-- Create additional storage policies for subscriber access to content
CREATE POLICY "Subscribers can view subscribed content files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'content-media' 
  AND (
    -- Creator can view their own content
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Subscribers can view if they have active subscription
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      JOIN public.content c ON c.creator_id = s.creator_id
      WHERE s.subscriber_id = auth.uid()
      AND s.status = 'active'
      AND c.media_url LIKE '%' || name || '%'
    )
    OR
    -- Free content is accessible to everyone
    EXISTS (
      SELECT 1 FROM public.content c
      WHERE c.is_premium = false
      AND c.media_url LIKE '%' || name || '%'
    )
  )
);

-- Enable RLS on content table if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'content' AND policyname = 'Creators can view their own content'
  ) THEN
    -- Enable RLS on content table
    ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies for content table
    CREATE POLICY "Creators can view their own content" ON public.content
    FOR SELECT USING (creator_id = auth.uid());

    CREATE POLICY "Creators can insert their own content" ON public.content
    FOR INSERT WITH CHECK (creator_id = auth.uid());

    CREATE POLICY "Creators can update their own content" ON public.content
    FOR UPDATE USING (creator_id = auth.uid());

    CREATE POLICY "Creators can delete their own content" ON public.content
    FOR DELETE USING (creator_id = auth.uid());

    -- Subscribers can view content if they have an active subscription
    CREATE POLICY "Subscribers can view subscribed content" ON public.content
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.subscriptions s
        WHERE s.creator_id = content.creator_id 
        AND s.subscriber_id = auth.uid()
        AND s.status = 'active'
      ) OR NOT is_premium
    );
  END IF;
END $$;

-- Enable RLS on subscriptions table if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'Users can view their own subscriptions'
  ) THEN
    -- Enable RLS on subscriptions table
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies for subscriptions
    CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (subscriber_id = auth.uid() OR creator_id = auth.uid());

    CREATE POLICY "Users can insert subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (subscriber_id = auth.uid());

    CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
    FOR UPDATE USING (subscriber_id = auth.uid() OR creator_id = auth.uid());
  END IF;
END $$;

-- Enable RLS on profiles table if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view all profiles'
  ) THEN
    -- Enable RLS on profiles table
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies for profiles
    CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

    CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

    CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (id = auth.uid());
  END IF;
END $$;
