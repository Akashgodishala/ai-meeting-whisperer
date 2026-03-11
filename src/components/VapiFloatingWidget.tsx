import { useState } from 'react';
import { Phone, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type ModalState = 'closed' | 'form' | 'calling' | 'success' | 'error';

export function VapiFloatingWidget() {
  const [state, setState] = useState<ModalState>('closed');
  const [phone, setPhone] = useState('');

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleCall = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) return;

    setState('calling');
    try {
      const { data, error } = await supabase.functions.invoke('vapi-demo-call', {
        body: { phoneNumber: digits },
      });

      if (error) {
        console.error('Supabase invoke error:', error);
        throw error;
      }
      if (data?.error) {
        console.error('Vapi error:', data.error, data.details);
        throw new Error(data.error);
      }

      setState('success');
      setTimeout(() => {
        setState('closed');
        setPhone('');
      }, 4000);
    } catch {
      setState('error');
    }
  };

  const handleClose = () => {
    setState('closed');
    setPhone('');
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setState('form')}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center bg-[hsl(var(--green-accent))] shadow-[0_0_20px_hsl(var(--green-accent)/0.5)] animate-pulse-badge transition-all duration-300 hover:scale-110"
        aria-label="Talk to AI"
      >
        <Phone className="w-6 h-6 text-white" />
      </button>

      {/* Modal Overlay */}
      {state !== 'closed' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 rounded-2xl border border-border/40 bg-card p-8 shadow-2xl">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {state === 'form' && (
              <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-[hsl(var(--green-accent)/0.15)] flex items-center justify-center">
                  <Phone className="w-8 h-8 text-[hsl(var(--green-accent))]" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground">Get a Demo Call</h2>
                  <p className="text-muted-foreground mt-1">Our AI will call you in seconds!</p>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  className="w-full h-12 rounded-lg border border-border bg-background px-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--green-accent))] text-center tracking-wider"
                />
                <button
                  onClick={handleCall}
                  disabled={phone.replace(/\D/g, '').length !== 10}
                  className="w-full h-12 rounded-lg bg-[hsl(var(--green-accent))] text-white font-semibold text-lg transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Call Me Now
                </button>
                <p className="text-xs text-muted-foreground">Standard call rates apply</p>
              </div>
            )}

            {state === 'calling' && (
              <div className="flex flex-col items-center gap-4 py-6">
                <Loader2 className="w-12 h-12 text-[hsl(var(--gold-accent))] animate-spin" />
                <p className="text-lg font-medium text-foreground">Calling you now...</p>
              </div>
            )}

            {state === 'success' && (
              <div className="flex flex-col items-center gap-4 py-6">
                <span className="text-5xl">📞</span>
                <p className="text-lg font-medium text-foreground">Calling your phone now!</p>
                <p className="text-sm text-muted-foreground">Pick up to talk with our AI agent</p>
              </div>
            )}

            {state === 'error' && (
              <div className="flex flex-col items-center gap-4 py-6">
                <span className="text-5xl">😕</span>
                <p className="text-lg font-medium text-foreground">Something went wrong</p>
                <button
                  onClick={() => setState('form')}
                  className="px-6 py-2 rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
