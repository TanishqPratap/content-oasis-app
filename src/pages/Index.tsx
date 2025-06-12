
import React from 'react';
import LandingNav from '@/components/LandingNav';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import PricingSection from '@/components/PricingSection';
import FooterSection from '@/components/FooterSection';

const Index = () => {
  console.log('Index component rendering...');
  
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FooterSection />
    </div>
  );
};

export default Index;
