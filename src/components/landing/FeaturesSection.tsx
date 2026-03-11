import {
  ShoppingCart,
  Calendar,
  CreditCard,
  Clock,
  Users,
  BarChart3,
  Globe,
  Puzzle,
} from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const features = [
  {
    icon: ShoppingCart,
    title: 'Smart Order Taking',
    description:
      'Customers call, your AI takes complete orders — items, quantities, special requests — and sends you an instant notification.',
    large: true,
  },
  {
    icon: Calendar,
    title: 'Appointment Booking',
    description:
      'Real-time calendar integration. Your AI books, reschedules, and sends reminders automatically.',
    large: true,
  },
  {
    icon: CreditCard,
    title: 'Payment Links',
    description: 'AI sends secure payment links via SMS during the call.',
  },
  {
    icon: Clock,
    title: '24/7 Availability',
    description:
      'Never closed. Handles calls on holidays, nights, weekends — always with the same quality.',
  },
  {
    icon: Users,
    title: 'Human Handoff',
    description:
      'When a call needs a human touch, AI instantly transfers to your team with full context.',
  },
  {
    icon: BarChart3,
    title: 'Call Analytics',
    description:
      'Every call transcribed, summarized, and scored. Know exactly what customers are asking for.',
  },
  {
    icon: Globe,
    title: 'Multi-language',
    description: 'Serves customers in 30+ languages naturally.',
  },
  {
    icon: Puzzle,
    title: 'CRM Integration',
    description:
      'Syncs with your existing tools — Zapier, Google Sheets, Salesforce, and 100+ more.',
  },
];

export function FeaturesSection() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="features" className="py-24 bg-secondary" ref={ref}>
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 section-fade ${isVisible ? 'visible' : ''}`}>
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything Your Business Needs — Built In
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`glass-card p-6 hover-lift border-t-2 border-t-primary/20 ${
                feature.large ? 'lg:col-span-2' : ''
              }`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
