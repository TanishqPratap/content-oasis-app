
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Video, Users, Eye } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type LiveStream = Database['public']['Tables']['live_streams']['Row'] & {
  profiles?: { username: string; display_name: string | null };
};

export default function LiveStreamViewer() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLiveStreams();
    
    // Set up real-time subscription for live stream updates
    const channel = supabase
      .channel('live-streams-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_streams'
      }, () => {
        fetchLiveStreams();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLiveStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select(`
          *,
          profiles:creator_id (username, display_name)
        `)
        .eq('status', 'live')
        .order('started_at', { ascending: false });

      if (error) throw error;
      setLiveStreams(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching live streams",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const joinStream = async (streamId: string) => {
    if (!profile) {
      toast({
        title: "Authentication required",
        description: "Please sign in to watch live streams.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Check if already viewing this stream
      const { data: existingViewer } = await supabase
        .from('stream_viewers')
        .select('*')
        .eq('stream_id', streamId)
        .eq('viewer_id', profile.id)
        .is('left_at', null)
        .single();

      if (!existingViewer) {
        // Add viewer to stream
        const { error } = await supabase
          .from('stream_viewers')
          .insert({
            stream_id: streamId,
            viewer_id: profile.id
          });

        if (error) throw error;

        // Update viewer count
        const { error: updateError } = await supabase.rpc('increment', {
          table_name: 'live_streams',
          row_id: streamId,
          column_name: 'viewer_count'
        });

        if (updateError) console.error('Error updating viewer count:', updateError);
      }

      toast({
        title: "Joined stream",
        description: "You're now watching the live stream!"
      });
    } catch (error: any) {
      toast({
        title: "Error joining stream",
        description: error.message,
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const leaveStream = async (streamId: string) => {
    if (!profile) return;

    try {
      // Update viewer record
      const { error } = await supabase
        .from('stream_viewers')
        .update({ left_at: new Date().toISOString() })
        .eq('stream_id', streamId)
        .eq('viewer_id', profile.id)
        .is('left_at', null);

      if (error) throw error;

      // Update viewer count
      const { error: updateError } = await supabase.rpc('decrement', {
        table_name: 'live_streams',
        row_id: streamId,
        column_name: 'viewer_count'
      });

      if (updateError) console.error('Error updating viewer count:', updateError);

      toast({
        title: "Left stream",
        description: "You've left the live stream."
      });
    } catch (error: any) {
      toast({
        title: "Error leaving stream",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Live Streams ({liveStreams.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {liveStreams.length === 0 ? (
          <div className="text-center py-8">
            <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No live streams at the moment. Check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {liveStreams.map((stream) => (
              <div key={stream.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{stream.title}</h3>
                      <Badge className="bg-red-500 hover:bg-red-600">🔴 Live</Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {stream.viewer_count || 0} viewers
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      by @{stream.profiles?.username || 'Unknown Creator'}
                    </p>
                    
                    {stream.description && (
                      <p className="text-sm mb-2">{stream.description}</p>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      Started: {new Date(stream.started_at!).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => joinStream(stream.id)}
                      disabled={loading}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Watch
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
