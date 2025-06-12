
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Heart, DollarSign, Star } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'] & {
  profiles: Profile;
};

export default function SubscriberDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [creators, setCreators] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'subscriber') {
      fetchSubscriptions();
      fetchCreators();
    }
  }, [profile]);

  const fetchSubscriptions = async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        profiles!subscriptions_creator_id_fkey(*)
      `)
      .eq('subscriber_id', profile?.id)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching subscriptions:', error);
    } else {
      setSubscriptions(data as Subscription[] || []);
    }
  };

  const fetchCreators = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'creator')
      .not('subscription_price', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching creators:', error);
    } else {
      setCreators(data || []);
    }
    setLoading(false);
  };

  const handleSubscribe = async (creatorId: string, subscriptionPrice: number) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          subscriber_id: profile?.id,
          creator_id: creatorId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Successfully subscribed to creator for $${subscriptionPrice}/month`
      });

      fetchSubscriptions();
      fetchCreators();
    } catch (error: any) {
      toast({
        title: "Subscription failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUnsubscribe = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Unsubscribed",
        description: "You have successfully unsubscribed"
      });

      fetchSubscriptions();
      fetchCreators();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (profile?.role !== 'subscriber') {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Subscriber Dashboard</h1>
        <p className="text-muted-foreground">This page is only available for subscribers.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">My Subscriptions</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
            <p className="text-xs text-muted-foreground">Creators you support</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${subscriptions.reduce((total, sub) => total + (sub.profiles.subscription_price || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creators.length}</div>
            <p className="text-xs text-muted-foreground">To discover</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Subscriptions */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {subscription.profiles.display_name?.[0] || subscription.profiles.username[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold">{subscription.profiles.display_name || subscription.profiles.username}</h3>
                      <p className="text-sm text-muted-foreground">@{subscription.profiles.username}</p>
                      {subscription.profiles.bio && (
                        <p className="text-sm text-muted-foreground mt-1">{subscription.profiles.bio}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${subscription.profiles.subscription_price}/month</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => handleUnsubscribe(subscription.id)}
                    >
                      Unsubscribe
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discover Creators */}
      <Card>
        <CardHeader>
          <CardTitle>Discover Creators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => {
              const isSubscribed = subscriptions.some(sub => sub.creator_id === creator.id);
              return (
                <div key={creator.id} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {creator.display_name?.[0] || creator.username[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold">{creator.display_name || creator.username}</h3>
                      <p className="text-sm text-muted-foreground">@{creator.username}</p>
                    </div>
                  </div>
                  
                  {creator.bio && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{creator.bio}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">${creator.subscription_price}/month</p>
                      {creator.is_verified && (
                        <div className="flex items-center text-xs text-blue-600">
                          <Star className="w-3 h-3 mr-1" />
                          Verified
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      disabled={isSubscribed}
                      onClick={() => creator.subscription_price && handleSubscribe(creator.id, creator.subscription_price)}
                    >
                      {isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
