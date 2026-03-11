import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Plus,
  Clock,
  Phone,
  CheckCircle,
  AlertTriangle,
  Users,
  Settings,
  Bot,
  Zap,
  PhoneCall,
  Bell,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface AutomatedMeeting {
  id: string;
  title: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  meeting_date: string;
  duration_minutes: number;
  description?: string;
  meeting_link?: string;
  location?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  response_status?: string;
}

interface MeetingResponse {
  id: string;
  customer_phone: string;
  customer_name: string;
  response_type: string;
  response_message: string;
  created_at: string;
}

interface ReminderSchedule {
  id: string;
  reminder_type: '24_hours' | '2_hours' | '30_minutes' | '5_minutes';
  scheduled_time: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  call_id?: string;
  response_received?: 'confirmed' | 'reschedule' | 'cancel' | 'no_response';
  notes?: string;
}

interface ReminderSettings {
  id?: string;
  enable_24h_reminder: boolean;
  enable_2h_reminder: boolean;
  enable_30min_reminder: boolean;
  enable_5min_reminder: boolean;
  voice_agent_id?: string;
  reminder_message_template: string;
  max_retry_attempts: number;
  retry_interval_minutes: number;
  business_hours_only: boolean;
  business_start_time: string;
  business_end_time: string;
  timezone: string;
}

