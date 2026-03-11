import { useState } from 'react';
import { Check } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const plans = [
  {
    name: 'Starter',
    price: { monthly: 49, annual: 39 },
    features: [
      '1 AI Agent',
      '500 minutes/month',
      'Order taking',
      'Appointment booking',
      'Email notifications',
      'Basic analytics',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    price: { monthly: 149, annual: 119 },
    features: [
      '3 AI Agents',
      '2,000 minutes/month',
      'Everything in Starter +',
      'Payment link sending',
      'CRM integrations',
      'Call transcripts & summaries',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: { monthly: null, annual: null },
    features: [
      'Unlimited agents',
      'Unlimited minutes',
      'Custom voice & personality',
      'White-label option',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="pricing" className="py-24 bg-secondary" ref={ref}>
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 section-fade ${isVisible ? 'visible' : ''}`}>
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            No contracts. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-background rounded-xl p-1 border border-primary/10">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !annual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                annual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Annual
              <span className="ml-1.5 text-xs text-green-accent font-semibold">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass-card p-8 hover-lift relative ${
                plan.popular
                  ? 'border-2 border-primary/30 shadow-glow scale-[1.02] lg:scale-105'
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                {plan.name}
              </h3>

              <div className="mb-6">
                {plan.price.monthly ? (
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading text-4xl font-extrabold text-foreground">
                      ${annual ? plan.price.annual : plan.price.monthly}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                ) : (
                  <span className="font-heading text-3xl font-bold text-foreground">Custom</span>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-green-accent mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  plan.popular
                    ? 'btn-primary-glow'
                    : 'border-2 border-primary/20 text-primary hover:bg-primary/5'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
