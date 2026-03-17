import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Calendar, Link, Phone, Clock, CreditCard, Plus, Users, Package, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import { VoiceAgentTest } from "./VoiceAgentTest";
import { CredentialsManager } from "@/components/credentials/CredentialsManager";
import { RetailerVAPISetup } from "./RetailerVAPISetup";
import SMSManager from "./SMSManager";

interface RetailerProfile {
  id: string;
  business_name: string;
  business_type: string;
  phone: string;
  address: string;
  payment_methods: Record<string, unknown>;
  operating_hours: Record<string, unknown>;
}

interface VoiceTransaction {
  id: string;
  customer_phone: string;
  customer_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
}

interface VoiceAppointment {
  id: string;
  customer_phone: string;
  customer_name: string;
  appointment_date: string;
  appointment_type: string;
  status: string;
  notes: string;
  created_at: string;
}

interface VoiceLink {
  id: string;
  customer_phone: string;
  link_url: string;
  link_type: string;
  title: string;
  description: string;
  sent_at: string;
}

interface RetailerOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  items: Array<{ name: string; quantity?: number }>;
  order_type: string;
  status: string;
  call_session_id?: string;
  estimated_time?: string;
  notes?: string;
  payment_link_url?: string;
  payment_status?: string;
  created_at: string;
}

interface RetailerCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  created_at: string;
}

interface InventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  category?: string;
  size?: string;
  available?: boolean;
}

