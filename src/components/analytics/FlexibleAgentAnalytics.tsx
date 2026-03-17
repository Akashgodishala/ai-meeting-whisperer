import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  MessageSquare,
  Phone,
  Heart,
  Target,
  Activity,
  Globe
} from 'lucide-react';

// Mock data - in real app this would come from your analytics service
const performanceData = [
  { date: '2024-01-01', calls: 120, success: 95, duration: 4.2, satisfaction: 4.5 },
  { date: '2024-01-02', calls: 135, success: 98, duration: 3.8, satisfaction: 4.6 },
  { date: '2024-01-03', calls: 110, success: 92, duration: 5.1, satisfaction: 4.3 },
  { date: '2024-01-04', calls: 150, success: 102, duration: 4.0, satisfaction: 4.7 },
  { date: '2024-01-05', calls: 165, success: 115, duration: 3.9, satisfaction: 4.8 },
  { date: '2024-01-06', calls: 140, success: 105, duration: 4.3, satisfaction: 4.5 },
  { date: '2024-01-07', calls: 175, success: 125, duration: 3.7, satisfaction: 4.9 }
];

const channelData = [
  { name: 'Voice Calls', value: 65, color: '#3B82F6' },
  { name: 'SMS', value: 20, color: '#10B981' },
  { name: 'WhatsApp', value: 10, color: '#8B5CF6' },
  { name: 'Web Chat', value: 5, color: '#F59E0B' }
];

const sentimentData = [
  { date: '2024-01-01', positive: 75, neutral: 20, negative: 5 },
  { date: '2024-01-02', positive: 78, neutral: 18, negative: 4 },
  { date: '2024-01-03', positive: 72, neutral: 23, negative: 5 },
  { date: '2024-01-04', positive: 80, neutral: 17, negative: 3 },
  { date: '2024-01-05', positive: 82, neutral: 15, negative: 3 },
  { date: '2024-01-06', positive: 77, neutral: 19, negative: 4 },
  { date: '2024-01-07', positive: 85, neutral: 13, negative: 2 }
];

const agentPerformance = [
  { name: 'Customer Service Pro', calls: 450, success: 92, rating: 4.8, uptime: 99.5 },
  { name: 'Sales Closer AI', calls: 320, success: 88, rating: 4.6, uptime: 98.2 },
  { name: 'Medical Scheduler', calls: 180, success: 95, rating: 4.9, uptime: 99.8 },
  { name: 'E-commerce Assistant', calls: 280, success: 85, rating: 4.4, uptime: 97.5 }
];

interface FlexibleAgentAnalyticsProps {
  agentId?: string;
}

export const FlexibleAgentAnalytics: React.FC<FlexibleAgentAnalyticsProps> = ({ agentId }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('calls');

  const calculateChange = (data: Record<string, number>[], metric: string) => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1][metric];
    const previous = data[data.length - 2][metric];
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const MetricCard = ({ title, value, change, icon: Icon, suffix = '' }: { title: string; value: string; change: string | number; icon: React.ElementType; suffix?: string }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}{suffix}</p>
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon(parseFloat(change))}
              <span className={`text-sm ${
                parseFloat(change) > 0 ? 'text-green-500' : 
                parseFloat(change) < 0 ? 'text-red-500' : 'text-gray-500'
              }`}>
                {Math.abs(parseFloat(change))}% from last period
              </span>
            </div>
          </div>
          <div className="p-3 bg-muted rounded-full">
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your voice agents' performance and insights
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Conversations"
          value="1,245"
          change={calculateChange(performanceData, 'calls')}
          icon={MessageSquare}
        />
        <MetricCard
          title="Success Rate"
          value="94.2"
          change={calculateChange(performanceData, 'success')}
          icon={Target}
          suffix="%"
        />
        <MetricCard
          title="Avg Duration"
          value="4.1"
          change={calculateChange(performanceData, 'duration')}
          icon={Clock}
          suffix=" min"
        />
        <MetricCard
          title="Satisfaction"
          value="4.7"
          change={calculateChange(performanceData, 'satisfaction')}
          icon={Heart}
          suffix="/5"
        />
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Call Volume Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="calls" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="success" 
                      stroke="#10B981" 
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="calls" fill="#3B82F6" name="Total Calls" />
                  <Bar dataKey="success" fill="#10B981" name="Successful Calls" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {channelData.map((entry, index) => (
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
                <CardTitle>Channel Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {channelData.map((channel, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: channel.color }}
                      />
                      <span className="font-medium">{channel.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{channel.value}%</p>
                      <p className="text-sm text-muted-foreground">of total volume</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={sentimentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="positive" stackId="1" stroke="#10B981" fill="#10B981" />
                  <Area type="monotone" dataKey="neutral" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                  <Area type="monotone" dataKey="negative" stackId="1" stroke="#EF4444" fill="#EF4444" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">78%</div>
                <p className="text-sm text-muted-foreground">Positive Sentiment</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-2">18%</div>
                <p className="text-sm text-muted-foreground">Neutral Sentiment</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-red-500 mb-2">4%</div>
                <p className="text-sm text-muted-foreground">Negative Sentiment</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentPerformance.map((agent, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{agent.name}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{agent.calls} calls</span>
                        <span>{agent.success}% success</span>
                        <span>{agent.rating}/5 rating</span>
                        <span>{agent.uptime}% uptime</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={agent.uptime > 99 ? 'default' : agent.uptime > 95 ? 'secondary' : 'destructive'}
                      >
                        {agent.uptime > 99 ? 'Excellent' : agent.uptime > 95 ? 'Good' : 'Needs Attention'}
                      </Badge>
                      <Activity className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};