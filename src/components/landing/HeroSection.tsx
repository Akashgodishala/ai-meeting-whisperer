import { useEffect, useState } from 'react';
import { Phone, Calendar, CreditCard, ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const chatMessages = [
  { role: 'customer' as const, text: "Hi, I'd like to book a haircut for tomorrow 3pm" },
  { role: 'agent' as const, text: "Of course! I have 3pm available with Sarah. Can I confirm your name and number?" },
  { role: 'customer' as const, text: "John, 555-1234" },
  { role: 'agent' as const, text: "Perfect! Booked ✓ You'll receive a confirmation SMS shortly. Anything else?" },
];

const floatingBadges = [
  { text: 'Order Taken ✓', delay: '0s', x: '-left-12', y: 'top-20' },
  { text: 'Payment Sent ✓', delay: '1s', x: '-right-10', y: 'top-1/3' },
  { text: 'Appointment Booked ✓', delay: '2s', x: '-left-8', y: 'bottom-28' },
];

export function HeroSection() {
  const [visibleMessages, setVisibleMessages] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleMessages((prev) => {
        if (prev >= chatMessages.length) {
          setTimeout(() => setVisibleMessages(0), 2000);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="min-h-screen flex items-center pt-16 bg-gradient-to-br from-background via-secondary to-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5">
              <span className="w-2 h-2 rounded-full bg-green-accent animate-pulse" />
              <span className="text-sm font-medium text-foreground">
                AI-Powered · Always Live
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground">
              Your Business{' '}
              <span className="gradient-text">Never Misses</span>
              <br />A Call Again.
            </h1>

            {/* Subheading */}
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              AI Meeting handles every customer call — taking orders, booking
              appointments, sending payment links, and answering questions.
              24 hours a day. 7 days a week. Zero staff needed.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Phone, text: 'Handles Calls' },
                { icon: Calendar, text: 'Books Appointments' },
                { icon: CreditCard, text: 'Payment Links' },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10"
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{text}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link to="/dashboard" className="btn-accent-glow flex items-center gap-2 text-base">
                Try It Free — No Credit Card
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#demo"
                className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-primary/20 text-primary font-semibold hover:bg-primary/5 transition-colors"
              >
                <Play className="w-4 h-4" />
                Hear a Live Demo Call
              </a>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Trusted by 500+ retail businesses</span>
              <span className="text-gold-accent">⭐⭐⭐⭐⭐</span>
              <span>4.9/5 rating</span>
            </div>
          </div>

          {/* Right Side — Phone Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              {/* Floating badges */}
              {floatingBadges.map((badge) => (
                <div
                  key={badge.text}
                  className={`absolute ${badge.x} ${badge.y} z-10 hidden lg:block animate-float`}
                  style={{ animationDelay: badge.delay }}
                >
                  <div className="glass-card px-4 py-2 text-sm font-medium text-foreground whitespace-nowrap animate-pulse-badge">
                    {badge.text}
                  </div>
                </div>
              ))}

              {/* Phone Frame */}
              <div className="w-[300px] sm:w-[320px] rounded-[2.5rem] border-[6px] border-foreground/10 bg-background shadow-premium overflow-hidden">
                {/* Notch */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-28 h-5 rounded-full bg-foreground/10" />
                </div>

                {/* Chat area */}
                <div className="px-4 pb-6 min-h-[420px] flex flex-col justify-end gap-3">
                  {chatMessages.slice(0, visibleMessages).map((msg, i) => (
                    <div
                      key={i}
                      className={`animate-chat-in flex ${
                        msg.role === 'customer' ? 'justify-end' : 'justify-start'
                      }`}
                      style={{ animationDelay: `${i * 0.15}s` }}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          msg.role === 'customer'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-secondary text-secondary-foreground rounded-bl-md'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {visibleMessages < chatMessages.length && visibleMessages > 0 && (
                    <div className="flex gap-1 px-4 py-3 bg-secondary rounded-2xl rounded-bl-md w-16">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-dot"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom bar */}
                <div className="h-5 bg-foreground/5" />
              </div>
            </div>

            {/* Background glow */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,hsl(216_100%_50%/0.08)_0%,transparent_70%)]" />
          </div>
        </div>
      </div>
    </section>
  );
}
