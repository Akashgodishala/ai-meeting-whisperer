import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { PhoneCall, TrendingUp, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CallAnalytics {
  id: string;
  call_id: string;
  customer_phone: string;
  call_duration: number;
  response_detected: boolean;
  response_confidence: number;
  sentiment_score?: number;
  call_success: boolean;
  error_reason?: string;
  created_at: string;
}

interface AnalyticsSummary {
  totalCalls: number;
  successfulCalls: number;
  avgDuration: number;
  avgConfidence: number;
  responseRate: number;
  errorRate: number;
}

export const VoiceAgentAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<CallAnalytics[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7days');

  useEffect(() => {
    loadAnalytics();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('analytics-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'call_analytics' },
        () => loadAnalytics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date filter
      const daysAgo = dateRange === '24hours' ? 1 : 
                     dateRange === '7days' ? 7 : 
                     dateRange === '30days' ? 30 : 7;
      
      const dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('call_analytics')
        .select('*')
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAnalytics(data || []);
      calculateSummary(data || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast({
        title: "Analytics Error",
        description: "Failed to load call analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data: CallAnalytics[]) => {
    if (data.length === 0) {
      setSummary(null);
      return;
    }

    const totalCalls = data.length;
    const successfulCalls = data.filter(call => call.call_success).length;
    const callsWithResponses = data.filter(call => call.response_detected).length;
    const totalDuration = data.reduce((sum, call) => sum + (call.call_duration || 0), 0);
    const totalConfidence = data
      .filter(call => call.response_confidence > 0)
      .reduce((sum, call) => sum + call.response_confidence, 0);
    
    const avgDuration = totalDuration / totalCalls;
    const avgConfidence = totalConfidence / Math.max(callsWithResponses, 1);
    const responseRate = (callsWithResponses / totalCalls) * 100;
    const errorRate = ((totalCalls - successfulCalls) / totalCalls) * 100;

    setSummary({
      totalCalls,
      successfulCalls,
      avgDuration,
      avgConfidence,
      responseRate,
      errorRate
    });
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getSuccessColor = (success: boolean): string => {
    return success ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 
           'bg-red-500/10 text-red-600 border-red-200';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-emerald-600';
    if (confidence >= 0.6) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Voice Agent Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Voice Agent Analytics
              </CardTitle>
              <CardDescription>
                Monitor call performance and customer response rates
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={dateRange === '24hours' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('24hours')}
              >
                24h
              </Button>
              <Button
                variant={dateRange === '7days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('7days')}
              >
                7d
              </Button>
              <Button
                variant={dateRange === '30days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('30days')}
              >
                30d
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {summary ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Call Details</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-muted-foreground">Total Calls</span>
                      </div>
                      <div className="text-2xl font-bold">{summary.totalCalls}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-muted-foreground">Success Rate</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {((summary.successfulCalls / summary.totalCalls) * 100).toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-muted-foreground">Response Rate</span>
                      </div>
                      <div className="text-2xl font-bold">{summary.responseRate.toFixed(1)}%</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-muted-foreground">Avg Duration</span>
                      </div>
                      <div className="text-2xl font-bold">{formatDuration(Math.round(summary.avgDuration))}</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Response Confidence</span>
                      <span className={getConfidenceColor(summary.avgConfidence)}>
                        {(summary.avgConfidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={summary.avgConfidence * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Call Success Rate</span>
                      <span className="text-emerald-600">
                        {((summary.successfulCalls / summary.totalCalls) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(summary.successfulCalls / summary.totalCalls) * 100} className="h-2" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analytics.map((call) => (
                    <Card key={call.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{call.customer_phone}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(call.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSuccessColor(call.call_success)}>
                            {call.call_success ? 'Success' : 'Failed'}
                          </Badge>
                          {call.response_detected && (
                            <Badge variant="outline">
                              Response {(call.response_confidence * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>Duration: {formatDuration(call.call_duration || 0)}</div>
                        <div>
                          Status: {call.response_detected ? 'Responded' : 'No Response'}
                        </div>
                      </div>
                      
                      {call.error_reason && (
                        <div className="mt-2 text-sm text-red-600">
                          Error: {call.error_reason}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Call Outcomes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Successful Calls</span>
                          <span className="text-emerald-600">{summary.successfulCalls}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Failed Calls</span>
                          <span className="text-red-600">
                            {summary.totalCalls - summary.successfulCalls}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Response Rate</span>
                          <span className="text-blue-600">{summary.responseRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Quality Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Avg Confidence</span>
                          <span className={getConfidenceColor(summary.avgConfidence)}>
                            {(summary.avgConfidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Error Rate</span>
                          <span className="text-red-600">{summary.errorRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Duration</span>
                          <span>{formatDuration(Math.round(summary.avgDuration))}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No call data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};