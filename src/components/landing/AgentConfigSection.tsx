import { Bot, Clock, Globe, PhoneForwarded, Shield, Sparkles } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const capabilities = [
  'Take food orders / service bookings',
  'Check availability and book appointments',
  'Answer FAQs about hours, location, menu/services',
  'Send payment link via SMS (Twilio)',
  'Collect customer name and contact info',
  'Transfer to human when needed',
];

const specs = [
  { icon: Clock, label: 'Latency', value: '<500ms' },
  { icon: Globe, label: 'Languages', value: '30+' },
  { icon: Shield, label: 'Security', value: 'SOC 2' },
  { icon: Sparkles, label: 'Model', value: 'GPT-4o' },
];

export function AgentConfigSection() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-24 bg-secondary" ref={ref}>
      <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 section-fade ${isVisible ? 'visible' : ''}`}>
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How We Configure <span className="gradient-text">Your Agent</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Every AI agent is trained on your specific business in minutes
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Main Config Card */}
          <div className="lg:col-span-3 glass-card p-8 space-y-6">
            {/* Greeting */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-foreground">AI Greeting</h3>
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 font-mono text-sm text-foreground/80 leading-relaxed">
                "Thank you for calling <span className="text-primary font-semibold">[Your Business]</span>! 
                I'm your AI assistant. How can I help you today?"
              </div>
            </div>

            {/* Capabilities */}
            <div>
              <h3 className="font-heading font-bold text-foreground mb-3">Agent Capabilities</h3>
              <div className="space-y-2">
                {capabilities.map((cap) => (
                  <div key={cap} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--green-accent))]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--green-accent))]" />
                    </div>
                    <span className="text-sm text-foreground/80">{cap}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fallback */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PhoneForwarded className="w-5 h-5 text-[hsl(var(--gold-accent))]" />
                <h3 className="font-heading font-bold text-foreground">Human Handoff</h3>
              </div>
              <div className="bg-[hsl(var(--gold-accent))]/5 border border-[hsl(var(--gold-accent))]/20 rounded-xl p-4 font-mono text-sm text-foreground/80">
                "Let me connect you with our team for that. One moment please."
              </div>
            </div>
          </div>

          {/* Specs sidebar */}
          <div className="lg:col-span-2 space-y-4">
            {specs.map(({ icon: Icon, label, value }) => (
              <div key={label} className="glass-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="font-heading font-bold text-xl text-foreground">{value}</p>
                </div>
              </div>
            ))}

            <div className="glass-card p-5 text-center">
              <p className="text-sm text-muted-foreground mb-3">Voice Options</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {['Professional', 'Warm', 'Energetic', 'Calm'].map(v => (
                  <span key={v} className="text-xs bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
