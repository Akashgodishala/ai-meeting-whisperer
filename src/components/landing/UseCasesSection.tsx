import { useState } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const industries = [
  {
    emoji: '🍕',
    label: 'Restaurants',
    headline: 'Never miss an order, even during rush hour',
    conversation: [
      { speaker: 'Customer', text: 'Can I order 2 large pepperoni pizzas for delivery?' },
      { speaker: 'AI', text: 'Absolutely! Two large pepperoni pizzas. What\'s your delivery address?' },
    ],
    features: ['Order taking', 'Menu inquiries', 'Delivery scheduling', 'Payment collection'],
  },
  {
    emoji: '💇',
    label: 'Salons & Spas',
    headline: 'Book appointments while you focus on clients',
    conversation: [
      { speaker: 'Customer', text: 'Do you have any openings for a color treatment Saturday?' },
      { speaker: 'AI', text: 'Yes! We have 10am and 2pm with Lisa. Which do you prefer?' },
    ],
    features: ['Appointment booking', 'Service info', 'Rescheduling', 'Reminders'],
  },
  {
    emoji: '🏥',
    label: 'Clinics',
    headline: 'Manage patient scheduling effortlessly',
    conversation: [
      { speaker: 'Customer', text: 'I need to schedule a check-up with Dr. Patel.' },
      { speaker: 'AI', text: 'Dr. Patel has Tuesday at 9am or Wednesday at 3pm. Which works?' },
    ],
    features: ['Patient scheduling', 'Insurance queries', 'Prescription refills', 'Wait times'],
  },
  {
    emoji: '🚗',
    label: 'Auto Shops',
    headline: 'Handle service bookings and status updates',
    conversation: [
      { speaker: 'Customer', text: 'Is my car ready? I dropped it off for brake service.' },
      { speaker: 'AI', text: 'Your 2021 Camry brake service is complete! Total is $285. Ready for pickup.' },
    ],
    features: ['Service scheduling', 'Status updates', 'Estimates', 'Parts availability'],
  },
  {
    emoji: '🛍️',
    label: 'Retail Stores',
    headline: 'Answer product questions and take orders by phone',
    conversation: [
      { speaker: 'Customer', text: 'Do you have the Nike Air Max in size 10?' },
      { speaker: 'AI', text: 'Yes! We have them in black and white. Would you like to reserve a pair?' },
    ],
    features: ['Inventory checks', 'Phone orders', 'Store hours', 'Promotions'],
  },
  {
    emoji: '🏋️',
    label: 'Fitness Studios',
    headline: 'Class bookings and membership inquiries on autopilot',
    conversation: [
      { speaker: 'Customer', text: 'Can I sign up for the 6pm yoga class tomorrow?' },
      { speaker: 'AI', text: 'You\'re booked for tomorrow\'s 6pm Vinyasa Flow with Maya. See you there!' },
    ],
    features: ['Class bookings', 'Membership info', 'Schedule changes', 'Trainer availability'],
  },
];

export function UseCasesSection() {
  const [activeTab, setActiveTab] = useState(0);
  const { ref, isVisible } = useScrollReveal();

  const industry = industries[activeTab];

  return (
    <section id="use-cases" className="py-24 bg-background" ref={ref}>
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 section-fade ${isVisible ? 'visible' : ''}`}>
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Built for Every Type of Retail Business
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {industries.map((ind, i) => (
            <button
              key={ind.label}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === i
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'bg-secondary text-muted-foreground hover:bg-primary/5'
              }`}
            >
              {ind.emoji} {ind.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass-card p-8 lg:p-12 transition-all duration-300">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <h3 className="font-heading text-2xl font-bold text-foreground mb-6">
                {industry.headline}
              </h3>

              {/* Conversation */}
              <div className="space-y-3 mb-8">
                {industry.conversation.map((line, i) => (
                  <div
                    key={i}
                    className={`flex ${line.speaker === 'Customer' ? '' : 'flex-row-reverse'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        line.speaker === 'Customer'
                          ? 'bg-secondary text-foreground'
                          : 'bg-primary/10 text-foreground'
                      }`}
                    >
                      <span className="text-xs font-medium text-muted-foreground block mb-1">
                        {line.speaker}
                      </span>
                      {line.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-heading text-lg font-semibold text-foreground mb-4">
                Key Features for {industry.label}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {industry.features.map((feat) => (
                  <div
                    key={feat}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-accent" />
                    <span className="text-sm text-foreground">{feat}</span>
                  </div>
                ))}
              </div>

              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 mt-8 text-primary font-semibold hover:underline"
              >
                See Demo for {industry.label} →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
