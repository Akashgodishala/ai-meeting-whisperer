import { useState } from 'react';
import { MessageSquare, CreditCard, CheckCircle, Calendar, Globe, Send } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export function SMSPaymentDemo() {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [sent, setSent] = useState(false);
  const { ref, isVisible } = useScrollReveal();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && amount) setSent(true);
  };

  const reset = () => {
    setSent(false);
    setPhone('');
    setAmount('');
  };

  const capabilities = [
    { icon: CreditCard, text: 'SMS Payment Links Sent Instantly During Call' },
    { icon: Calendar, text: 'Appointment Confirmation SMS' },
    { icon: MessageSquare, text: 'Order Receipt via Text' },
    { icon: Globe, text: 'Supports 180+ Countries' },
    { icon: CheckCircle, text: '99.95% Delivery Rate' },
  ];

  return (
    <section className="py-24 bg-secondary" ref={ref}>
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 section-fade ${isVisible ? 'visible' : ''}`}>
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            See How <span className="gradient-text">Payment Links</span> Work
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            During a live call, your AI agent sends a secure payment link via SMS — instantly
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Form Side */}
          <div className="glass-card p-8">
            {!sent ? (
              <form onSubmit={handleSend} className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Customer Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full rounded-xl border border-primary/10 bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Order Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="1"
                      step="0.01"
                      className="w-full rounded-xl border border-primary/10 bg-background pl-8 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary-glow w-full flex items-center justify-center gap-2 text-base py-4">
                  <Send className="w-4 h-4" />
                  Send Demo Payment Link
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  This is a visual demo. No actual SMS will be sent.
                </p>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-[hsl(var(--green-accent))]/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-[hsl(var(--green-accent))]" />
                </div>
                <p className="text-foreground font-semibold">Payment Link Sent!</p>
                <p className="text-sm text-muted-foreground">In production, Twilio sends this automatically during the AI call</p>
                <button onClick={reset} className="text-primary text-sm font-medium hover:underline">
                  Try another demo →
                </button>
              </div>
            )}
          </div>

          {/* Phone Mockup Side */}
          <div className="flex justify-center">
            <div className="relative w-[280px]">
              {/* Phone frame */}
              <div className="bg-foreground rounded-[2.5rem] p-3 shadow-2xl">
                <div className="bg-background rounded-[2rem] overflow-hidden">
                  {/* Notch */}
                  <div className="h-7 bg-foreground flex items-center justify-center">
                    <div className="w-20 h-4 bg-foreground rounded-b-xl" />
                  </div>
                  {/* Screen */}
                  <div className="px-4 py-6 min-h-[300px] flex flex-col">
                    <p className="text-xs text-muted-foreground text-center mb-4">Messages</p>
                    
                    <div className={`space-y-3 transition-all duration-700 ${sent ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-2'}`}>
                      <div className="bg-[hsl(var(--green-accent))]/10 border border-[hsl(var(--green-accent))]/20 rounded-2xl rounded-tl-md px-3 py-2.5 max-w-[90%]">
                        <p className="text-xs text-foreground leading-relaxed">
                          Hi! Your order total is <span className="font-bold">${amount || '0.00'}</span>.
                          Click to pay securely:
                        </p>
                        <p className="text-xs text-primary font-medium mt-1 underline">
                          pay.aimeeting.app/inv_demo
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2">— Powered by AI Meeting</p>
                      </div>
                    </div>

                    <div className="mt-auto pt-4">
                      <div className="h-8 rounded-full bg-muted flex items-center px-3">
                        <span className="text-[10px] text-muted-foreground">iMessage</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="mt-16 flex flex-wrap justify-center gap-4">
          {capabilities.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 bg-background border border-primary/10 rounded-full px-4 py-2.5">
              <Icon className="w-4 h-4 text-[hsl(var(--green-accent))]" />
              <span className="text-sm font-medium text-foreground">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
