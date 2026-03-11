import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Store, 
  Calendar, 
  ShoppingCart, 
  Bell, 
  MessageSquare, 
  Gift, 
  Users, 
  Play,
  Clock,
  CheckCircle 
} from 'lucide-react';

interface Customer {
  name: string;
  phone: string;
  email?: string;
  preferences?: any;
}

interface AutomationCampaign {
  type: string;
  title: string;
  customers: Customer[];
  data: any;
  scheduledFor?: string;
}

const AUTOMATION_TYPES = [
  {
    id: 'appointment_scheduling',
    title: 'Appointment Scheduling',
    description: 'Call customers to schedule appointments',
    icon: Calendar
  },
  {
    id: 'order_confirmation',
    title: 'Order Confirmation',
    description: 'Confirm orders and provide delivery updates',
    icon: ShoppingCart
  },
  {
    id: 'inventory_alert',
    title: 'Inventory Alerts',
    description: 'Notify customers when items are back in stock',
    icon: Bell
  },
  {
    id: 'feedback_collection',
    title: 'Feedback Collection',
    description: 'Gather customer feedback after purchases',
    icon: MessageSquare
  },
  {
    id: 'promotional_campaign',
    title: 'Promotional Campaigns',
    description: 'Share special offers and discounts',
    icon: Gift
  }
];

