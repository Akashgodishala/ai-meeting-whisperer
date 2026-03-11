import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

type CallState = 'idle' | 'connecting' | 'active' | 'speaking' | 'ended' | 'error';

interface TranscriptLine {
  role: 'user' | 'assistant';
  text: string;
}

export function VapiLiveDemo() {
  const [callState, setCallState] = useState<CallState>('idle');
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const vapiRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const { ref, isVisible } = useScrollReveal();

  const startTimer = useCallback(() => {
    setDuration(0);
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startCall = async () => {
    try {
      setCallState('connecting');
      setTranscript([]);
      setErrorMsg('');

      const { default: Vapi } = await import('@vapi-ai/web');
      
      const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
      if (!publicKey) {
        setErrorMsg('Demo is being configured. Please check back soon.');
        setCallState('error');
        return;
      }

      const vapi = new Vapi(publicKey);
      vapiRef.current = vapi;

      vapi.on('call-start', () => {
        setCallState('active');
        startTimer();
      });

      vapi.on('speech-start', () => {
        setCallState('speaking');
      });

      vapi.on('speech-end', () => {
        setCallState('active');
      });

      vapi.on('message', (msg: any) => {
        if (msg.type === 'transcript' && msg.transcriptType === 'final') {
          setTranscript(prev => [...prev, { role: msg.role, text: msg.transcript }]);
        }
      });

      vapi.on('call-end', () => {
        setCallState('ended');
        stopTimer();
      });

      vapi.on('error', (err: any) => {
        console.error('Vapi error:', err);
        setErrorMsg('Connection issue. Please try again.');
        setCallState('error');
        stopTimer();
      });

      const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
      if (assistantId) {
        await vapi.start(assistantId);
      } else {
        await vapi.start({
          model: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are a friendly AI assistant for a retail business called "AI Meeting Demo". Greet the caller warmly and demonstrate your capabilities: taking orders, booking appointments, answering questions about business hours, and sending payment links. Keep responses concise and natural. This is a live demo call.`,
              },
            ],
          },
          voice: {
            provider: '11labs',
            voiceId: 'sarah',
          },
          firstMessage: "Thank you for calling! I'm your AI Meeting demo assistant. I can take orders, book appointments, or answer questions. How can I help you today?",
        });
      }
    } catch (err) {
      console.error('Failed to start call:', err);
      setErrorMsg('Could not start the call. Please try again.');
      setCallState('error');
      stopTimer();
    }
  };

  const endCall = () => {
    vapiRef.current?.stop();
    setCallState('ended');
    stopTimer();
  };

  const waveBars = Array.from({ length: 32 }, (_, i) => ({
    height: Math.random() * 28 + 4,
    delay: i * 0.04,
    duration: 0.6 + Math.random() * 0.5,
  }));

  return (
    <section id="live-demo" className="py-24 bg-navy text-white" ref={ref}>
      <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 section-fade ${isVisible ? 'visible' : ''}`}>
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            Talk to Our AI Agent — <span className="gradient-text">Live</span>
          </h2>
          <p className="text-[hsl(var(--blue-light))]/80 text-lg max-w-2xl mx-auto">
            No phone call needed. Click the button below and speak directly to our AI voice agent from your browser.
          </p>
        </div>

        <div className="glass-card-dark p-8 sm:p-10">
          {/* Microphone Visual */}
          <div className="flex flex-col items-center gap-6">
            {/* Mic Icon with rings */}
            <div className="relative">
              {(callState === 'active' || callState === 'speaking') && (
                <>
                  <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                    callState === 'speaking' ? 'bg-primary' : 'bg-[hsl(var(--green-accent))]'
                  }`} style={{ animationDuration: '1.5s' }} />
                  <div className={`absolute -inset-3 rounded-full opacity-10 ${
                    callState === 'speaking' ? 'bg-primary' : 'bg-[hsl(var(--green-accent))]'
                  }`} style={{ animation: 'pulseBadge 2s ease-in-out infinite' }} />
                </>
              )}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300 ${
                callState === 'idle' || callState === 'ended' || callState === 'error'
                  ? 'bg-primary/20'
                  : callState === 'connecting'
                  ? 'bg-primary/30'
                  : callState === 'speaking'
                  ? 'bg-primary/40'
                  : 'bg-[hsl(var(--green-accent))]/30'
              }`}>
                {callState === 'connecting' ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <Mic className={`w-8 h-8 ${
                    callState === 'active' ? 'text-[hsl(var(--green-accent))]' : 'text-primary'
                  }`} />
                )}
              </div>
            </div>

            {/* Waveform - visible when active */}
            {(callState === 'active' || callState === 'speaking') && (
              <div className="flex items-end gap-[2px] h-8 w-full max-w-xs">
                {waveBars.map((bar, i) => (
                  <div
                    key={i}
                    className={`w-full rounded-full transition-all ${
                      callState === 'speaking' ? 'bg-primary/60 animate-waveform' : 'bg-[hsl(var(--green-accent))]/40 animate-waveform'
                    }`}
                    style={{
                      '--wave-height': `${bar.height}px`,
                      '--wave-delay': `${bar.delay}s`,
                      '--wave-duration': `${bar.duration}s`,
                      animationDelay: `${bar.delay}s`,
                      animationDuration: `${bar.duration}s`,
                    } as React.CSSProperties}
                  />
                ))}
              </div>
            )}

            {/* Status Text */}
            <p className="text-sm font-medium text-white/70">
              {callState === 'idle' && 'Click below to start a live conversation'}
              {callState === 'connecting' && 'Connecting to AI Agent...'}
              {callState === 'active' && 'AI Agent is listening...'}
              {callState === 'speaking' && 'AI Agent is responding...'}
              {callState === 'ended' && 'Call ended. Want this for your business?'}
              {callState === 'error' && errorMsg}
            </p>

            {/* Duration */}
            {(callState === 'active' || callState === 'speaking') && (
              <span className="font-mono text-xs text-white/50">{formatTime(duration)}</span>
            )}

            {/* Action Button */}
            <div className="flex gap-3">
              {callState === 'idle' && (
                <button onClick={startCall} className="btn-primary-glow flex items-center gap-2 text-base px-8 py-4">
                  <Mic className="w-5 h-5" />
                  Talk to AI Agent — Try Free Demo
                </button>
              )}
              {callState === 'connecting' && (
                <button disabled className="btn-primary-glow flex items-center gap-2 text-base px-8 py-4 opacity-70 cursor-wait">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </button>
              )}
              {(callState === 'active' || callState === 'speaking') && (
                <button onClick={endCall} className="bg-destructive text-destructive-foreground font-semibold rounded-xl px-8 py-4 flex items-center gap-2 transition-all hover:scale-105">
                  <PhoneOff className="w-5 h-5" />
                  End Call
                </button>
              )}
              {callState === 'ended' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={startCall} className="btn-primary-glow flex items-center gap-2 px-6 py-3">
                    <Phone className="w-4 h-4" />
                    Try Again
                  </button>
                  <a href="#pricing" className="btn-accent-glow flex items-center gap-2 px-6 py-3">
                    Start Free Trial
                  </a>
                </div>
              )}
              {callState === 'error' && (
                <button onClick={() => { setCallState('idle'); setErrorMsg(''); }} className="btn-primary-glow flex items-center gap-2 px-6 py-3">
                  Try Again
                </button>
              )}
            </div>
          </div>

          {/* Live Transcript */}
          {transcript.length > 0 && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">Live Transcript</h4>
              <div className="max-h-48 overflow-y-auto space-y-3 scrollbar-thin">
                {transcript.map((line, i) => (
                  <div key={i} className={`flex gap-3 ${line.role === 'user' ? '' : 'flex-row-reverse'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm animate-chat-in ${
                      line.role === 'user'
                        ? 'bg-white/10 text-white/90'
                        : 'bg-primary/20 text-[hsl(var(--blue-light))]'
                    }`}>
                      <span className="text-xs font-medium opacity-60 block mb-1">
                        {line.role === 'user' ? 'You' : 'AI Agent'}
                      </span>
                      {line.text}
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
