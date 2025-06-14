
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, DollarSign, Users, Eye, Video } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import LiveStreamViewer from '@/components/LiveStreamViewer';

type Content = Database['public']['Tables']['content']['Row'] & {
  profiles?: { username: string; display_name: string | null };
};

type Subscription = Database['public']['Tables']['subscriptions']['Row'];

export default function Home() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<Content[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
    if (profile?.role === 'subscriber') {
      fetchSubscriptions();
    }
  }, [profile]);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select(`
          *,
          profiles:creator_id (username, display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setContent(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching content",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('subscriber_id', profile?.id)
        .eq('status', 'active');

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const isSubscribedTo = (creatorId: string) => {
    return subscriptions.some(sub => sub.creator_id === creatorId);
  };

  const canViewContent = (item: Content) => {
    // Public content or user is subscribed to creator
    return !item.is_premium || isSubscribedTo(item.creator_id) || item.creator_id === profile?.id;
  };

  const subscribe = async (creatorId: string, creatorUsername: string) => {
    if (!profile) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to creators.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          subscriber_id: profile.id,
          creator_id: creatorId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });

      if (error) throw error;

      toast({
        title: "Subscribed successfully",
        description: `You're now subscribed to @${creatorUsername}!`
      });

      fetchSubscriptions();
      fetchContent();
    } catch (error: any) {
      toast({
        title: "Error subscribing",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.username}!</h1>
        <p className="text-muted-foreground">
          Discover exclusive content from your favorite creators
        </p>
      </div>

      {/* Live Streams Section */}
      <LiveStreamViewer />

      {/* Content Feed */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Latest Content</h2>
        
        {content.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No content available</h3>
              <p className="text-muted-foreground">
                Follow some creators to see their latest content here.
              </p>
            </CardContent>
          </Card>
        ) : (
          content.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">@{item.profiles?.username || 'Unknown'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.is_premium && (
                      <Badge variant="secondary">Premium</Badge>
                    )}
                    {!isSubscribedTo(item.creator_id) && item.creator_id !== profile?.id && (
                      <Button 
                        size="sm" 
                        onClick={() => subscribe(item.creator_id, item.profiles?.username || 'creator')}
                      >
                        Subscribe
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <h4 className="font-semibold mb-2">{item.title}</h4>
                
                {item.description && (
                  <p className="text-muted-foreground mb-4">{item.description}</p>
                )}
                
                {canViewContent(item) ? (
                  <>
                    {item.media_url && (
                      <div className="mb-4">
                        {item.content_type === 'image' ? (
                          <img 
                            src={item.media_url} 
                            alt={item.title}
                            className="w-full max-h-96 object-cover rounded-lg"
                          />
                        ) : item.content_type === 'video' ? (
                          <video 
                            src={item.media_url}
                            controls
                            className="w-full max-h-96 rounded-lg"
                          />
                        ) : null}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm">
                          <Heart className="w-4 h-4 mr-1" />
                          Like
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Comment
                        </Button>
                      </div>
                      
                      {item.price && (
                        <Button variant="outline" size="sm">
                          <DollarSign className="w-4 h-4 mr-1" />
                          Tip ${item.price}
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-muted/50 border border-dashed rounded-lg p-8 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Eye className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">Premium Content</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Subscribe to @{item.profiles?.username} to view this content
                    </p>
                    <Button 
                      size="sm"
                      onClick={() => subscribe(item.creator_id, item.profiles?.username || 'creator')}
                    >
                      Subscribe Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
