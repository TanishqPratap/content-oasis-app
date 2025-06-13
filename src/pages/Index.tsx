
import React from 'react';
import AnimatedLanding from '@/components/AnimatedLanding';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import PricingSection from '@/components/PricingSection';
import FooterSection from '@/components/FooterSection';

const Index = () => {
  console.log('Index component rendering...');
  
  return (
    <div className="min-h-screen bg-background">
      <AnimatedLanding />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FooterSection />
    </div>
  );
};

export default Index;