export const RetailAutomationPanel: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [retailerCustomers, setRetailerCustomers] = useState<any[]>([]);
  const [campaignData, setCampaignData] = useState<any>({});
  const [isLaunching, setIsLaunching] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');

  useEffect(() => {
    loadRetailerCustomers();
  }, []);

  const loadRetailerCustomers = async () => {
    try {
      // Get current user's retailer profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: retailerProfile } = await supabase
        .from('retailer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (retailerProfile) {
        const { data: customers } = await supabase
          .from('retailer_customers')
          .select('*')
          .eq('retailer_id', retailerProfile.id);

        setRetailerCustomers(customers || []);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const addCustomer = () => {
    setCustomers([...customers, { name: '', phone: '', email: '' }]);
  };

  const updateCustomer = (index: number, field: keyof Customer, value: string) => {
    const updated = [...customers];
    updated[index] = { ...updated[index], [field]: value };
    setCustomers(updated);
  };

  const removeCustomer = (index: number) => {
    setCustomers(customers.filter((_, i) => i !== index));
  };

  const loadFromRetailerCustomers = () => {
    const formattedCustomers = retailerCustomers.map(customer => ({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || ''
    }));
    setCustomers(formattedCustomers);
    toast({
      title: "Customers Loaded",
      description: `Loaded ${formattedCustomers.length} customers from your database`
    });
  };

  const launchAutomation = async () => {
    if (!selectedType || customers.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select automation type and add customers",
        variant: "destructive"
      });
      return;
    }

    setIsLaunching(true);
    
    try {
      // Get retailer ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: retailerProfile } = await supabase
        .from('retailer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!retailerProfile) throw new Error('Retailer profile not found');

      const response = await supabase.functions.invoke('retail-automation-hub', {
        body: {
          type: selectedType,
          retailerId: retailerProfile.id,
          customers: customers,
          data: campaignData,
          scheduledFor: campaignData.scheduledFor || null
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Campaign Launched! 🚀",
        description: `${response.data.campaignType} campaign started for ${response.data.totalCustomers} customers`
      });

      setActiveTab('results');
      
    } catch (error) {
      console.error('Campaign launch failed:', error);
      toast({
        title: "Campaign Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLaunching(false);
    }
  };

  const renderCampaignSetup = () => {
    const selectedAutomation = AUTOMATION_TYPES.find(type => type.id === selectedType);
    
    return (
      <div className="space-y-6">
        {/* Automation Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Select Automation Type
            </CardTitle>
            <CardDescription>
              Choose the type of automation campaign to launch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AUTOMATION_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Card 
                    key={type.id}
                    className={`cursor-pointer transition-colors ${
                      selectedType === type.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 mt-1 text-primary" />
                        <div>
                          <div className="font-medium">{type.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {type.description}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Configuration */}
        {selectedType && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Configuration</CardTitle>
              <CardDescription>
                Configure details for your {selectedAutomation?.title.toLowerCase()} campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedType === 'appointment_scheduling' && (
                <>
                  <div>
                    <Label htmlFor="serviceType">Service Type</Label>
                    <Input
                      id="serviceType"
                      placeholder="e.g., Consultation, Fitting, Repair"
                      value={campaignData.serviceType || ''}
                      onChange={(e) => setCampaignData({ ...campaignData, serviceType: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="availableSlots">Available Time Slots</Label>
                    <Textarea
                      id="availableSlots"
                      placeholder="e.g., Monday 9-12, Wednesday 2-5, Friday 10-3"
                      value={campaignData.availableSlots || ''}
                      onChange={(e) => setCampaignData({ ...campaignData, availableSlots: e.target.value })}
                    />
                  </div>
                </>
              )}

              {selectedType === 'order_confirmation' && (
                <>
                  <div>
                    <Label htmlFor="orderNumber">Order Number Prefix</Label>
                    <Input
                      id="orderNumber"
                      placeholder="e.g., ORD-2024-"
                      value={campaignData.orderPrefix || ''}
                      onChange={(e) => setCampaignData({ ...campaignData, orderPrefix: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryMethod">Delivery Method</Label>
                    <Select onValueChange={(value) => setCampaignData({ ...campaignData, deliveryMethod: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pickup">Store Pickup</SelectItem>
                        <SelectItem value="delivery">Home Delivery</SelectItem>
                        <SelectItem value="shipping">Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {selectedType === 'promotional_campaign' && (
                <>
                  <div>
                    <Label htmlFor="promotionTitle">Promotion Title</Label>
                    <Input
                      id="promotionTitle"
                      placeholder="e.g., Weekend Sale, Holiday Special"
                      value={campaignData.promotionTitle || ''}
                      onChange={(e) => setCampaignData({ ...campaignData, promotionTitle: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount">Discount Offer</Label>
                    <Input
                      id="discount"
                      placeholder="e.g., 20% off, Buy 2 Get 1 Free"
                      value={campaignData.discount || ''}
                      onChange={(e) => setCampaignData({ ...campaignData, discount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="promoCode">Promo Code (optional)</Label>
                    <Input
                      id="promoCode"
                      placeholder="e.g., SAVE20, WEEKEND"
                      value={campaignData.promoCode || ''}
                      onChange={(e) => setCampaignData({ ...campaignData, promoCode: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="scheduledFor">Schedule For Later (optional)</Label>
                <Input
                  id="scheduledFor"
                  type="datetime-local"
                  value={campaignData.scheduledFor || ''}
                  onChange={(e) => setCampaignData({ ...campaignData, scheduledFor: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Customer List ({customers.length})
                </CardTitle>
                <CardDescription>
                  Add customers to include in this campaign
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {retailerCustomers.length > 0 && (
                  <Button variant="outline" onClick={loadFromRetailerCustomers}>
                    Load All Customers
                  </Button>
                )}
                <Button onClick={addCustomer}>Add Customer</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No customers added yet. Click "Add Customer" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {customers.map((customer, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`name-${index}`}>Name</Label>
                        <Input
                          id={`name-${index}`}
                          placeholder="Customer name"
                          value={customer.name}
                          onChange={(e) => updateCustomer(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`phone-${index}`}>Phone</Label>
                        <Input
                          id={`phone-${index}`}
                          placeholder="Phone number"
                          value={customer.phone}
                          onChange={(e) => updateCustomer(index, 'phone', e.target.value)}
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label htmlFor={`email-${index}`}>Email (optional)</Label>
                          <Input
                            id={`email-${index}`}
                            placeholder="Email address"
                            type="email"
                            value={customer.email}
                            onChange={(e) => updateCustomer(index, 'email', e.target.value)}
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => removeCustomer(index)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-6 h-6" />
          Retail Automation Hub
        </CardTitle>
        <CardDescription>
          Launch intelligent voice campaigns for your retail business
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setup">Campaign Setup</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="mt-6">
            {renderCampaignSetup()}
            
            {selectedType && customers.length > 0 && (
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={launchAutomation} 
                  disabled={isLaunching}
                  className="min-w-[200px]"
                >
                  {isLaunching ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Launch Campaign
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Campaign Results
                </CardTitle>
                <CardDescription>
                  Monitor your automation campaign performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Launch a campaign to see results here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};