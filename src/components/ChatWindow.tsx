
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Clock, DollarSign, X, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Message = Database['public']['Tables']['messages']['Row'];
type ChatSession = Database['public']['Tables']['chat_sessions']['Row'];

interface ChatWindowProps {
  creatorId: string;
  creatorName: string;
  hourlyRate: number;
  onClose: () => void;
}

export default function ChatWindow({ creatorId, creatorName, hourlyRate, onClose }: ChatWindowProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
    fetchMessages();
  }, [creatorId]);

  useEffect(() => {
    if (currentSession && !currentSession.session_end) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Set up real-time subscription for messages
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${creatorId},recipient_id=eq.${profile?.id}`
        },
        (payload) => {
          setMessages(current => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [creatorId, profile?.id]);

  const initializeChat = async () => {
    // Check if there's an active session
    const { data: existingSession } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('subscriber_id', profile?.id)
      .eq('creator_id', creatorId)
      .is('session_end', null)
      .eq('payment_status', 'paid')
      .single();

    if (existingSession) {
      setCurrentSession(existingSession);
      const startTime = new Date(existingSession.session_start).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeElapsed(elapsed);
    } else {
      // Create new session (in a real app, this would involve payment processing)
      await startNewSession();
    }
    setLoading(false);
  };

  const startNewSession = async () => {
    try {
      const { data: newSession, error } = await supabase
        .from('chat_sessions')
        .insert({
          subscriber_id: profile?.id,
          creator_id: creatorId,
          hourly_rate: hourlyRate,
          payment_status: 'paid' // In a real app, this would be 'pending' until payment is processed
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(newSession);
      setTimeElapsed(0);

      toast({
        title: "Chat session started!",
        description: `You are now chatting with ${creatorName} at $${hourlyRate}/hour`
      });
    } catch (error: any) {
      toast({
        title: "Error starting chat",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${profile?.id},recipient_id.eq.${creatorId}),and(sender_id.eq.${creatorId},recipient_id.eq.${profile?.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentSession) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: profile?.id,
          recipient_id: creatorId,
          content: newMessage.trim()
        });

      if (error) throw error;

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        sender_id: profile?.id!,
        recipient_id: creatorId,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

      setNewMessage('');
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const endSession = async () => {
    if (!currentSession) return;

    try {
      const sessionDuration = timeElapsed / 3600; // Convert to hours
      const totalAmount = sessionDuration * hourlyRate;

      const { error } = await supabase
        .from('chat_sessions')
        .update({
          session_end: new Date().toISOString(),
          total_amount: totalAmount
        })
        .eq('id', currentSession.id);

      if (error) throw error;

      toast({
        title: "Chat session ended",
        description: `Total time: ${Math.floor(timeElapsed / 60)} minutes. Cost: $${totalAmount.toFixed(2)}`
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Error ending session",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading chat...</div>;
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            {creatorName[0]}
          </div>
          <div>
            <CardTitle className="text-lg">{creatorName}</CardTitle>
            <p className="text-sm text-muted-foreground">${hourlyRate}/hour</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {currentSession && !currentSession.session_end && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(timeElapsed)}
              </Badge>
              <Badge variant="outline">
                <DollarSign className="w-3 h-3 mr-1" />
                ${((timeElapsed / 3600) * hourlyRate).toFixed(2)}
              </Badge>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4 p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Start the conversation with {creatorName}!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.sender_id === profile?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === profile?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="px-6 pb-6">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={!currentSession || !!currentSession.session_end}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || !currentSession || !!currentSession.session_end}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {currentSession && !currentSession.session_end && (
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                Session active • Charged every second
              </p>
              <Button variant="outline" size="sm" onClick={endSession}>
                End Session
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
