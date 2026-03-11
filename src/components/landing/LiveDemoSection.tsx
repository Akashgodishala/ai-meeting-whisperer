import { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const scenarios = [
  {
    label: 'Order Taking',
    transcript: [
      { speaker: 'Customer', text: 'Hi, I want to order a large pepperoni pizza and garlic bread.' },
      { speaker: 'AI Agent', text: 'Great choice! One large pepperoni pizza and garlic bread. Would you like delivery or pickup?' },
      { speaker: 'Customer', text: 'Delivery to 45 Oak Street please.' },
      { speaker: 'AI Agent', text: 'Perfect. Your total is $24.99. I\'ll send a payment link to your phone now. Estimated delivery: 35 minutes.' },
    ],
  },
  {
    label: 'Appointment Booking',
    transcript: [
      { speaker: 'Customer', text: 'I need to book a teeth cleaning appointment.' },
      { speaker: 'AI Agent', text: 'Of course! We have openings this Thursday at 10am or Friday at 2pm. Which works better?' },
      { speaker: 'Customer', text: 'Thursday at 10 works.' },
      { speaker: 'AI Agent', text: 'Booked! Dr. Smith, Thursday 10am. You\'ll get a reminder text 24 hours before.' },
    ],
  },
  {
    label: 'FAQ Handling',
    transcript: [
      { speaker: 'Customer', text: 'What are your store hours this weekend?' },
      { speaker: 'AI Agent', text: 'We\'re open Saturday 9am-8pm and Sunday 10am-6pm. Would you like to schedule a visit?' },
      { speaker: 'Customer', text: 'Do you have parking?' },
      { speaker: 'AI Agent', text: 'Yes! Free parking available in our lot behind the building. Up to 20 spots.' },
    ],
  },
  {
    label: 'Payment Link',
    transcript: [
      { speaker: 'Customer', text: 'I\'d like to pay my outstanding invoice #4521.' },
      { speaker: 'AI Agent', text: 'I found invoice #4521 for $185.00. I can send a secure payment link to your phone right now.' },
      { speaker: 'Customer', text: 'Yes please, send it.' },
      { speaker: 'AI Agent', text: 'Done! Payment link sent to your number ending in 1234. It\'s valid for 24 hours.' },
    ],
  },
];

export function LiveDemoSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { ref, isVisible } = useScrollReveal();

  const waveBars = Array.from({ length: 24 }, (_, i) => ({
    height: Math.random() * 40 + 8,
    delay: i * 0.05,
    duration: 0.8 + Math.random() * 0.6,
  }));

  return (
    <section id="demo" className="py-24 bg-navy text-white" ref={ref}>
      <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 section-fade ${isVisible ? 'visible' : ''}`}>
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            Hear Your AI Agent in Action
          </h2>
          <p className="text-blue-light/80 text-lg">
            Click play to hear a real customer call handled by AI
          </p>
        </div>

        {/* Player Card */}
        <div className="glass-card-dark p-8 space-y-8">
          {/* Waveform */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-primary-foreground" />
              ) : (
                <Play className="w-6 h-6 text-primary-foreground ml-1" />
              )}
            </button>

            <div className="flex-1 flex items-end gap-[3px] h-12 overflow-hidden">
              {waveBars.map((bar, i) => (
                <div
                  key={i}
                  className={`w-full rounded-full bg-primary/60 transition-all ${
                    isPlaying ? 'animate-waveform' : ''
                  }`}
                  style={{
                    height: isPlaying ? undefined : `${bar.height * 0.3}px`,
                    '--wave-height': `${bar.height}px`,
                    '--wave-delay': `${bar.delay}s`,
                    '--wave-duration': `${bar.duration}s`,
                    animationDelay: `${bar.delay}s`,
                    animationDuration: `${bar.duration}s`,
                  } as React.CSSProperties}
                />
              ))}
            </div>

            <span className="text-sm text-blue-light/60 font-mono flex-shrink-0">2:34</span>
          </div>

          {/* Scenario Tabs */}
          <div className="flex flex-wrap gap-2">
            {scenarios.map((s, i) => (
              <button
                key={s.label}
                onClick={() => { setActiveTab(i); setIsPlaying(false); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Transcript */}
          <div className="space-y-4">
            {scenarios[activeTab].transcript.map((line, i) => (
              <div key={i} className={`flex gap-3 ${line.speaker === 'Customer' ? '' : 'flex-row-reverse'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    line.speaker === 'Customer'
                      ? 'bg-white/10 text-white/90'
                      : 'bg-primary/20 text-blue-light'
                  }`}
                >
                  <span className="text-xs font-medium opacity-60 block mb-1">{line.speaker}</span>
                  {line.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-10">
          <a href="#pricing" className="btn-accent-glow inline-flex items-center gap-2 text-base">
            Want this for your business?
          </a>
        </div>
      </div>
    </section>
  );
}
