import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, DollarSign, Users, Eye, Settings, Image as ImageIcon, Video, FileText, MessageCircle } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import ContentUpload from '@/components/ContentUpload';
import LiveStreamManager from '@/components/LiveStreamManager';

type Content = Database['public']['Tables']['content']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type ChatSession = Database['public']['Tables']['chat_sessions']['Row'];

export default function Dashboard() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<Content[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [subscriptionPrice, setSubscriptionPrice] = useState(profile?.subscription_price?.toString() || '');
  const [chatRate, setChatRate] = useState(profile?.chat_rate?.toString() || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    monthlyRevenue: 0,
    totalViews: 0,
    chatEarnings: 0
  });

  useEffect(() => {
    if (profile?.role !== 'creator') {
      return;
    }
    fetchContent();
    fetchSubscriptions();
    fetchChatSessions();
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
      setStats(prev => ({ ...prev, totalViews: data?.length || 0 }));
    }
  };

  const fetchSubscriptions = async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('creator_id', profile?.id)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching subscriptions:', error);
    } else {
      setSubscriptions(data || []);
      const revenue = (data?.length || 0) * (profile?.subscription_price || 0);
      setStats(prev => ({ 
        ...prev, 
        totalSubscribers: data?.length || 0,
        monthlyRevenue: revenue
      }));
    }
  };

  const fetchChatSessions = async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('creator_id', profile?.id)
      .eq('payment_status', 'paid');

    if (error) {
      console.error('Error fetching chat sessions:', error);
    } else {
      setChatSessions(data || []);
      const chatEarnings = data?.reduce((total, session) => total + (session.total_amount || 0), 0) || 0;
      setStats(prev => ({ ...prev, chatEarnings }));
    }
  };

  const updateCreatorProfile = async () => {
    setLoading(true);
    try {
      const { error } = await updateProfile({
        bio,
        subscription_price: subscriptionPrice ? parseFloat(subscriptionPrice) : null,
        chat_rate: chatRate ? parseFloat(chatRate) : null
      });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your creator profile has been updated successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const deleteContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      toast({
        title: "Content deleted",
        description: "Your content has been removed successfully."
      });
      
      fetchContent();
    } catch (error: any) {
      toast({
        title: "Error deleting content",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (profile?.role !== 'creator') {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Creator Dashboard</h1>
        <p className="text-muted-foreground mb-4">This page is only available for creators.</p>
        <p className="text-sm text-muted-foreground">
          Switch to creator mode in your profile settings to access this dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage your content and track your success</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)} size="lg">
          <Upload className="w-4 h-4 mr-2" />
          {showUpload ? 'Hide Upload' : 'Create Content'}
        </Button>
      </div>

      {showUpload && (
        <ContentUpload
          onContentUploaded={() => {
            fetchContent();
            setShowUpload(false);
          }}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSubscribers === 0 ? 'No subscribers yet' : 'Active subscribers'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From active subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat Earnings</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.chatEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From paid chats</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Posts</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{content.length}</div>
            <p className="text-xs text-muted-foreground">Total uploads</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Streaming Section */}
      <LiveStreamManager />

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Creator Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bio">Creator Bio</Label>
            <Input
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your subscribers about yourself and your content..."
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Monthly Subscription Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={subscriptionPrice}
                onChange={(e) => setSubscriptionPrice(e.target.value)}
                placeholder="9.99"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Set your monthly subscription price for content access.
              </p>
            </div>
            
            <div>
              <Label htmlFor="chatRate">Hourly Chat Rate ($)</Label>
              <Input
                id="chatRate"
                type="number"
                step="0.01"
                min="0"
                value={chatRate}
                onChange={(e) => setChatRate(e.target.value)}
                placeholder="25.00"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Set your hourly rate for paid DM conversations.
              </p>
            </div>
          </div>
          
          <Button onClick={updateCreatorProfile} disabled={loading}>
            {loading ? 'Updating...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Content Management */}
      <Card>
        <CardHeader>
          <CardTitle>Your Content ({content.length} posts)</CardTitle>
        </CardHeader>
        <CardContent>
          {content.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                No content uploaded yet. Start creating to engage your audience!
              </p>
              <Button onClick={() => setShowUpload(true)}>
                Create Your First Post
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {content.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {item.content_type === 'image' && <ImageIcon className="w-4 h-4 text-blue-500" />}
                        {item.content_type === 'video' && <Video className="w-4 h-4 text-purple-500" />}
                        {item.content_type === 'text' && <FileText className="w-4 h-4 text-green-500" />}
                        <h3 className="font-semibold">{item.title}</h3>
                        {item.is_premium && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                            Premium
                          </span>
                        )}
                      </div>
                      
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Type: {item.content_type}</span>
                        {item.price && <span>Tip: ${item.price}</span>}
                        <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteContent(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                  
                  {item.media_url && (
                    <div className="mt-3">
                      {item.content_type === 'image' ? (
                        <img 
                          src={item.media_url} 
                          alt={item.title} 
                          className="max-w-xs h-32 object-cover rounded border"
                        />
                      ) : item.content_type === 'video' ? (
                        <video 
                          src={item.media_url} 
                          className="max-w-xs h-32 rounded border"
                          controls
                        />
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
