import { Mic, MessageSquare, Brain, CreditCard } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const techStack = [
  {
    icon: Mic,
    name: 'VAPI',
    label: 'AI Voice Intelligence',
    description: 'Sub-500ms response latency. Natural conversations with zero robotic feel.',
    stat: '<500ms',
    statLabel: 'Response Time',
    color: 'hsl(var(--blue-primary))',
    glow: 'hsl(216 100% 50% / 0.2)',
  },
  {
    icon: MessageSquare,
    name: 'Twilio',
    label: 'Communications Infrastructure',
    description: '99.95% uptime. SMS, calls, payments across 180+ countries.',
    stat: '99.95%',
    statLabel: 'Uptime',
    color: 'hsl(0 72% 51%)',
    glow: 'hsl(0 72% 51% / 0.2)',
  },
  {
    icon: Brain,
    name: 'OpenAI',
    label: 'Language Understanding',
    description: 'GPT-4 powered intent recognition and natural responses.',
    stat: 'GPT-4o',
    statLabel: 'Model',
    color: 'hsl(var(--green-accent))',
    glow: 'hsl(153 100% 41% / 0.2)',
  },
  {
    icon: CreditCard,
    name: 'Stripe',
    label: 'Secure Payments',
    description: 'PCI-compliant payment links sent via SMS during every call.',
    stat: 'PCI-DSS',
    statLabel: 'Compliant',
    color: 'hsl(250 80% 60%)',
    glow: 'hsl(250 80% 60% / 0.2)',
  },
];

export function TechStackSection() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-24 bg-navy text-white" ref={ref}>
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 section-fade ${isVisible ? 'visible' : ''}`}>
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            Enterprise-Grade <span className="gradient-text">Technology Stack</span>
          </h2>
          <p className="text-[hsl(var(--blue-light))]/80 text-lg max-w-2xl mx-auto">
            Built on the same infrastructure trusted by Fortune 500 companies
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {techStack.map((tech) => (
            <div
              key={tech.name}
              className="glass-card-dark p-6 text-center hover-lift group"
              style={{ boxShadow: `0 0 0 1px ${tech.glow}, 0 20px 40px -15px ${tech.glow}` }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: tech.glow }}
              >
                <tech.icon className="w-7 h-7" style={{ color: tech.color }} />
              </div>

              <h3 className="font-heading text-lg font-bold text-white mb-1">{tech.name}</h3>
              <p className="text-xs font-medium text-[hsl(var(--blue-light))]/60 mb-3">{tech.label}</p>
              <p className="text-sm text-white/60 mb-5 leading-relaxed">{tech.description}</p>

              <div className="border-t border-white/10 pt-4">
                <span className="font-mono text-xl font-bold" style={{ color: tech.color }}>{tech.stat}</span>
                <p className="text-xs text-white/40 mt-1">{tech.statLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
