import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const faqs = [
  {
    q: 'How long does setup take?',
    a: 'Most businesses are live within 20-30 minutes. You tell us your info, we train your agent.',
  },
  {
    q: 'Can I keep my existing phone number?',
    a: "Yes. Simply forward your number to your AI agent. No number change needed.",
  },
  {
    q: 'What happens with complex calls?',
    a: 'Your AI handles 85%+ of calls automatically. For complex cases, it instantly transfers to you with a full conversation summary.',
  },
  {
    q: 'What languages does it support?',
    a: '30+ languages including Spanish, French, Mandarin, Hindi, and more.',
  },
  {
    q: 'Is my customer data secure?',
    a: 'Yes. SOC 2 compliant, encrypted, GDPR-ready.',
  },
  {
    q: "Can I customize the agent's voice and personality?",
    a: "Absolutely. Choose from multiple voices and set your agent's name and personality.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-24 bg-background" ref={ref}>
      <div className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 section-fade ${isVisible ? 'visible' : ''}`}>
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Know
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="glass-card overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
                aria-expanded={openIndex === i}
              >
                <span className="font-heading font-semibold text-foreground pr-4">
                  {faq.q}
                </span>
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  {openIndex === i ? (
                    <Minus className="w-4 h-4 text-primary" />
                  ) : (
                    <Plus className="w-4 h-4 text-primary" />
                  )}
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="px-6 pb-5 text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
