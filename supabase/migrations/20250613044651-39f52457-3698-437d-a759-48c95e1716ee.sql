
-- Create messages table for the paid DM feature
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create chat sessions table to track paid chat sessions
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(10,2) NOT NULL,
  session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  total_amount DECIMAL(10,2),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages
CREATE POLICY "Users can view their own messages" ON public.messages
FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages" ON public.messages
FOR UPDATE USING (sender_id = auth.uid());

-- Enable RLS on chat sessions table
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat sessions
CREATE POLICY "Users can view their own chat sessions" ON public.chat_sessions
FOR SELECT USING (subscriber_id = auth.uid() OR creator_id = auth.uid());

CREATE POLICY "Subscribers can create chat sessions" ON public.chat_sessions
FOR INSERT WITH CHECK (subscriber_id = auth.uid());

CREATE POLICY "Users can update their own chat sessions" ON public.chat_sessions
FOR UPDATE USING (subscriber_id = auth.uid() OR creator_id = auth.uid());

-- Add chat_rate field to profiles table for creators to set their hourly rates
ALTER TABLE public.profiles ADD COLUMN chat_rate DECIMAL(10,2);

-- Enable realtime for messages and chat sessions
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
