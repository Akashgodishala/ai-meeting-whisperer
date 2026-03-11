import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { VapiLiveDemo } from '@/components/landing/VapiLiveDemo';
import { LiveDemoSection } from '@/components/landing/LiveDemoSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { SMSPaymentDemo } from '@/components/landing/SMSPaymentDemo';
import { UseCasesSection } from '@/components/landing/UseCasesSection';
import { TechStackSection } from '@/components/landing/TechStackSection';
import { AgentConfigSection } from '@/components/landing/AgentConfigSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTABanner } from '@/components/landing/CTABanner';
import { Footer } from '@/components/landing/Footer';

const Home = () => {
  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <HeroSection />
      <VapiLiveDemo />
      <LiveDemoSection />
      <HowItWorksSection />
      <FeaturesSection />
      <SMSPaymentDemo />
      <UseCasesSection />
      <TechStackSection />
      <AgentConfigSection />
      <StatsSection />
      <PricingSection />
      <FAQSection />
      <CTABanner />
      <Footer />
    </div>
  );
};

export default Home;
