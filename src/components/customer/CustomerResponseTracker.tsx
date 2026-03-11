import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Phone, Clock, Users } from "lucide-react";

interface CustomerResponse {
  id: string;
  customer_name: string;
  customer_phone: string;
  response_type: string;
  response_message: string;
  created_at: string;
}

interface CustomerResponseTrackerProps {
  customers: Array<{
    id: string;
    name: string;
    phone: string;
    email: string;
  }>;
}

export const CustomerResponseTracker = ({ customers }: CustomerResponseTrackerProps) => {
  const [responses, setResponses] = useState<CustomerResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const { data, error } = await supabase
          .from('meeting_responses')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching responses:', error);
          return;
        }

        setResponses(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();

    // Set up real-time listener
    const channel = supabase
      .channel('customer-responses-tracker')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'meeting_responses' },
        () => fetchResponses()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getCustomerLatestResponse = (customerPhone: string) => {
    return responses
      .filter(r => r.customer_phone === customerPhone)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  };

  const getResponseStats = () => {
    const positiveResponses = responses.filter(r => 
      r.response_type === 'yes' || r.response_type === 'confirmed'
    ).length;
    
    const negativeResponses = responses.filter(r => 
      r.response_type === 'no' || r.response_type === 'declined'
    ).length;
    
    const totalResponses = responses.length;
    
    return { positiveResponses, negativeResponses, totalResponses };
  };

  const { positiveResponses, negativeResponses, totalResponses } = getResponseStats();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Response Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customer Response Tracking
        </CardTitle>
        <CardDescription>
          Track customer responses from voice agent calls
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{positiveResponses}</div>
            <div className="text-sm text-muted-foreground">Positive</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{negativeResponses}</div>
            <div className="text-sm text-muted-foreground">Negative</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalResponses}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Customer Response List */}
        <div className="space-y-3">
          {customers.map((customer) => {
            const latestResponse = getCustomerLatestResponse(customer.phone);
            
            return (
              <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">{customer.phone}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {latestResponse ? (
                    <>
                      <Badge 
                        variant={
                          latestResponse.response_type === 'yes' || latestResponse.response_type === 'confirmed' 
                            ? 'default' 
                            : 'destructive'
                        }
                        className="flex items-center gap-1"
                      >
                        {latestResponse.response_type === 'yes' || latestResponse.response_type === 'confirmed' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {latestResponse.response_type === 'yes' || latestResponse.response_type === 'confirmed' 
                          ? 'Positive' 
                          : 'Negative'}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {new Date(latestResponse.created_at).toLocaleDateString()}
                      </div>
                    </>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      No Response
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
          
          {customers.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No customers found</p>
              <p className="text-sm">Add customers to track their call responses</p>
            </div>
          )}
        </div>

        {/* Recent Responses */}
        {responses.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3">Recent Responses</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {responses.slice(0, 10).map((response) => (
                <div key={response.id} className="flex items-start gap-3 p-2 bg-muted/30 rounded text-sm">
                  {response.response_type === 'yes' || response.response_type === 'confirmed' ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{response.customer_name}</div>
                    <div className="text-muted-foreground italic">"{response.response_message}"</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(response.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};