import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceDemoProps {
  onSpeakingChange?: (speaking: boolean) => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
    SpeechRecognition: new () => SpeechRecognition;
  }
}

const VoiceDemo: React.FC<VoiceDemoProps> = ({ onSpeakingChange }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();

  // Check for browser support
  const isWebSpeechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  const startListening = async () => {
    if (!isWebSpeechSupported) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support voice recognition. Please try Chrome or Edge.",
        variant: "destructive"
      });
      return;
    }

    try {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setResponse('');
        onSpeakingChange?.(false);
      };
      
      recognition.onresult = async (event: SpeechRecognitionEvent) => {
        const speechResult = event.results[0][0].transcript;
        setTranscript(speechResult);
        setIsProcessing(true);
        
        try {
          // Process with AI (mock response for now)
          await new Promise(resolve => setTimeout(resolve, 1000));
          const aiResponse = `Thank you for saying: "${speechResult}". This is a demo of our AI voice technology. In a real implementation, this would connect to OpenAI and ElevenLabs for natural conversation.`;
          
          setResponse(aiResponse);
          
          // Speak the response using browser TTS
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(aiResponse);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            
            utterance.onstart = () => {
              setIsSpeaking(true);
              onSpeakingChange?.(true);
            };
            
            utterance.onend = () => {
              setIsSpeaking(false);
              onSpeakingChange?.(false);
            };
            
            speechSynthesis.speak(utterance);
          }
          
        } catch (error) {
          toast({
            title: "Processing Error",
            description: "Failed to process your voice input. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsProcessing(false);
        }
      };
      
      recognition.onerror = () => {
        setIsListening(false);
        setIsProcessing(false);
        toast({
          title: "Recognition Error",
          description: "Failed to recognize speech. Please try again.",
          variant: "destructive"
        });
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start voice recognition. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    setIsListening(false);
    setIsProcessing(false);
    setIsSpeaking(false);
    onSpeakingChange?.(false);
  };

  return (
    <Card className="p-6 glass-effect glow-effect">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold gradient-text">Try Our Voice AI</h3>
          <p className="text-muted-foreground">
            Click the microphone button and speak to experience our AI voice technology
          </p>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <Button
            onClick={isListening || isProcessing ? stopListening : startListening}
            size="lg"
            className={`w-20 h-20 rounded-full transition-all duration-300 ${
              isListening ? 'pulse-glow bg-red-500 hover:bg-red-600' : 
              isProcessing ? 'animate-pulse bg-yellow-500 hover:bg-yellow-600' :
              'glow-effect'
            }`}
            disabled={!isWebSpeechSupported}
          >
            {isListening ? (
              <MicOff className="w-8 h-8" />
            ) : isProcessing ? (
              <div className="w-8 h-8 animate-spin border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>

          <div className="text-sm text-muted-foreground">
            {isListening ? (
              <span className="text-red-400">🔴 Listening...</span>
            ) : isProcessing ? (
              <span className="text-yellow-400">⚡ Processing...</span>
            ) : isSpeaking ? (
              <span className="text-green-400 flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                AI Speaking...
              </span>
            ) : (
              <span>Click to start speaking</span>
            )}
          </div>
        </div>

        {transcript && (
          <div className="space-y-2">
            <h4 className="font-medium text-blue-400">You said:</h4>
            <p className="text-sm bg-muted/50 p-3 rounded-lg">{transcript}</p>
          </div>
        )}

        {response && (
          <div className="space-y-2">
            <h4 className="font-medium text-green-400">AI Response:</h4>
            <p className="text-sm bg-muted/50 p-3 rounded-lg">{response}</p>
          </div>
        )}

        {!isWebSpeechSupported && (
          <div className="text-destructive text-sm">
            Voice recognition not supported in this browser. Please use Chrome or Edge.
          </div>
        )}
      </div>
    </Card>
  );
};

export default VoiceDemo;