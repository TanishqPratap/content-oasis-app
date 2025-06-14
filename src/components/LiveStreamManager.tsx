
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Users, Copy, Play, Square, Eye } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type LiveStream = Database['public']['Tables']['live_streams']['Row'];
type StreamViewer = Database['public']['Tables']['stream_viewers']['Row'];

export default function LiveStreamManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [viewers, setViewers] = useState<StreamViewer[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    if (profile?.role === 'creator') {
      fetchStreams();
      fetchViewers();
    }
  }, [profile]);

  const fetchStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select('*')
        .eq('creator_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStreams(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching streams",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchViewers = async () => {
    try {
      const { data, error } = await supabase
        .from('stream_viewers')
        .select('*')
        .in('stream_id', streams.map(s => s.id));

      if (error) throw error;
      setViewers(data || []);
    } catch (error: any) {
      console.error('Error fetching viewers:', error);
    }
  };

  const createStream = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your stream.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('live_streams')
        .insert({
          creator_id: profile?.id!,
          title: formData.title,
          description: formData.description || null
        });

      if (error) throw error;

      toast({
        title: "Stream created",
        description: "Your stream has been created successfully."
      });

      setFormData({ title: '', description: '' });
      setShowCreateForm(false);
      fetchStreams();
    } catch (error: any) {
      toast({
        title: "Error creating stream",
        description: error.message,
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const updateStreamStatus = async (streamId: string, status: 'live' | 'ended') => {
    try {
      const updates: any = { status };
      if (status === 'live') {
        updates.started_at = new Date().toISOString();
      } else if (status === 'ended') {
        updates.ended_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('live_streams')
        .update(updates)
        .eq('id', streamId);

      if (error) throw error;

      toast({
        title: status === 'live' ? "Stream started" : "Stream ended",
        description: `Your stream is now ${status}.`
      });

      fetchStreams();
    } catch (error: any) {
      toast({
        title: "Error updating stream",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const copyStreamKey = (streamKey: string) => {
    navigator.clipboard.writeText(streamKey);
    toast({
      title: "Stream key copied",
      description: "Your stream key has been copied to clipboard."
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 hover:bg-red-600">🔴 Live</Badge>;
      case 'ended':
        return <Badge variant="secondary">Ended</Badge>;
      default:
        return <Badge variant="outline">Offline</Badge>;
    }
  };

  const getViewerCount = (streamId: string) => {
    return viewers.filter(v => v.stream_id === streamId && !v.left_at).length;
  };

  if (profile?.role !== 'creator') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Live Streaming
          </CardTitle>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Cancel' : 'Create Stream'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showCreateForm && (
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Create New Stream</h3>
            <div>
              <Label htmlFor="streamTitle">Stream Title</Label>
              <Input
                id="streamTitle"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter stream title..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="streamDesc">Description (Optional)</Label>
              <Textarea
                id="streamDesc"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your stream..."
                className="mt-1"
              />
            </div>
            <Button onClick={createStream} disabled={loading}>
              {loading ? 'Creating...' : 'Create Stream'}
            </Button>
          </div>
        )}

        {streams.length === 0 ? (
          <div className="text-center py-8">
            <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No streams created yet. Start your first live stream!
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              Create Your First Stream
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {streams.map((stream) => (
              <div key={stream.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{stream.title}</h3>
                      {getStatusBadge(stream.status)}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {getViewerCount(stream.id)} viewers
                      </div>
                    </div>
                    {stream.description && (
                      <p className="text-sm text-muted-foreground mb-2">{stream.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Created: {new Date(stream.created_at).toLocaleDateString()}</span>
                      {stream.started_at && (
                        <span>Started: {new Date(stream.started_at).toLocaleString()}</span>
                      )}
                      {stream.ended_at && (
                        <span>Ended: {new Date(stream.ended_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {stream.status === 'offline' && (
                      <Button 
                        size="sm"
                        onClick={() => updateStreamStatus(stream.id, 'live')}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Go Live
                      </Button>
                    )}
                    {stream.status === 'live' && (
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => updateStreamStatus(stream.id, 'ended')}
                      >
                        <Square className="w-4 h-4 mr-1" />
                        End Stream
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Stream Key</Label>
                      <div className="font-mono text-sm bg-background p-2 rounded border mt-1">
                        {stream.stream_key.substring(0, 20)}...
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyStreamKey(stream.stream_key)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Use this stream key in your broadcasting software (OBS, etc.)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
