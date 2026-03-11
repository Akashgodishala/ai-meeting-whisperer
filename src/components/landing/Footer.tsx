import { Mic } from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Demo', href: '#demo' },
    { label: 'API Docs', href: '#' },
  ],
  Industries: [
    { label: 'Restaurants', href: '#use-cases' },
    { label: 'Salons', href: '#use-cases' },
    { label: 'Clinics', href: '#use-cases' },
    { label: 'Auto Shops', href: '#use-cases' },
    { label: 'Retail', href: '#use-cases' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#contact' },
    { label: 'Privacy', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Mic className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading text-lg font-bold text-background">
                AI Meeting
              </span>
            </a>
            <p className="text-sm text-background/50 leading-relaxed mb-4">
              Your 24/7 AI Employee That Never Misses a Call
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              {['LinkedIn', 'Twitter', 'YouTube'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-background/10 flex items-center justify-center text-xs text-background/50 hover:bg-background/20 transition-colors"
                  aria-label={social}
                >
                  {social[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-heading font-semibold text-background mb-4 text-sm">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-background/50 hover:text-background transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-background/10 pt-8 text-center">
          <p className="text-sm text-background/40">
            © 2026 AI Meeting · Built for the businesses that never stop.
          </p>
        </div>
      </div>
    </footer>
  );
}
