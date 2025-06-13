
import React from 'react';
import { Link } from 'react-router-dom';

export default function FooterSection() {
  return (
    <footer className="bg-muted py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <img 
                src="/lovable-uploads/b67f1a2b-54ff-4178-8050-c93aee78de22.png" 
                alt="ContentOasis" 
                className="h-8 w-auto"
              />
              <span className="text-2xl font-bold text-primary">ContentOasis</span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-md">
              The premier content subscription platform for creators and subscribers. 
              Build, grow, and monetize your content with ContentOasis.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-primary">Features</a></li>
              <li><a href="#pricing" className="hover:text-primary">Pricing</a></li>
              <li><Link to="/auth" className="hover:text-primary">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Help Center</a></li>
              <li><a href="#" className="hover:text-primary">Contact Us</a></li>
              <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 ContentOasis. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
