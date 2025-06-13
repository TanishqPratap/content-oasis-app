
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Clock, DollarSign, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ChatSession = Database['public']['Tables']['chat_sessions']['Row'] & {
  profiles: Profile;
};

interface ChatListProps {
  onStartChat: (creatorId: string, creatorName: string, hourlyRate: number) => void;
}

export default function ChatList({ onStartChat }: ChatListProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [creators, setCreators] = useState<Profile[]>([]);
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'subscriber') {
      fetchCreators();
      fetchActiveSessions();
    }
  }, [profile]);

  const fetchCreators = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'creator')
      .not('chat_rate', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching creators:', error);
    } else {
      setCreators(data || []);
    }
  };

  const fetchActiveSessions = async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(`
        *,
        profiles!chat_sessions_creator_id_fkey(*)
      `)
      .eq('subscriber_id', profile?.id)
      .is('session_end', null)
      .eq('payment_status', 'paid');

    if (error) {
      console.error('Error fetching active sessions:', error);
    } else {
      setActiveSessions(data as ChatSession[] || []);
    }
    setLoading(false);
  };

  const filteredCreators = creators.filter(creator =>
    creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (profile?.role !== 'subscriber') {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Chat feature is only available for subscribers.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading chats...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search creators to chat with..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Active Chat Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      {session.profiles.display_name?.[0] || session.profiles.username[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold">{session.profiles.display_name || session.profiles.username}</h4>
                      <p className="text-sm text-muted-foreground">${session.hourly_rate}/hour</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                    <Button
                      size="sm"
                      onClick={() => onStartChat(session.creator_id, session.profiles.display_name || session.profiles.username, session.hourly_rate)}
                    >
                      Continue Chat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Creators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Available Creators
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCreators.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No creators available for chat at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCreators.map((creator) => (
                <div key={creator.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {creator.display_name?.[0] || creator.username[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold">{creator.display_name || creator.username}</h3>
                      <p className="text-sm text-muted-foreground">@{creator.username}</p>
                      {creator.bio && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{creator.bio}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm font-semibold mb-2">
                      <DollarSign className="w-4 h-4 mr-1" />
                      ${creator.chat_rate}/hour
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onStartChat(creator.id, creator.display_name || creator.username, creator.chat_rate!)}
                    >
                      Start Chat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
