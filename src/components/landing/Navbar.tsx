import { useState, useEffect } from 'react';
import { Menu, X, Mic, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Use Cases', href: '#use-cases' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Contact', href: '#contact' }];


  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
      scrolled ?
      'bg-background/90 backdrop-blur-xl shadow-sm border-b border-primary/10' :
      'bg-transparent'}`
      }>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Mic className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">
            Voice  Assistant
      
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </a>
          )}
          <a
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </a>
          <a
            href="/dashboard"
            className="btn-primary-glow text-sm !py-2.5 !px-5">
            Start Free Trial
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu">
          
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen &&
      <div className="md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-primary/10 shadow-lg">
          <div className="px-4 py-6 flex flex-col gap-4">
            {links.map((link) =>
          <a
            key={link.label}
            href={link.href}
            className="text-base font-medium text-foreground py-2"
            onClick={() => setIsOpen(false)}>
                {link.label}
              </a>
          )}
            <a
            href="/dashboard"
            className="text-base font-medium text-foreground py-2 flex items-center gap-2"
            onClick={() => setIsOpen(false)}>
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </a>
            <a
            href="/dashboard"
            className="btn-primary-glow text-center text-sm mt-2"
            onClick={() => setIsOpen(false)}>
              Start Free Trial
            </a>
          </div>
        </div>
      }
    </nav>);

}