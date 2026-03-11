import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useCountUp } from '@/hooks/useCountUp';

const stats = [
  { value: 500, suffix: '+', label: 'Businesses Using AI Meeting' },
  { value: 2, suffix: 'M+', label: 'Calls Handled Monthly' },
  { value: 68, suffix: '%', label: 'Average Cost Reduction' },
  { value: 24, suffix: '/7', label: 'Always Available' },
];

const testimonials = [
  {
    quote:
      "AI Meeting handles 80% of our reservation calls. We haven't missed an order since we started.",
    name: 'Maria S.',
    title: 'Restaurant Owner, New Jersey',
    rating: 5,
  },
  {
    quote:
      'Our salon books 40% more appointments now. The AI is indistinguishable from a real receptionist.',
    name: 'David K.',
    title: 'Salon Owner, New York',
    rating: 5,
  },
  {
    quote: 'Setup took 20 minutes. ROI in the first week.',
    name: 'Tom R.',
    title: 'Auto Shop Owner, California',
    rating: 5,
  },
];

export function StatsSection() {
  const { ref, isVisible } = useScrollReveal();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const stat0 = useCountUp(stats[0].value, 2000, isVisible);
  const stat1 = useCountUp(stats[1].value, 2000, isVisible);
  const stat2 = useCountUp(stats[2].value, 2000, isVisible);
  const stat3 = useCountUp(stats[3].value, 1500, isVisible);
  const counts = [stat0, stat1, stat2, stat3];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-navy text-white" ref={ref}>
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 section-fade ${isVisible ? 'visible' : ''}`}>
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, i) => (
            <div key={stat.label} className="text-center">
              <div className="font-heading text-4xl sm:text-5xl font-extrabold text-white mb-2">
                {counts[i]}
                <span className="text-blue-light">{stat.suffix}</span>
              </div>
              <p className="text-sm text-blue-light/60">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="max-w-3xl mx-auto">
          <div className="glass-card-dark p-8 sm:p-10 text-center transition-all duration-500">
            {/* Stars */}
            <div className="flex justify-center gap-1 mb-6">
              {Array.from({ length: testimonials[activeTestimonial].rating }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-gold-accent text-gold-accent" />
              ))}
            </div>

            <blockquote className="text-lg sm:text-xl text-white/90 leading-relaxed mb-6 font-body">
              "{testimonials[activeTestimonial].quote}"
            </blockquote>

            <div>
              <p className="font-heading font-semibold text-white">
                {testimonials[activeTestimonial].name}
              </p>
              <p className="text-sm text-blue-light/60">
                {testimonials[activeTestimonial].title}
              </p>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === activeTestimonial ? 'bg-primary w-6' : 'bg-white/20'
                }`}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
