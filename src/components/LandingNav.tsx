
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function LandingNav() {
  return (
    <nav className="fixed top-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="/lovable-uploads/b67f1a2b-54ff-4178-8050-c93aee78de22.png" 
            alt="ContentOasis" 
            className="h-8 w-auto"
          />
          <span className="text-2xl font-bold text-primary">ContentOasis</span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-sm hover:text-primary transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm hover:text-primary transition-colors">
            How It Works
          </a>
          <a href="#testimonials" className="text-sm hover:text-primary transition-colors">
            Testimonials
          </a>
          <a href="#pricing" className="text-sm hover:text-primary transition-colors">
            Pricing
          </a>
        </div>

        <div className="flex items-center space-x-4">
          <Link to="/auth">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="sm">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
