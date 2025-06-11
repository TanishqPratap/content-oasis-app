
import React from 'react';

const Index = () => {
  console.log('Index component rendering...');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to ContentOasis</h1>
        <p className="text-xl text-muted-foreground mb-8">
          The premier content subscription platform for creators and subscribers
        </p>
        <div className="space-x-4">
          <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
            Get Started as Creator
          </button>
          <button className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors">
            Subscribe to Creators
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
