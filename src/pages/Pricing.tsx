import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      icon: <Zap className="w-6 h-6" />,
      price: "$29",
      period: "/month",
      description: "Perfect for small businesses getting started with voice AI",
      features: [
        "1,000 voice minutes/month",
        "Basic AI responses",
        "Email support",
        "SMS integration",
        "Basic analytics",
        "2 voice agents"
      ],
      limitations: [
        "Limited customization",
        "Standard voice quality"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Professional",
      icon: <Star className="w-6 h-6" />,
      price: "$99",
      period: "/month",
      description: "Advanced features for growing businesses",
      features: [
        "5,000 voice minutes/month",
        "Advanced AI with GPT-4",
        "Priority support",
        "Multi-channel integration",
        "Advanced analytics",
        "10 voice agents",
        "Custom voice training",
        "API access",
        "Webhook integrations"
      ],
      limitations: [],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      icon: <Crown className="w-6 h-6" />,
      price: "Custom",
      period: "",
      description: "Tailored solutions for large organizations",
      features: [
        "Unlimited voice minutes",
        "Custom AI models",
        "24/7 dedicated support",
        "White-label solution",
        "Advanced security & compliance",
        "Unlimited voice agents",
        "Custom integrations",
        "SLA guarantees",
        "On-premise deployment",
        "Custom training & onboarding"
      ],
      limitations: [],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const features = [
    {
      name: "Voice Minutes",
      starter: "1,000/month",
      professional: "5,000/month",
      enterprise: "Unlimited"
    },
    {
      name: "AI Model",
      starter: "GPT-3.5",
      professional: "GPT-4",
      enterprise: "Custom Models"
    },
    {
      name: "Voice Agents",
      starter: "2",
      professional: "10",
      enterprise: "Unlimited"
    },
    {
      name: "Response Time",
      starter: "< 1 second",
      professional: "< 500ms",
      enterprise: "< 200ms"
    },
    {
      name: "Languages",
      starter: "5",
      professional: "15",
      enterprise: "All Supported"
    },
    {
      name: "Integrations",
      starter: "Basic",
      professional: "Advanced",
      enterprise: "Custom"
    },
    {
      name: "Analytics",
      starter: "Basic",
      professional: "Advanced",
      enterprise: "Custom Dashboard"
    },
    {
      name: "Support",
      starter: "Email",
      professional: "Priority",
      enterprise: "24/7 Dedicated"
    }
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-6xl font-bold gradient-text mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the perfect plan for your business needs. Start with a free trial, no credit card required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`p-8 glass-effect relative transition-all duration-300 hover:scale-[1.02] ${
                plan.popular ? 'glow-effect border-primary' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-lg mb-4">
                  <div className="text-primary">
                    {plan.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold gradient-text">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                
                {plan.limitations.map((limitation, idx) => (
                  <div key={idx} className="flex items-center space-x-3 text-muted-foreground">
                    <div className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">• {limitation}</span>
                  </div>
                ))}
              </div>

              <Button 
                className={`w-full ${plan.popular ? 'glow-effect' : ''}`}
                variant={plan.popular ? 'default' : 'outline'}
                asChild
              >
                <Link to="/dashboard">
                  {plan.cta}
                </Link>
              </Button>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold gradient-text mb-4">
              Feature Comparison
            </h2>
            <p className="text-xl text-muted-foreground">
              Compare all features across our pricing plans
            </p>
          </div>

          <Card className="overflow-hidden glass-effect">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-6 font-semibold">Feature</th>
                    <th className="text-center p-6 font-semibold">Starter</th>
                    <th className="text-center p-6 font-semibold">Professional</th>
                    <th className="text-center p-6 font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr key={index} className="border-b border-border/50 last:border-b-0">
                      <td className="p-6 font-medium">{feature.name}</td>
                      <td className="p-6 text-center text-muted-foreground">{feature.starter}</td>
                      <td className="p-6 text-center text-muted-foreground">{feature.professional}</td>
                      <td className="p-6 text-center text-muted-foreground">{feature.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold gradient-text mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-6 glass-effect">
              <h3 className="font-semibold mb-3">Can I change plans anytime?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated.
              </p>
            </Card>

            <Card className="p-6 glass-effect">
              <h3 className="font-semibold mb-3">What happens if I exceed my minutes?</h3>
              <p className="text-muted-foreground text-sm">
                Additional minutes are charged at $0.05 per minute. You'll receive notifications as you approach your limit.
              </p>
            </Card>

            <Card className="p-6 glass-effect">
              <h3 className="font-semibold mb-3">Is there a setup fee?</h3>
              <p className="text-muted-foreground text-sm">
                No setup fees for Starter and Professional plans. Enterprise plans may include custom setup based on requirements.
              </p>
            </Card>

            <Card className="p-6 glass-effect">
              <h3 className="font-semibold mb-3">Do you offer refunds?</h3>
              <p className="text-muted-foreground text-sm">
                We offer a 30-day money-back guarantee for all paid plans. Contact support for refund requests.
              </p>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Card className="p-12 glass-effect glow-effect max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold gradient-text mb-6">
              Start Your Free Trial Today
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              No credit card required. Get started in minutes with full access to Professional features.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="glow-effect" asChild>
                <Link to="/dashboard">
                  Start Free Trial
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/dashboard">
                  Talk to Sales
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pricing;