export function RetailerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<RetailerProfile | null>(null);
  const [transactions, setTransactions] = useState<VoiceTransaction[]>([]);
  const [appointments, setAppointments] = useState<VoiceAppointment[]>([]);
  const [links, setLinks] = useState<VoiceLink[]>([]);
  const [customers, setCustomers] = useState<RetailerCustomer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<RetailerOrder[]>([]);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Customer form states
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");

  // Inventory form states
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemStock, setNewItemStock] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemSize, setNewItemSize] = useState("");

  useEffect(() => {
    if (user) {
      loadRetailerProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      loadDashboardData();
      loadCustomers();
    }
  }, [profile]);

  const loadRetailerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('retailer_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
      } else {
        setIsSetupMode(true);
      }
    } catch (error) {
      console.error('Error loading retailer profile:', error);
      toast.error('Failed to load retailer profile');
    }
  };

  const loadDashboardData = async () => {
    if (!profile?.id) return;

    try {
      // Load transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('voice_transactions')
        .select('*')
        .eq('retailer_id', profile.id)
        .order('created_at', { ascending: false });

      if (transactionError) throw transactionError;
      setTransactions(transactionData || []);

      // Load appointments
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('voice_appointments')
        .select('*')
        .eq('retailer_id', profile.id)
        .order('created_at', { ascending: false });

      if (appointmentError) throw appointmentError;
      setAppointments(appointmentData || []);

      // Load links
      const { data: linkData, error: linkError } = await supabase
        .from('voice_links')
        .select('*')
        .eq('retailer_id', profile.id)
        .order('created_at', { ascending: false });

      if (linkError) throw linkError;
      setLinks(linkData || []);

      // Load orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('retailer_orders')
        .select('*')
        .eq('retailer_id', profile.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Load inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('retailer_inventory')
        .select('*')
        .eq('retailer_id', profile.id)
        .order('name', { ascending: true });

      if (inventoryError) throw inventoryError;
      setInventory(inventoryData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const setupRetailerProfile = async () => {
    if (!user) return;

    try {
      const profileData = {
        user_id: user.id,
        business_name: businessName,
        business_type: businessType,
        phone: phone,
        address: address,
        payment_methods: ['credit_card', 'debit_card', 'digital_wallet'],
        operating_hours: {
          monday: '9:00 AM - 9:00 PM',
          tuesday: '9:00 AM - 9:00 PM',
          wednesday: '9:00 AM - 9:00 PM',
          thursday: '9:00 AM - 9:00 PM',
          friday: '9:00 AM - 10:00 PM',
          saturday: '9:00 AM - 10:00 PM',
          sunday: '10:00 AM - 8:00 PM'
        }
      };

      const { data, error } = await supabase
        .from('retailer_profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) throw error;

      // Add retailer role
      await supabase
        .from('user_roles')
        .insert([{ user_id: user.id, role: 'retailer' }]);

      setProfile(data);
      setIsSetupMode(false);
      toast.success('Retailer profile created successfully!');
    } catch (error) {
      console.error('Error creating retailer profile:', error);
      toast.error('Failed to create retailer profile');
    }
  };

  const loadCustomers = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('retailer_customers')
        .select('*')
        .eq('retailer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadInventory = async () => {
    // Already loaded in loadDashboardData
  };

  const addCustomer = async () => {
    if (!profile?.id || !newCustomerName || !newCustomerPhone) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from('retailer_customers')
        .insert({
          retailer_id: profile.id,
          name: newCustomerName,
          phone: newCustomerPhone,
          email: newCustomerEmail || null
        });

      if (error) throw error;

      toast.success('Customer added successfully');
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      setShowAddCustomer(false);
      loadCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer');
    }
  };

  const addInventoryItem = async () => {
    if (!profile?.id || !newItemName || !newItemPrice) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from('retailer_inventory')
        .insert({
          retailer_id: profile.id,
          name: newItemName,
          price: parseFloat(newItemPrice),
          stock: parseInt(newItemStock) || 0,
          description: newItemDescription || null,
          category: newItemCategory || null,
          size: newItemSize || null,
          available: true
        });

      if (error) throw error;

      toast.success('Product added successfully');
      setNewItemName('');
      setNewItemPrice('');
      setNewItemStock('');
      setNewItemDescription('');
      setNewItemCategory('');
      setNewItemSize('');
      setShowAddInventory(false);
      loadDashboardData();
    } catch (error) {
      console.error('Error adding inventory:', error);
      toast.error('Failed to add product');
    }
  };

  const sendManualPaymentLink = async (order: RetailerOrder) => {
    try {
      toast.success('🚀 Creating payment link...');
      
      const { data, error } = await supabase.functions.invoke('stripe-payment-processor', {
        body: {
          order_id: order.id,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          total_amount: order.total_amount,
          items: order.items,
          order_type: order.order_type
        }
      });

      if (error) throw error;

      if (data?.payment_link) {
        toast.success('💳 Payment link created! Sending SMS...');
        
        // Send SMS with payment link (credentials managed server-side)
        const smsResponse = await supabase.functions.invoke('send-sms', {
          body: {
            to: order.customer_phone,
            message: `Hi ${order.customer_name}! Your order is ready. Please complete payment here: ${data.payment_link}`,
            customerName: order.customer_name
          }
        });

        if (smsResponse.error) {
          toast.error('Payment link created but SMS failed to send');
        } else {
          toast.success('📱 Payment link sent via SMS!');
        }
        
        // Refresh orders
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error sending manual payment link:', error);
      toast.error('Failed to create payment link');
    }
  };

  if (isSetupMode) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Set Up Your Retail Business</CardTitle>
            <CardDescription>
              Configure your business profile to start using the voice agent system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Business Name</label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter your business name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Business Type</label>
              <Select value={businessType} onValueChange={setBusinessType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="liquor_store">Liquor Store</SelectItem>
                  <SelectItem value="wine_shop">Wine Shop</SelectItem>
                  <SelectItem value="brewery">Brewery</SelectItem>
                  <SelectItem value="distillery">Distillery</SelectItem>
                  <SelectItem value="bar_lounge">Bar & Lounge</SelectItem>
                  <SelectItem value="grocery_store">Grocery Store</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="other">Other Retail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter business phone number"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter business address"
              />
            </div>
            <Button 
              onClick={setupRetailerProfile}
              disabled={!businessName || !businessType || !phone || !address}
              className="w-full"
            >
              Create Retailer Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading retailer dashboard...</p>
        </div>
      </div>
    );
  }

  const totalRevenue = transactions
    .filter(t => t.payment_status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingPayments = transactions.filter(t => t.payment_status === 'pending').length;
  const upcomingAppointments = appointments.filter(a => a.status === 'scheduled').length;
  const totalLinksSent = links.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{profile.business_name}</h1>
          <p className="text-muted-foreground capitalize">
            {profile.business_type.replace('_', ' ')} • Voice Agent Dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            <Phone className="w-4 h-4 mr-1" />
            +16095088574
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From voice payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">Scheduled via voice</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Links Sent</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLinksSent}</div>
            <p className="text-xs text-muted-foreground">Total shared</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="vapi-setup" className="w-full">
        <TabsList className="flex flex-wrap w-full gap-1 h-auto p-1">
          <TabsTrigger value="vapi-setup" className="flex items-center gap-1 text-xs flex-shrink-0">
            <Zap className="h-3 w-3" />
            VAPI
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-xs flex-shrink-0">Orders</TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs flex-shrink-0">Inventory</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs flex-shrink-0">Payments</TabsTrigger>
          <TabsTrigger value="appointments" className="text-xs flex-shrink-0">Meetings</TabsTrigger>
          <TabsTrigger value="customers" className="text-xs flex-shrink-0">Customers</TabsTrigger>
          <TabsTrigger value="links" className="text-xs flex-shrink-0">Links</TabsTrigger>
          <TabsTrigger value="sms" className="text-xs flex-shrink-0">SMS</TabsTrigger>
          <TabsTrigger value="test" className="text-xs flex-shrink-0">Test</TabsTrigger>
          <TabsTrigger value="live-calls" className="text-xs flex-shrink-0">📞 Live</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs flex-shrink-0">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="vapi-setup">
          <RetailerVAPISetup />
        </TabsContent>

              <TabsContent value="orders" className="space-y-4">
                {/* Order Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{orders.length}</div>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Pickup Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{orders.filter(o => o.order_type === 'pickup').length}</div>
                      <p className="text-xs text-muted-foreground">Ready for collection</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Delivery Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{orders.filter(o => o.order_type === 'delivery').length}</div>
                      <p className="text-xs text-muted-foreground">For delivery</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Categories */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pickup Orders */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Pickup Orders
                      </CardTitle>
                      <CardDescription>
                        Orders ready for customer pickup
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {orders.filter(order => order.order_type === 'pickup').length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            No pickup orders yet
                          </p>
                        ) : (
                          orders.filter(order => order.order_type === 'pickup').map((order) => (
                            <div key={order.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold">{order.customer_name}</h4>
                                  <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                                  {order.call_session_id && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      📞 VAPI Order
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                    {order.status}
                                  </Badge>
                                  <Badge variant="outline" className="text-green-600">
                                    <Clock className="h-3 w-3 mr-1" />
                                    10-30 min
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-sm space-y-1">
                                <p><strong>Total:</strong> ${order.total_amount}</p>
                                <p><strong>Items:</strong> {Array.isArray(order.items) 
                                  ? order.items.map(item => `${item.name} (${item.quantity || 1})`).join(', ') 
                                  : 'Order details'}</p>
                                <p><strong>Status:</strong> {order.status}</p>
                                {order.estimated_time && (
                                  <p><strong>Pickup Time:</strong> {order.estimated_time}</p>
                                )}
                                {order.notes && <p><strong>Notes:</strong> {order.notes}</p>}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Ordered: {new Date(order.created_at).toLocaleString()}
                              </p>
                               <div className="flex gap-2 mt-2">
                                 {order.payment_link_url && order.payment_status === 'pending' && (
                                   <Button 
                                     size="sm" 
                                     onClick={() => window.open(order.payment_link_url, '_blank')}
                                   >
                                     View Payment Link
                                   </Button>
                                 )}
                                 {!order.payment_link_url && order.payment_status === 'pending' && (
                                   <Button 
                                     size="sm" 
                                     variant="outline"
                                     onClick={() => sendManualPaymentLink(order)}
                                   >
                                     📱 Send Payment Link
                                   </Button>
                                 )}
                               </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Orders */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Delivery Orders
                      </CardTitle>
                      <CardDescription>
                        Orders scheduled for delivery (10-30 minutes)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {orders.filter(order => order.order_type === 'delivery').length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            No delivery orders yet
                          </p>
                        ) : (
                          orders.filter(order => order.order_type === 'delivery').map((order) => (
                            <div key={order.id} className="border rounded-lg p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold">{order.customer_name}</h4>
                                  <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                    {order.status}
                                  </Badge>
                                  <Badge variant="outline" className="text-orange-600">
                                    <Clock className="h-3 w-3 mr-1" />
                                    10-30 min
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-sm space-y-1">
                                <p><strong>Total:</strong> ${order.total_amount}</p>
                                <p><strong>Service Fee:</strong> ${order.service_fee || 0}</p>
                                <p><strong>Driver Tip:</strong> ${order.driver_tip || 0}</p>
                                <p><strong>Items:</strong> {Array.isArray(order.items) 
                                  ? order.items.map(item => `${item.name} (${item.quantity || 1})`).join(', ') 
                                  : 'Order details'}</p>
                                <p><strong>Status:</strong> {order.status}</p>
                                {order.delivery_address && <p><strong>Address:</strong> {order.delivery_address}</p>}
                                {order.estimated_time && (
                                  <p><strong>Delivery Time:</strong> {order.estimated_time}</p>
                                )}
                                {order.notes && <p><strong>Notes:</strong> {order.notes}</p>}
                              </div>
                              
                              {/* Delivery Time Estimate */}
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-orange-800">
                                  <Clock className="h-4 w-4" />
                                  <span className="font-medium">Delivery Window</span>
                                </div>
                                <p className="text-sm text-orange-700 mt-1">
                                  Estimated delivery: 10-30 minutes from order confirmation
                                </p>
                                <p className="text-xs text-orange-600">
                                  Order placed: {new Date(order.created_at).toLocaleString()}
                                </p>
                              </div>
                              
                               <div className="flex gap-2 mt-2">
                                 {order.payment_link_url && order.payment_status === 'pending' && (
                                   <Button 
                                     size="sm" 
                                     onClick={() => window.open(order.payment_link_url, '_blank')}
                                   >
                                     View Payment Link
                                   </Button>
                                 )}
                                 {!order.payment_link_url && order.payment_status === 'pending' && (
                                   <Button 
                                     size="sm" 
                                     variant="outline"
                                     onClick={() => sendManualPaymentLink(order)}
                                   >
                                     📱 Send Payment Link
                                   </Button>
                                 )}
                                 {order.payment_status === 'completed' && (
                                   <Button 
                                     size="sm" 
                                     variant="default"
                                     className="bg-green-600 hover:bg-green-700"
                                   >
                                     ✅ Payment Complete
                                   </Button>
                                 )}
                               </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="inventory" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Management</CardTitle>
                    <CardDescription>
                      Manage your products for voice agent orders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Add Inventory Form */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                         <div className="space-y-2">
                           <label className="text-sm font-medium">Product Name *</label>
                           <Input
                             placeholder="e.g., Hennessy Cognac"
                             value={newItemName}
                             onChange={(e) => setNewItemName(e.target.value)}
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-sm font-medium">Size</label>
                           <Input
                             placeholder="e.g., 750ml"
                             value={newItemSize}
                             onChange={(e) => setNewItemSize(e.target.value)}
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-sm font-medium">Category</label>
                           <Input
                             placeholder="e.g., Spirits"
                             value={newItemCategory}
                             onChange={(e) => setNewItemCategory(e.target.value)}
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-sm font-medium">Price *</label>
                           <Input
                             type="number"
                             step="0.01"
                             placeholder="0.00"
                             value={newItemPrice}
                             onChange={(e) => setNewItemPrice(e.target.value)}
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-sm font-medium">Stock</label>
                           <Input
                             type="number"
                             placeholder="0"
                             value={newItemStock}
                             onChange={(e) => setNewItemStock(e.target.value)}
                           />
                         </div>
                        <div className="flex items-end">
                          <Button onClick={addInventoryItem} className="w-full">
                            Add Item
                          </Button>
                        </div>
                      </div>

                      {/* Inventory List */}
                      {inventory.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No inventory items yet. Add products above for customers to order.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {inventory.map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                              <div>
                                <h4 className="font-medium">{item.name} {item.size && `(${item.size})`}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {item.category && `${item.category} • `}
                                  Stock: {item.stock} • ${item.available ? 'Available' : 'Unavailable'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">${item.price}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice Payment Transactions</CardTitle>
              <CardDescription>
                Payments processed through your voice agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No transactions yet. Your voice agent will show payments here.
                </p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{transaction.customer_name || 'Unknown Customer'}</p>
                        <p className="text-sm text-muted-foreground">{transaction.customer_phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${transaction.amount.toFixed(2)}</p>
                        <Badge variant={transaction.payment_status === 'completed' ? 'default' : 'secondary'}>
                          {transaction.payment_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Customer Management</CardTitle>
                <CardDescription>
                  Manage your customer database for voice agent interactions
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddCustomer(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </CardHeader>
            <CardContent>
              {showAddCustomer && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-4">Add New Customer</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      placeholder="Customer Name"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                    />
                    <Input
                      placeholder="Phone Number"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                    />
                    <Input
                      placeholder="Email (Optional)"
                      value={newCustomerEmail}
                      onChange={(e) => setNewCustomerEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={addCustomer} disabled={!newCustomerName || !newCustomerPhone}>
                      Add Customer
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddCustomer(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {customers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No customers yet. Add customers who can call your voice agent.
                </p>
              ) : (
                <div className="space-y-4">
                  {customers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        {customer.email && (
                          <p className="text-xs text-muted-foreground">{customer.email}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          Customer
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Added {new Date(customer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice Appointments</CardTitle>
              <CardDescription>
                Appointments booked through your voice agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No appointments yet. Your voice agent will show bookings here.
                </p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{appointment.customer_name || 'Unknown Customer'}</p>
                        <p className="text-sm text-muted-foreground">{appointment.customer_phone}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {appointment.appointment_type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </p>
                        <Badge variant={appointment.status === 'scheduled' ? 'default' : 'secondary'}>
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shared Links</CardTitle>
              <CardDescription>
                Links sent to customers via voice agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {links.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No links shared yet. Your voice agent will show shared links here.
                </p>
              ) : (
                <div className="space-y-4">
                  {links.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{link.title || 'Shared Link'}</p>
                        <p className="text-sm text-muted-foreground">{link.customer_phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(link.sent_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="capitalize">
                          {link.link_type}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Link className="w-3 h-3 inline mr-1" />
                          Link sent
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          {profile?.id && <SMSManager retailerId={profile.id} />}
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <VoiceAgentTest retailerId={profile.id} />
        </TabsContent>

        <TabsContent value="live-calls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📞 Live Customer Calls
              </CardTitle>
              <CardDescription>
                Make live calls to customers and manage your VAPI phone number integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* VAPI Setup Instructions */}
              <div className="p-4 border-2 border-dashed border-primary/20 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">📋 Setup Instructions</h4>
                <ol className="text-sm space-y-2 text-muted-foreground">
                  <li>1. Configure your VAPI credentials in the Settings tab</li>
                  <li>2. Set up your VAPI phone number to receive incoming calls</li>
                  <li>3. Configure the webhook URL in VAPI to point to our system</li>
                  <li>4. Your liquor store phone number will automatically process orders</li>
                </ol>
              </div>

              {/* Phone Number Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📱 Your Store Phone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <Phone className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <p className="text-2xl font-bold">{profile.phone}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        This number will receive customer calls for orders
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🤖 AI Agent Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                      <p className="text-lg font-semibold text-green-600">Active</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Ready to handle incoming orders
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Processing Information */}
              <Card>
                <CardHeader>
                  <CardTitle>🏪 Automated Order Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Pickup Orders
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Customers call your number</li>
                        <li>• AI takes order details</li>
                        <li>• Order appears in Pickup section</li>
                        <li>• Payment link sent to customer</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Delivery Orders
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• AI collects delivery address</li>
                        <li>• Adds $3 service fee + driver tip</li>
                        <li>• Order appears in Delivery section</li>
                        <li>• Customer receives payment link</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Test Voice Agent */}
              <Card>
                <CardHeader>
                  <CardTitle>🧪 Test Your Voice Agent</CardTitle>
                  <CardDescription>
                    Test your voice agent configuration before going live
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VoiceAgentTest retailerId={profile.id} />
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* VAPI Configuration */}
          <CredentialsManager />
          
          <Card>
            <CardHeader>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>
                Configure your voice agent and business preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Payment Methods Accepted</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.payment_methods.map((method) => (
                    <Badge key={method} variant="secondary">
                      {method.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Operating Hours</label>
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>Monday - Thursday: 9:00 AM - 9:00 PM</p>
                  <p>Friday - Saturday: 9:00 AM - 10:00 PM</p>
                  <p>Sunday: 10:00 AM - 8:00 PM</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-sm font-semibold">Payment Link</label>
                <p className="text-xs text-muted-foreground mb-2">
                  When a customer places an order, this link is sent to their phone via SMS. Use your Stripe, PayPal, Square, or any payment URL.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://buy.stripe.com/your-payment-link"
                    defaultValue={(profile.payment_methods as Record<string, unknown>)?.payment_link as string || ''}
                    id="payment-link-input"
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      const input = document.getElementById('payment-link-input') as HTMLInputElement;
                      const link = input?.value?.trim();
                      if (!link) { toast.error('Please enter a payment link'); return; }
                      const currentMethods = (profile.payment_methods as Record<string, string>) || {};
                      const { error } = await supabase
                        .from('retailer_profiles')
                        .update({ payment_methods: { ...currentMethods, payment_link: link } })
                        .eq('id', profile.id);
                      if (error) { toast.error('Failed to save payment link'); }
                      else { toast.success('Payment link saved! Customers will receive this when they order.'); }
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}