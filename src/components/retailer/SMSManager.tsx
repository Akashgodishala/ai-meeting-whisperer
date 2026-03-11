import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, History, Users, Phone, Calendar } from "lucide-react";
import { RetailerSMSService } from "@/services/retailerSMSService";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SMSManagerProps {
  retailerId: string;
}

const SMSManager: React.FC<SMSManagerProps> = ({ retailerId }) => {
  const [smsService] = useState(() => new RetailerSMSService(retailerId));
  const [customMessage, setCustomMessage] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [promotionalMessage, setPromotionalMessage] = useState('');
  const [customers, setCustomers] = useState<Array<{id: string, phone: string, name: string}>>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [smsHistory, setSmsHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadSMSHistory();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('retailer_customers')
        .select('id, name, phone')
        .eq('retailer_id', retailerId);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadSMSHistory = async () => {
    const history = await smsService.getSMSHistory(20);
    setSmsHistory(history);
  };

  const handleSendCustomSMS = async () => {
    if (!customerPhone || !customMessage) {
      toast({
        title: "Missing Information",
        description: "Please enter both phone number and message",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    await smsService.sendCustomSMS({
      to: customerPhone,
      message: customMessage,
      customerName: customerName || 'Customer'
    });
    
    setCustomMessage('');
    setCustomerPhone('');
    setCustomerName('');
    loadSMSHistory();
    setIsLoading(false);
  };

  const handleSendPromotional = async () => {
    if (!promotionalMessage || selectedCustomers.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select customers and enter a message",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const selectedCustomerData = customers.filter(c => selectedCustomers.includes(c.id));
    await smsService.sendPromotionalSMS(selectedCustomerData, promotionalMessage);
    
    setPromotionalMessage('');
    setSelectedCustomers([]);
    loadSMSHistory();
    setIsLoading(false);
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const selectAllCustomers = () => {
    setSelectedCustomers(customers.map(c => c.id));
  };

  const clearSelection = () => {
    setSelectedCustomers([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Manager
          </CardTitle>
          <CardDescription>
            Send SMS messages to customers and manage communication
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="individual">Individual SMS</TabsTrigger>
          <TabsTrigger value="promotional">Promotional</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Send Individual SMS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerPhone">Customer Phone</Label>
                  <Input
                    id="customerPhone"
                    placeholder="+1234567890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="customerName">Customer Name (Optional)</Label>
                  <Input
                    id="customerName"
                    placeholder="John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="customMessage">Message</Label>
                <Textarea
                  id="customMessage"
                  placeholder="Enter your message..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleSendCustomSMS} 
                disabled={isLoading}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Send SMS
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Promotional SMS Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Select Customers ({selectedCustomers.length} selected)</Label>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={selectAllCustomers}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                  {customers.map(customer => (
                    <div key={customer.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => toggleCustomerSelection(customer.id)}
                        className="rounded"
                      />
                      <span className="flex-1">{customer.name}</span>
                      <span className="text-sm text-muted-foreground">{customer.phone}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="promotionalMessage">Promotional Message</Label>
                <Textarea
                  id="promotionalMessage"
                  placeholder="Enter your promotional message... Use {name} to personalize"
                  value={promotionalMessage}
                  onChange={(e) => setPromotionalMessage(e.target.value)}
                  rows={4}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Use {"{name}"} in your message to personalize it for each customer
                </p>
              </div>

              <Button 
                onClick={handleSendPromotional} 
                disabled={isLoading || selectedCustomers.length === 0}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Campaign ({selectedCustomers.length} recipients)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                SMS History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {smsHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No SMS history found
                  </p>
                ) : (
                  smsHistory.map((sms, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={sms.status === 'sent' ? 'default' : 'destructive'}>
                            {sms.status}
                          </Badge>
                          <span className="font-medium">{sms.phone_number}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(sms.sent_at).toLocaleString()}
                        </div>
                      </div>
                      <p className="text-sm">{sms.message}</p>
                      {sms.error_message && (
                        <p className="text-sm text-red-500 mt-1">Error: {sms.error_message}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SMSManager;