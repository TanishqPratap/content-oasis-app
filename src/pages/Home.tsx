
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Lock, Users } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { Link } from 'react-router-dom';

type Content = Database['public']['Tables']['content']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
};

export default function Home() {
  const { user, profile } = useAuth();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [user]);

  const fetchContent = async () => {
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
    } else {
      setContent(data as Content[] || []);
    }
    setLoading(false);
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
            <Button>Discover Creators</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {content.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      {item.profiles.display_name?.[0] || item.profiles.username[0]}
                    </div>
                    <div>
                      <CardTitle className="text-sm">{item.profiles.display_name || item.profiles.username}</CardTitle>
                      <p className="text-xs text-muted-foreground">@{item.profiles.username}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                {item.description && (
                  <p className="text-muted-foreground mb-4">{item.description}</p>
                )}
                
                {item.is_premium ? (
                  <div className="bg-muted rounded-lg p-6 text-center">
                    <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">
                      This content is for subscribers only
                    </p>
                    <Button size="sm">
                      Subscribe for ${item.profiles.subscription_price}/month
                    </Button>
                  </div>
                ) : (
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm">Free content preview...</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  <span>{item.content_type}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
