import { ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export function CTABanner() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="contact" className="py-24 bg-navy relative overflow-hidden" ref={ref}>
      {/* Animated gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-blue-brand/10 to-navy animate-gradient" />

      <div className={`relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center section-fade ${isVisible ? 'visible' : ''}`}>
        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Ready to Never Miss a Call Again?
        </h2>
        <p className="text-lg text-blue-light/70 mb-10">
          Join 500+ businesses running on AI Meeting
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <a href="/dashboard" className="btn-accent-glow flex items-center gap-2 text-lg px-8 py-4">
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="mailto:hello@aimeeting.app"
            className="px-8 py-4 rounded-xl border-2 border-white/20 text-white font-semibold hover:bg-white/5 transition-colors text-lg"
          >
            Schedule a Demo
          </a>
        </div>
      </div>
    </section>
  );
}
