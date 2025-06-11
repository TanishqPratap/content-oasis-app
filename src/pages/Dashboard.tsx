
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, DollarSign, Users, Eye } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Content = Database['public']['Tables']['content']['Row'];

export default function Dashboard() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<Content[]>([]);
  const [subscriptionPrice, setSubscriptionPrice] = useState(profile?.subscription_price?.toString() || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'creator') {
      return;
    }
    fetchContent();
  }, [profile]);

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .eq('creator_id', profile?.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error fetching content",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setContent(data || []);
    }
  };

  const updateCreatorProfile = async () => {
    setLoading(true);
    const { error } = await updateProfile({
      bio,
      subscription_price: subscriptionPrice ? parseFloat(subscriptionPrice) : null
    });

    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your creator profile has been updated successfully."
      });
    }
    setLoading(false);
  };

  if (profile?.role !== 'creator') {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Creator Dashboard</h1>
        <p className="text-muted-foreground">This page is only available for creators.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Creator Dashboard</h1>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Upload Content
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No subscribers yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Creator Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your subscribers about yourself..."
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="price">Monthly Subscription Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={subscriptionPrice}
              onChange={(e) => setSubscriptionPrice(e.target.value)}
              placeholder="9.99"
              className="mt-1"
            />
          </div>
          
          <Button onClick={updateCreatorProfile} disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Content */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Content</CardTitle>
        </CardHeader>
        <CardContent>
          {content.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No content uploaded yet. Start creating to engage your audience!
            </p>
          ) : (
            <div className="space-y-4">
              {content.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                    <span>Type: {item.content_type}</span>
                    <span>{item.is_premium ? 'Premium' : 'Free'}</span>
                    <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
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
