import { Phone, Brain, Rocket } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const steps = [
  {
    icon: Phone,
    number: '1',
    title: 'Connect Your Number',
    description:
      'Get a dedicated business phone number or forward your existing number to your AI agent.',
  },
  {
    icon: Brain,
    number: '2',
    title: 'Train Your Agent',
    description:
      'Tell us your menu, services, hours, and FAQs. Your agent learns your business in minutes.',
  },
  {
    icon: Rocket,
    number: '3',
    title: 'Go Live',
    description:
      'Your AI agent answers every call instantly, 24/7. You get a dashboard with every call transcript and summary.',
  },
];

export function HowItWorksSection() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="how-it-works" className="py-24 bg-background" ref={ref}>
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 section-fade ${isVisible ? 'visible' : ''}`}>
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Up and Running in 3 Steps
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

          {steps.map((step) => (
            <div key={step.number} className="relative text-center hover-lift">
              {/* Number circle */}
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-6 relative z-10 bg-background">
                <span className="font-heading text-2xl font-bold text-primary">
                  {step.number}
                </span>
              </div>

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-6 h-6 text-primary" />
              </div>

              <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
