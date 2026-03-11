import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Mic, 
  Zap, 
  Globe, 
  Brain, 
  Shield, 
  BarChart, 
  Clock,
  Phone,
  MessageSquare,
  Headphones,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Features = () => {
  const features = [
    {
      icon: <Bot className="w-12 h-12" />,
      title: "Advanced AI Conversations",
      description: "Natural language processing with GPT-4 powered responses that understand context and nuance.",
      benefits: ["Human-like interactions", "Context awareness", "Emotional intelligence", "Learning capabilities"]
    },
    {
      icon: <Mic className="w-12 h-12" />,
      title: "Voice Recognition & Synthesis",
      description: "Crystal-clear speech-to-text and text-to-speech with support for multiple languages and accents.",
      benefits: ["99% accuracy", "Real-time processing", "Noise cancellation", "Natural pronunciation"]
    },
    {
      icon: <Phone className="w-12 h-12" />,
      title: "Automated Call Handling",
      description: "Handle incoming calls 24/7 with intelligent routing and automated responses.",
      benefits: ["24/7 availability", "Call routing", "Queue management", "Follow-up scheduling"]
    },
    {
      icon: <MessageSquare className="w-12 h-12" />,
      title: "Multi-Channel Support",
      description: "Seamlessly integrate across voice calls, SMS, chat, and social media platforms.",
      benefits: ["Unified experience", "Cross-platform sync", "Message threading", "Contact history"]
    },
    {
      icon: <Brain className="w-12 h-12" />,
      title: "Intelligent Analytics",
      description: "Deep insights into customer interactions with AI-powered analytics and reporting.",
      benefits: ["Conversation analysis", "Sentiment tracking", "Performance metrics", "Trend identification"]
    },
    {
      icon: <Shield className="w-12 h-12" />,
      title: "Enterprise Security",
      description: "Bank-level security with end-to-end encryption and compliance with industry standards.",
      benefits: ["GDPR compliant", "SOC 2 certified", "Data encryption", "Access controls"]
    },
    {
      icon: <Settings className="w-12 h-12" />,
      title: "Custom Integrations",
      description: "Connect with your existing CRM, helpdesk, and business tools through our API.",
      benefits: ["RESTful API", "Webhook support", "CRM integration", "Custom workflows"]
    },
    {
      icon: <Zap className="w-12 h-12" />,
      title: "Real-time Processing",
      description: "Lightning-fast response times with edge computing and optimized AI models.",
      benefits: ["Sub-second latency", "Edge computing", "Auto-scaling", "Global deployment"]
    }
  ];

  const useCases = [
    {
      title: "Customer Support",
      description: "Automate first-line support with intelligent ticket routing and instant responses.",
      metrics: ["80% reduction in wait times", "24/7 availability", "90% issue resolution"]
    },
    {
      title: "Sales & Lead Generation",
      description: "Qualify leads, schedule appointments, and follow up with prospects automatically.",
      metrics: ["300% more qualified leads", "50% faster response time", "Higher conversion rates"]
    },
    {
      title: "Order Management",
      description: "Process orders, handle inquiries, and manage inventory through voice commands.",
      metrics: ["Reduced order errors", "Faster processing", "Improved accuracy"]
    },
    {
      title: "Appointment Scheduling",
      description: "Schedule, reschedule, and confirm appointments with intelligent calendar management.",
      metrics: ["Reduced no-shows", "Automated reminders", "Calendar sync"]
    }
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-6xl font-bold gradient-text mb-6">
            Powerful Features
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover how Retailer Voice Agent revolutionizes business communication with cutting-edge voice technology
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card key={index} className="p-8 glass-effect glow-effect hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-start space-x-6">
                <div className="text-primary flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Use Cases */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold gradient-text mb-4">
              Use Cases
            </h2>
            <p className="text-xl text-muted-foreground">
              See how businesses across industries are transforming with Retailer Voice Agent
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index} className="p-6 glass-effect">
                <h3 className="text-xl font-semibold mb-3">{useCase.title}</h3>
                <p className="text-muted-foreground mb-4">{useCase.description}</p>
                <div className="space-y-2">
                  {useCase.metrics.map((metric, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm text-green-400">
                      <BarChart className="w-4 h-4" />
                      <span>{metric}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="mb-20">
          <Card className="p-8 glass-effect glow-effect">
            <h2 className="text-3xl font-bold gradient-text mb-8 text-center">
              Technical Specifications
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center">
                  <Zap className="w-6 h-6 mr-2 text-primary" />
                  Performance
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Sub-200ms response time</li>
                  <li>• 99.9% uptime SLA</li>
                  <li>• Auto-scaling infrastructure</li>
                  <li>• Global CDN deployment</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center">
                  <Globe className="w-6 h-6 mr-2 text-primary" />
                  Supported Languages
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• English (US, UK, AU)</li>
                  <li>• Spanish (ES, MX, AR)</li>
                  <li>• French (FR, CA)</li>
                  <li>• German, Italian, Portuguese</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center">
                  <Headphones className="w-6 h-6 mr-2 text-primary" />
                  Audio Quality
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 24kHz audio sampling</li>
                  <li>• Advanced noise reduction</li>
                  <li>• Echo cancellation</li>
                  <li>• HD voice quality</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Card className="p-12 glass-effect glow-effect max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold gradient-text mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Experience the power of Retailer Voice Agent with a free trial
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="glow-effect" asChild>
                <Link to="/pricing">
                  Start Free Trial
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/demo">
                  Try Demo
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Features;