import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  BarChart3,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface CallLog {
  id: string;
  meeting_id: string;
  call_type: string;
  call_status: string;
  call_duration_seconds?: number;
  customer_response?: string;
  created_at: string;
  automated_meetings: {
    title: string;
    customer_name: string;
    customer_phone: string;
  };
}

interface AutomationStats {
  totalReminders: number;
  successfulCalls: number;
  failedCalls: number;
  confirmedMeetings: number;
  canceledMeetings: number;
  responseRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const AutomationMonitor = () => {
  const { user } = useAuth();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [stats, setStats] = useState<AutomationStats>({
    totalReminders: 0,
    successfulCalls: 0,
    failedCalls: 0,
    confirmedMeetings: 0,
    canceledMeetings: 0,
    responseRate: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadCallLogs();
      loadStats();
    }
  }, [user]);

  const loadCallLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('meeting_call_logs')
        .select(`
          *,
          automated_meetings!inner (
            title,
            customer_name,
            customer_phone,
            user_id
          )
        `)
        .eq('automated_meetings.user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCallLogs(data || []);
    } catch (error) {
      console.error('Error loading call logs:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: meetings, error: meetingsError } = await supabase
        .from('automated_meetings')
        .select(`
          id,
          status,
          meeting_call_logs (
            call_status,
            customer_response
          )
        `)
        .eq('user_id', user?.id);

      if (meetingsError) throw meetingsError;

      const totalReminders = meetings?.reduce((acc, meeting) => 
        acc + (meeting.meeting_call_logs?.length || 0), 0) || 0;
      
      const successfulCalls = meetings?.reduce((acc, meeting) => 
        acc + (meeting.meeting_call_logs?.filter(log => log.call_status === 'completed').length || 0), 0) || 0;
      
      const failedCalls = meetings?.reduce((acc, meeting) => 
        acc + (meeting.meeting_call_logs?.filter(log => log.call_status === 'failed').length || 0), 0) || 0;
      
      const confirmedMeetings = meetings?.reduce((acc, meeting) => 
        acc + (meeting.meeting_call_logs?.filter(log => log.customer_response === 'confirmed').length || 0), 0) || 0;
      
      const canceledMeetings = meetings?.reduce((acc, meeting) => 
        acc + (meeting.meeting_call_logs?.filter(log => log.customer_response === 'cancel').length || 0), 0) || 0;

      const responseRate = totalReminders > 0 ? ((confirmedMeetings + canceledMeetings) / totalReminders) * 100 : 0;

      setStats({
        totalReminders,
        successfulCalls,
        failedCalls,
        confirmedMeetings,
        canceledMeetings,
        responseRate
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const triggerAutomation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('trigger-automation');
      
      if (error) throw error;
      
      toast.success("Automation triggered! 🚀", {
        description: `${data.processed} reminders processed`
      });
      
      // Reload data
      loadCallLogs();
      loadStats();
    } catch (error) {
      console.error('Error triggering automation:', error);
      toast.error('Failed to trigger automation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'in_progress': return 'secondary';
      default: return 'secondary';
    }
  };

  const getResponseColor = (response: string) => {
    switch (response) {
      case 'confirmed': return 'default';
      case 'cancel': return 'destructive';
      case 'reschedule': return 'secondary';
      default: return 'outline';
    }
  };

  const chartData = [
    { name: 'Successful', value: stats.successfulCalls, color: '#00C49F' },
    { name: 'Failed', value: stats.failedCalls, color: '#FF8042' },
    { name: 'Confirmed', value: stats.confirmedMeetings, color: '#0088FE' },
    { name: 'Canceled', value: stats.canceledMeetings, color: '#FFBB28' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                Automation Monitor
              </CardTitle>
              <CardDescription>
                Real-time monitoring of automated meeting reminders
              </CardDescription>
            </div>
            <Button 
              onClick={triggerAutomation} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {loading ? 'Processing...' : 'Trigger Now'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Phone className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalReminders}</p>
                <p className="text-sm text-muted-foreground">Total Reminders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.successfulCalls}</p>
                <p className="text-sm text-muted-foreground">Successful Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.confirmedMeetings}</p>
                <p className="text-sm text-muted-foreground">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <BarChart3 className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.responseRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Response Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Call Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Success vs Failure Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Success', value: stats.successfulCalls, fill: '#00C49F' },
                { name: 'Failed', value: stats.failedCalls, fill: '#FF8042' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Call Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Call Logs</CardTitle>
          <CardDescription>Latest automated reminder calls</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meeting</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Call Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {callLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {log.automated_meetings?.title}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{log.automated_meetings?.customer_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.automated_meetings?.customer_phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {log.call_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(log.call_status)}>
                      {log.call_status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {log.call_status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                      {log.call_status === 'in_progress' && <Clock className="h-3 w-3 mr-1" />}
                      {log.call_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.customer_response ? (
                      <Badge variant={getResponseColor(log.customer_response)}>
                        {log.customer_response}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.call_duration_seconds ? 
                      `${Math.round(log.call_duration_seconds / 60)}m ${log.call_duration_seconds % 60}s` : 
                      '-'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(log.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {callLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No call logs yet. Schedule some meetings to see automation in action!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};