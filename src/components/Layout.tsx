
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { User, Heart, Home, Settings, LogOut, MessageCircle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header with Logo */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/b67f1a2b-54ff-4178-8050-c93aee78de22.png" 
                alt="ContentOasis" 
                className="h-8 w-auto"
              />
              <span className="text-2xl font-bold text-primary">ContentOasis</span>
            </Link>
          </div>
        </header>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Logo */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/b67f1a2b-54ff-4178-8050-c93aee78de22.png" 
              alt="ContentOasis" 
              className="h-8 w-auto"
            />
            <span className="text-2xl font-bold text-primary">ContentOasis</span>
          </Link>
          
          <nav className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-1 text-sm hover:text-primary">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            
            {profile?.role === 'subscriber' && (
              <Link to="/chat" className="flex items-center space-x-1 text-sm hover:text-primary">
                <MessageCircle className="w-4 h-4" />
                <span>Chat</span>
              </Link>
            )}
            
            <Link to="/dashboard" className="flex items-center space-x-1 text-sm hover:text-primary">
              <Settings className="w-4 h-4" />
              <span>{profile?.role === 'creator' ? 'Creator Dashboard' : 'My Subscriptions'}</span>
            </Link>
            
            <Link to="/profile" className="flex items-center space-x-1 text-sm hover:text-primary">
              <User className="w-4 h-4" />
              <span>{profile?.username}</span>
            </Link>
            
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