export const AutomatedMeetingScheduler = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<AutomatedMeeting[]>([]);
  const [reminders, setReminders] = useState<ReminderSchedule[]>([]);
  const [meetingResponses, setMeetingResponses] = useState<MeetingResponse[]>([]);
  const [settings, setSettings] = useState<ReminderSettings>({
    enable_24h_reminder: true,
    enable_2h_reminder: true,
    enable_30min_reminder: false,
    enable_5min_reminder: false,
    reminder_message_template: 'Hi {customer_name}, this is a friendly reminder about your upcoming meeting "{meeting_title}" scheduled for {meeting_date} at {meeting_time}. Please confirm your attendance by saying "yes" or press 1 to confirm, 2 to reschedule, or 3 to cancel.',
    max_retry_attempts: 2,
    retry_interval_minutes: 15,
    business_hours_only: true,
    business_start_time: '09:00',
    business_end_time: '17:00',
    timezone: 'UTC'
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    meeting_date: "",
    meeting_time: "",
    duration_minutes: 60,
    description: "",
    meeting_link: "",
    location: ""
  });

  useEffect(() => {
    if (user) {
      loadMeetings();
      loadSettings();
      loadMeetingResponses();
    }
  }, [user]);

  // Set up real-time listeners
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('meeting-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'automated_meetings' },
        () => loadMeetings()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_responses' },
        () => loadMeetingResponses()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('automated_meetings')
        .select('*')
        .order('meeting_date', { ascending: true });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error loading meetings:', error);
      toast.error('Failed to load meetings');
    }
  };

  const loadMeetingResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('meeting_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMeetingResponses(data || []);
    } catch (error) {
      console.error('Error loading meeting responses:', error);
    }
  };

  const getResponseStatus = (customerPhone: string): string => {
    const latestResponse = meetingResponses
      .filter(response => response.customer_phone === customerPhone)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    if (!latestResponse) return 'No Response';
    
    return latestResponse.response_type === 'confirmed' ? 'Will Attend' : 'Will Not Attend';
  };

  const getResponseStatusColor = (customerPhone: string) => {
    const status = getResponseStatus(customerPhone);
    switch (status) {
      case 'Will Attend': return 'default';
      case 'Will Not Attend': return 'destructive';
      default: return 'secondary';
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('automated_reminder_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setSettings({
          ...data,
          business_start_time: data.business_start_time?.slice(0, 5) || '09:00',
          business_end_time: data.business_end_time?.slice(0, 5) || '17:00'
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleAddMeeting = async () => {
    if (!newMeeting.title || !newMeeting.customer_name || !newMeeting.customer_phone || 
        !newMeeting.meeting_date || !newMeeting.meeting_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const meetingDateTime = new Date(`${newMeeting.meeting_date}T${newMeeting.meeting_time}`);
      
      const { data, error } = await supabase
        .from('automated_meetings')
        .insert({
          user_id: user?.id,
          title: newMeeting.title,
          customer_name: newMeeting.customer_name,
          customer_phone: newMeeting.customer_phone,
          customer_email: newMeeting.customer_email || null,
          meeting_date: meetingDateTime.toISOString(),
          duration_minutes: newMeeting.duration_minutes,
          description: newMeeting.description || null,
          meeting_link: newMeeting.meeting_link || null,
          location: newMeeting.location || null
        })
        .select()
        .single();

      if (error) throw error;

      setMeetings([...meetings, data]);
      setNewMeeting({
        title: "",
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        meeting_date: "",
        meeting_time: "",
        duration_minutes: 60,
        description: "",
        meeting_link: "",
        location: ""
      });
      setIsDialogOpen(false);
      
      toast.success("Meeting scheduled with automated reminders! 🎯", {
        description: "Voice reminders will be sent automatically based on your settings."
      });
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error('Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const settingsData = {
        user_id: user?.id,
        ...settings,
        business_start_time: `${settings.business_start_time}:00`,
        business_end_time: `${settings.business_end_time}:00`
      };

      if (settings.id) {
        const { error } = await supabase
          .from('automated_reminder_settings')
          .update(settingsData)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('automated_reminder_settings')
          .insert(settingsData)
          .select()
          .single();
        if (error) throw error;
        setSettings({ ...settings, id: data.id });
      }

      setIsSettingsOpen(false);
      toast.success("Automation settings saved! 🤖");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const testAutomation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('automated-meeting-reminder');
      
      if (error) throw error;
      
      toast.success("Automation test completed! 🚀", {
        description: `${data.processed} reminders processed, ${data.failed} failed`
      });
    } catch (error) {
      console.error('Error testing automation:', error);
      toast.error('Automation test failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: AutomatedMeeting['status']) => {
    switch (status) {
      case 'scheduled': return 'secondary';
      case 'confirmed': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      case 'no_show': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: AutomatedMeeting['status']) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-3 w-3" />;
      case 'confirmed': return <CheckCircle className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <AlertTriangle className="h-3 w-3" />;
      case 'no_show': return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const totalScheduled = meetings.filter(m => m.status === 'scheduled').length;
  const totalConfirmed = meetings.filter(m => m.status === 'confirmed').length;
  const totalCompleted = meetings.filter(m => m.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                AI Voice Agent Automation
              </CardTitle>
              <CardDescription>
                Intelligent voice automation for all your business operations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={testAutomation}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Test Automation
              </Button>
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Automation Settings
                    </DialogTitle>
                    <DialogDescription>
                      Configure when and how automated reminders are sent
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="timing" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="timing">Timing</TabsTrigger>
                      <TabsTrigger value="message">Message</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="timing" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="24h">24 Hours Before</Label>
                          <Switch
                            id="24h"
                            checked={settings.enable_24h_reminder}
                            onCheckedChange={(checked) => 
                              setSettings({...settings, enable_24h_reminder: checked})
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="2h">2 Hours Before</Label>
                          <Switch
                            id="2h"
                            checked={settings.enable_2h_reminder}
                            onCheckedChange={(checked) => 
                              setSettings({...settings, enable_2h_reminder: checked})
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="30m">30 Minutes Before</Label>
                          <Switch
                            id="30m"
                            checked={settings.enable_30min_reminder}
                            onCheckedChange={(checked) => 
                              setSettings({...settings, enable_30min_reminder: checked})
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="5m">5 Minutes Before</Label>
                          <Switch
                            id="5m"
                            checked={settings.enable_5min_reminder}
                            onCheckedChange={(checked) => 
                              setSettings({...settings, enable_5min_reminder: checked})
                            }
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-time">Business Start Time</Label>
                          <Input
                            id="start-time"
                            type="time"
                            value={settings.business_start_time}
                            onChange={(e) => setSettings({...settings, business_start_time: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-time">Business End Time</Label>
                          <Input
                            id="end-time"
                            type="time"
                            value={settings.business_end_time}
                            onChange={(e) => setSettings({...settings, business_end_time: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="business-hours">Business Hours Only</Label>
                        <Switch
                          id="business-hours"
                          checked={settings.business_hours_only}
                          onCheckedChange={(checked) => 
                            setSettings({...settings, business_hours_only: checked})
                          }
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="message" className="space-y-4">
                      <div>
                        <Label htmlFor="message-template">Message Template</Label>
                        <Textarea
                          id="message-template"
                          value={settings.reminder_message_template}
                          onChange={(e) => setSettings({...settings, reminder_message_template: e.target.value})}
                          rows={4}
                          placeholder="Use {customer_name}, {meeting_title}, {meeting_date}, {meeting_time} as placeholders"
                        />
                      </div>
                      <div>
                        <Label htmlFor="voice-agent">Voice Agent ID (Optional)</Label>
                        <Input
                          id="voice-agent"
                          value={settings.voice_agent_id || ''}
                          onChange={(e) => setSettings({...settings, voice_agent_id: e.target.value})}
                          placeholder="Your custom VAPI assistant ID"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="advanced" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="max-retries">Max Retry Attempts</Label>
                          <Input
                            id="max-retries"
                            type="number"
                            min="0"
                            max="5"
                            value={settings.max_retry_attempts}
                            onChange={(e) => setSettings({...settings, max_retry_attempts: parseInt(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="retry-interval">Retry Interval (minutes)</Label>
                          <Input
                            id="retry-interval"
                            type="number"
                            min="5"
                            max="60"
                            value={settings.retry_interval_minutes}
                            onChange={(e) => setSettings({...settings, retry_interval_minutes: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select 
                          value={settings.timezone} 
                          onValueChange={(value) => setSettings({...settings, timezone: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Chicago">Central Time</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveSettings} disabled={loading} className="flex-1">
                      Save Settings
                    </Button>
                    <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Schedule Meeting
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Schedule New Meeting
                    </DialogTitle>
                    <DialogDescription>
                      Create a meeting with automated voice reminders
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Meeting Title *</Label>
                      <Input
                        id="title"
                        value={newMeeting.title}
                        onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                        placeholder="e.g., Product Demo"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer-name">Customer Name *</Label>
                        <Input
                          id="customer-name"
                          value={newMeeting.customer_name}
                          onChange={(e) => setNewMeeting({...newMeeting, customer_name: e.target.value})}
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer-phone">Phone Number *</Label>
                        <Input
                          id="customer-phone"
                          value={newMeeting.customer_phone}
                          onChange={(e) => setNewMeeting({...newMeeting, customer_phone: e.target.value})}
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="customer-email">Email (Optional)</Label>
                      <Input
                        id="customer-email"
                        type="email"
                        value={newMeeting.customer_email}
                        onChange={(e) => setNewMeeting({...newMeeting, customer_email: e.target.value})}
                        placeholder="john@example.com"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newMeeting.meeting_date}
                          onChange={(e) => setNewMeeting({...newMeeting, meeting_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Time *</Label>
                        <Input
                          id="time"
                          type="time"
                          value={newMeeting.meeting_time}
                          onChange={(e) => setNewMeeting({...newMeeting, meeting_time: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="15"
                        step="15"
                        value={newMeeting.duration_minutes}
                        onChange={(e) => setNewMeeting({...newMeeting, duration_minutes: parseInt(e.target.value)})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={newMeeting.description}
                        onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                        placeholder="Meeting agenda or notes"
                        rows={2}
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddMeeting} disabled={loading} className="flex-1">
                        {loading ? 'Scheduling...' : 'Schedule with Automation'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {totalScheduled} Scheduled
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm">
                {totalConfirmed} Confirmed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent" />
              <span className="text-sm">
                {totalCompleted} Completed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                Fully Automated
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meetings Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meeting</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Automation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <div>{meeting.title}</div>
                      {meeting.description && (
                        <div className="text-xs text-muted-foreground">{meeting.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        {meeting.customer_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {meeting.customer_phone}
                      </div>
                      {meeting.customer_email && (
                        <div className="text-xs text-muted-foreground">
                          {meeting.customer_email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {new Date(meeting.meeting_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(meeting.meeting_date).toLocaleTimeString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(meeting.status)}>
                      {getStatusIcon(meeting.status)}
                      <span className="ml-1 capitalize">{meeting.status.replace('_', ' ')}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getResponseStatusColor(meeting.customer_phone)}>
                      <span className="text-xs">{getResponseStatus(meeting.customer_phone)}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{meeting.duration_minutes} min</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Bell className="h-3 w-3 text-primary" />
                      <span className="text-xs text-primary">Auto Reminders</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {meetings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No meetings scheduled. Create your first automated meeting!
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