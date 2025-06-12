
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Creator',
    price: 'Free',
    description: 'Perfect for getting started',
    features: [
      'Upload unlimited content',
      'Set your own prices',
      'Basic analytics',
      '10% platform fee',
      'Email support'
    ],
    cta: 'Start Creating',
    popular: false
  },
  {
    name: 'Creator Pro',
    price: '$29',
    period: '/month',
    description: 'For serious content creators',
    features: [
      'Everything in Creator',
      'Advanced analytics',
      'Priority support',
      '5% platform fee',
      'Custom branding',
      'Export subscriber data'
    ],
    cta: 'Go Pro',
    popular: true
  },
  {
    name: 'Subscriber',
    price: 'Variable',
    description: 'Access premium content',
    features: [
      'Subscribe to any creator',
      'Cancel anytime',
      'Mobile & web access',
      'Download for offline',
      'Community features'
    ],
    cta: 'Start Subscribing',
    popular: false
  }
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Flexible pricing for creators and subscribers. Start free and scale as you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative border-2 ${plan.popular ? 'border-primary shadow-xl scale-105' : 'border-border'}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link to="/auth" className="block w-full mt-8">
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
