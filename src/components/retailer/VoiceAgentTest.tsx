import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mic, Send, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VoiceAgentTestProps {
  retailerId: string;
}

export function VoiceAgentTest({ retailerId }: VoiceAgentTestProps) {
  const [testMessage, setTestMessage] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [response, setResponse] = useState<{ reply?: string; action?: string; action_result?: unknown } | null>(null);
  const [loading, setLoading] = useState(false);

  const testVoiceAgent = async () => {
    if (!testMessage.trim()) {
      toast.error("Please enter a test message");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('retailer-voice-agent', {
        body: {
          message: testMessage,
          retailer_id: retailerId,
          customer_phone: customerPhone || "+1234567890",
          customer_name: customerName || "Test Customer",
          call_session_id: null
        }
      });

      if (error) throw error;

      setResponse(data);
      toast.success("Voice agent responded successfully!");
    } catch (error) {
      console.error('Voice agent test error:', error);
      toast.error('Failed to test voice agent');
    } finally {
      setLoading(false);
    }
  };

  const exampleMessages = [
    "I'd like to make a payment of $50 for my order",
    "Can I schedule a pickup appointment for tomorrow at 2 PM?",
    "Could you send me your menu?",
    "What are your operating hours?",
    "I want to book a consultation for next week"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Test Your Voice Agent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Customer Phone (Optional)</label>
            <Input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Customer Name (Optional)</label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Test Customer"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Test Message</label>
          <Textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter what a customer might say..."
            rows={3}
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleMessages.map((msg, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setTestMessage(msg)}
                className="text-xs"
              >
                {msg.substring(0, 30)}...
              </Button>
            ))}
          </div>
        </div>

        <Button 
          onClick={testVoiceAgent}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Testing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Test Voice Agent
            </>
          )}
        </Button>

        {response && (
          <div className="space-y-4 mt-6">
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Voice Agent Response:</h4>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">{response.reply}</p>
              </div>
            </div>

            {response.action && response.action !== 'none' && (
              <div>
                <h4 className="font-medium mb-2">Action Detected:</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="capitalize">
                    {response.action}
                  </Badge>
                  {response.action_result && (
                    <span className="text-sm text-muted-foreground">
                      Action completed successfully
                    </span>
                  )}
                </div>
              </div>
            )}

            {response.action_result && (
              <div>
                <h4 className="font-medium mb-2">Action Result:</h4>
                <div className="bg-muted p-3 rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(response.action_result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}