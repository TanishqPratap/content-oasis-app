
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Shield, Zap, BarChart, Heart } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Creator-First Platform',
    description: 'Built specifically for content creators to monetize their passion and expertise.'
  },
  {
    icon: DollarSign,
    title: 'Flexible Pricing',
    description: 'Set your own subscription prices and keep 90% of your earnings.'
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Enterprise-grade security with automated billing and payment processing.'
  },
  {
    icon: Zap,
    title: 'Instant Publishing',
    description: 'Upload and publish content instantly with our streamlined creator tools.'
  },
  {
    icon: BarChart,
    title: 'Analytics Dashboard',
    description: 'Track your growth with detailed analytics and subscriber insights.'
  },
  {
    icon: Heart,
    title: 'Community Building',
    description: 'Connect with your audience and build lasting relationships with your subscribers.'
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful tools and features designed to help creators build, grow, and monetize their content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
