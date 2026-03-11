import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Store, 
  Phone, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  Clock,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

interface AnalyticsData {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  humanFallbacks: number;
  successRate: number;
  avgCallDuration: number;
  totalRevenue: number;
  storePerformance: StorePerformance[];
}

interface StorePerformance {
  id: string;
  storeName: string;
  businessType: string;
  totalCalls: number;
  successRate: number;
  revenue: number;
  lastActivity: string;
}

export function ServiceOwnerDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    humanFallbacks: 0,
    successRate: 0,
    avgCallDuration: 0,
    totalRevenue: 0,
    storePerformance: []
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("7d");

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, timeframe]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get service owner profile
      const { data: serviceOwner, error: ownerError } = await supabase
        .from("service_owners")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (ownerError && ownerError.code !== 'PGRST116') {
        console.error("Error loading service owner:", ownerError);
        return;
      }

      if (!serviceOwner) {
        // Create service owner profile if it doesn't exist
        const { data: newOwner, error: createError } = await supabase
          .from("service_owners")
          .insert({
            user_id: user?.id,
            company_name: "AI Voice Services",
            email: user?.email || "",
            subscription_tier: "premium"
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeframe.replace('d', '')));

      // Load analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from("service_analytics")
        .select(`
          *,
          retailer_profiles!store_id (
            id,
            business_name,
            business_type
          )
        `)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (analyticsError) {
        throw analyticsError;
      }

      // Process analytics data
      const totalCalls = analyticsData?.length || 0;
      const successfulCalls = analyticsData?.filter(a => a.call_outcome === 'ai_success').length || 0;
      const humanFallbacks = analyticsData?.filter(a => a.call_outcome === 'human_fallback').length || 0;
      const failedCalls = analyticsData?.filter(a => a.call_outcome === 'failed').length || 0;
      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
      
      const avgCallDuration = analyticsData?.reduce((acc, curr) => acc + (curr.call_duration || 0), 0) / (totalCalls || 1);

      // Calculate store performance
      const storeMap = new Map();
      analyticsData?.forEach(record => {
        const storeId = record.store_id;
        const storeName = record.retailer_profiles?.business_name || 'Unknown Store';
        const businessType = record.retailer_profiles?.business_type || 'Unknown';
        
        if (!storeMap.has(storeId)) {
          storeMap.set(storeId, {
            id: storeId,
            storeName,
            businessType,
            totalCalls: 0,
            successfulCalls: 0,
            revenue: 0,
            lastActivity: record.created_at
          });
        }
        
        const store = storeMap.get(storeId);
        store.totalCalls++;
        if (record.call_outcome === 'ai_success') {
          store.successfulCalls++;
        }
        if (record.payment_processed) {
          store.revenue += 50; // Placeholder revenue calculation
        }
        if (new Date(record.created_at) > new Date(store.lastActivity)) {
          store.lastActivity = record.created_at;
        }
      });

      const storePerformance = Array.from(storeMap.values()).map(store => ({
        ...store,
        successRate: store.totalCalls > 0 ? (store.successfulCalls / store.totalCalls) * 100 : 0
      }));

      setAnalytics({
        totalCalls,
        successfulCalls,
        failedCalls,
        humanFallbacks,
        successRate,
        avgCallDuration,
        totalRevenue: storePerformance.reduce((acc, store) => acc + store.revenue, 0),
        storePerformance
      });

    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Owner Analytics</h1>
          <p className="text-muted-foreground">
            Track AI voice agent performance across all your stores
          </p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(period)}
            >
              {period === "7d" ? "7 Days" : period === "30d" ? "30 Days" : "90 Days"}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCalls}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeframe} period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.successRate.toFixed(1)}%
            </div>
            <Progress value={analytics.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Human Fallbacks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.humanFallbacks}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalCalls > 0 ? ((analytics.humanFallbacks / analytics.totalCalls) * 100).toFixed(1) : 0}% of total calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Call Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(analytics.avgCallDuration)}s
            </div>
            <p className="text-xs text-muted-foreground">
              Average handling time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Store Performance */}
      <Tabs defaultValue="stores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stores">Store Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends & Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual Store Performance</CardTitle>
              <CardDescription>
                Success rates and metrics for each store location
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.storePerformance.length === 0 ? (
                <div className="text-center py-8">
                  <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No store data available for the selected period
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.storePerformance.map((store) => (
                    <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">{store.storeName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {store.businessType} • {store.totalCalls} calls
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium text-green-600">
                            {store.successRate.toFixed(1)}% Success
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${store.revenue} Revenue
                          </div>
                        </div>
                        <Badge variant={store.successRate >= 80 ? "default" : "secondary"}>
                          {store.successRate >= 80 ? "Excellent" : store.successRate >= 60 ? "Good" : "Needs Improvement"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Call Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">AI Success</span>
                    <span className="text-sm font-medium text-green-600">
                      {analytics.successfulCalls} ({analytics.successRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Human Fallback</span>
                    <span className="text-sm font-medium text-orange-600">
                      {analytics.humanFallbacks}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Failed</span>
                    <span className="text-sm font-medium text-red-600">
                      {analytics.failedCalls}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 mb-2">
                  ${analytics.totalRevenue}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total revenue from AI-completed transactions
                </p>
                <div className="mt-4 text-sm">
                  <div className="flex justify-between">
                    <span>Avg per successful call</span>
                    <span className="font-medium">
                      ${analytics.successfulCalls > 0 ? (analytics.totalRevenue / analytics.successfulCalls).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}