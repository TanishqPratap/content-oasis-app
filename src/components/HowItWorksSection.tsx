
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Upload, CreditCard } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Create Your Account',
    description: 'Sign up as a creator or subscriber in just a few clicks. Choose your role and set up your profile.'
  },
  {
    icon: Upload,
    step: '02',
    title: 'Upload Content',
    description: 'Creators can upload exclusive content, set subscription prices, and build their premium content library.'
  },
  {
    icon: CreditCard,
    step: '03',
    title: 'Start Earning',
    description: 'Subscribers discover and pay for content they love. Creators earn recurring revenue from their work.'
  }
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How ContentOasis Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started in three simple steps and begin your content monetization journey today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="relative border-0 shadow-lg text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
