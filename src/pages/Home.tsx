import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Lock, Users, Star, Play, Image as ImageIcon } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

type Content = Database['public']['Tables']['content']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
};

type Subscription = Database['public']['Tables']['subscriptions']['Row'];

export default function Home() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<Content[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchContent();
      fetchSubscriptions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('subscriber_id', user.id)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching subscriptions:', error);
    } else {
      setSubscriptions(data || []);
    }
  };

  const fetchContent = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('content')
      .select(`
        *,
        profiles!inner(*)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error loading content",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setContent(data as Content[] || []);
    }
    setLoading(false);
  };

  const isSubscribedTo = (creatorId: string) => {
    return subscriptions.some(sub => sub.creator_id === creatorId);
  };

  const handleSubscribe = async (creatorId: string, price: number) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          subscriber_id: user?.id,
          creator_id: creatorId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      toast({
        title: "Subscription successful!",
        description: `You're now subscribed and can view premium content.`
      });

      fetchSubscriptions();
      fetchContent();
    } catch (error: any) {
      toast({
        title: "Subscription failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-2xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Welcome to ContentOasis</h1>
          <p className="text-xl text-muted-foreground mb-8">
            The premier content subscription platform for creators and subscribers
          </p>
          <div className="space-x-4">
            <Link to="/auth">
              <Button size="lg">
                Get Started as Creator
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="secondary" size="lg">
                Subscribe to Creators
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>Loading content...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {profile?.display_name || profile?.username}!
        </h1>
        <p className="text-muted-foreground">
          Discover amazing content from your favorite creators
        </p>
      </div>

      {content.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No content available</h3>
            <p className="text-muted-foreground mb-4">
              Start following creators to see their content in your feed
            </p>
            <Button>
              <Link to="/dashboard">Discover Creators</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {content.map((item) => {
            const isSubscribed = isSubscribedTo(item.creator_id);
            const canViewContent = !item.is_premium || isSubscribed || item.creator_id === user.id;

            return (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {item.profiles.display_name?.[0] || item.profiles.username[0]}
                      </div>
                      <div>
                        <CardTitle className="text-sm flex items-center gap-2">
                          {item.profiles.display_name || item.profiles.username}
                          {item.profiles.is_verified && (
                            <Star className="w-4 h-4 text-blue-500 fill-current" />
                          )}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">@{item.profiles.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.is_premium && (
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          Premium
                        </span>
                      )}
                      <Button variant="ghost" size="sm">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  {item.description && (
                    <p className="text-muted-foreground mb-4">{item.description}</p>
                  )}
                  
                  {canViewContent ? (
                    <div className="space-y-4">
                      {item.media_url && (
                        <div className="rounded-lg overflow-hidden bg-muted">
                          {item.content_type === 'image' ? (
                            <img 
                              src={item.media_url} 
                              alt={item.title} 
                              className="w-full max-h-96 object-cover"
                            />
                          ) : item.content_type === 'video' ? (
                            <video 
                              src={item.media_url} 
                              controls 
                              className="w-full max-h-96"
                              poster=""
                            >
                              Your browser does not support the video tag.
                            </video>
                          ) : null}
                        </div>
                      )}
                      
                      {item.content_type === 'text' && (
                        <div className="bg-muted rounded-lg p-4">
                          <p className="text-sm">{item.description || "Text content available for viewing..."}</p>
                        </div>
                      )}

                      {item.price && (
                        <div className="text-center">
                          <Button variant="outline" size="sm">
                            Tip ${item.price}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-muted rounded-lg p-6 text-center">
                      <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-3">
                        This premium content is for subscribers only
                      </p>
                      {item.profiles.subscription_price && (
                        <Button 
                          size="sm"
                          onClick={() => handleSubscribe(item.creator_id, item.profiles.subscription_price!)}
                        >
                          Subscribe for ${item.profiles.subscription_price}/month
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      {item.content_type === 'image' && <ImageIcon className="w-3 h-3" />}
                      {item.content_type === 'video' && <Play className="w-3 h-3" />}
                      <span className="capitalize">{item.content_type}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
