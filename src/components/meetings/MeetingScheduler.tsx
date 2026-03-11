import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
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
  Users
} from "lucide-react";
import { toast } from "sonner";

interface Meeting {
  id: string;
  title: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  meeting_date: string;
  location?: string;
  description?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  response_status?: 'attending' | 'not_attending' | 'no_response';
}

export const MeetingScheduler = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    date: "",
    time: "",
    location: "",
    description: ""
  });

  useEffect(() => {
    fetchMeetings();
    
    // Set up real-time listener for meeting updates
    const channel = supabase
      .channel('meeting-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automated_meetings'
        },
        () => {
          fetchMeetings();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_responses'
        },
        () => {
          fetchMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('automated_meetings')
        .select('*')
        .order('meeting_date', { ascending: true });

      if (meetingsError) {
        console.error('Error fetching meetings:', meetingsError);
        return;
      }

      // Fetch meeting responses to get attendance status
      const { data: responsesData, error: responsesError } = await supabase
        .from('meeting_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (responsesError) {
        console.error('Error fetching responses:', responsesError);
      }

      // Combine meeting data with response data
      const meetingsWithResponses: Meeting[] = meetingsData?.map(meeting => {
        const response = responsesData?.find(r => 
          r.customer_phone === meeting.customer_phone || 
          r.customer_name === meeting.customer_name
        );
        
        let response_status: 'attending' | 'not_attending' | 'no_response' = 'no_response';
        if (response) {
          response_status = response.response_type === 'yes' ? 'attending' : 
                          response.response_type === 'no' ? 'not_attending' : 'no_response';
        }

        return {
          id: meeting.id,
          title: meeting.title,
          customer_name: meeting.customer_name,
          customer_phone: meeting.customer_phone,
          customer_email: meeting.customer_email || undefined,
          meeting_date: meeting.meeting_date,
          location: meeting.location || undefined,
          description: meeting.description || undefined,
          status: (meeting.status as 'scheduled' | 'completed' | 'cancelled') || 'scheduled',
          created_at: meeting.created_at,
          response_status
        };
      }) || [];

      setMeetings(meetingsWithResponses);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const handleAddMeeting = async () => {
    if (!newMeeting.title || !newMeeting.customer_name || !newMeeting.customer_phone || !newMeeting.date || !newMeeting.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const meetingDateTime = new Date(`${newMeeting.date}T${newMeeting.time}`);
      
      const { data, error } = await supabase
        .from('automated_meetings')
        .insert({
          title: newMeeting.title,
          customer_name: newMeeting.customer_name,
          customer_phone: newMeeting.customer_phone,
          customer_email: newMeeting.customer_email || null,
          meeting_date: meetingDateTime.toISOString(),
          location: newMeeting.location || null,
          description: newMeeting.description || null,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating meeting:', error);
        toast.error("Failed to schedule meeting");
        return;
      }

      setNewMeeting({ 
        title: "", 
        customer_name: "", 
        customer_phone: "", 
        customer_email: "", 
        date: "", 
        time: "", 
        location: "", 
        description: "" 
      });
      setIsDialogOpen(false);
      toast.success("Meeting scheduled successfully!");
      fetchMeetings();
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error("Failed to schedule meeting");
    }
  };

  const handleSendReminder = async (meeting: Meeting) => {
    try {
      // Make a call using the VAPI service
      const response = await fetch('https://scagutbejvgicmllzqge.functions.supabase.co/make-vapi-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: {
            name: meeting.customer_name,
            phone: meeting.customer_phone,
            email: meeting.customer_email
          },
          customMessage: `Hi ${meeting.customer_name}, this is a reminder about your upcoming meeting "${meeting.title}" on ${new Date(meeting.meeting_date).toLocaleDateString()}. Please confirm if you can attend by saying yes or no.`
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Voice reminder call initiated!");
      } else {
        toast.error(`Failed to initiate call: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error("Failed to send reminder call");
    }
  };

  const getResponseStatusColor = (status?: 'attending' | 'not_attending' | 'no_response') => {
    switch (status) {
      case 'attending': return 'default';
      case 'not_attending': return 'destructive';
      case 'no_response': return 'secondary';
      default: return 'secondary';
    }
  };

  const getResponseStatusIcon = (status?: 'attending' | 'not_attending' | 'no_response') => {
    switch (status) {
      case 'attending': return <CheckCircle className="h-3 w-3" />;
      case 'not_attending': return <AlertTriangle className="h-3 w-3" />;
      case 'no_response': return <Clock className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: Meeting['status']) => {
    switch (status) {
      case 'scheduled': return 'secondary';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: Meeting['status']) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Meeting Scheduler
              </CardTitle>
              <CardDescription>
                Schedule meetings and automate voice reminder calls
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Schedule Meeting
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Schedule New Meeting
                  </DialogTitle>
                  <DialogDescription>
                    Create a new meeting with automatic voice reminder
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Meeting Title *</Label>
                    <Input
                      id="title"
                      value={newMeeting.title}
                      onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                      placeholder="Enter meeting title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer">Customer Name *</Label>
                    <Input
                      id="customer"
                      value={newMeeting.customer_name}
                      onChange={(e) => setNewMeeting({...newMeeting, customer_name: e.target.value})}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Customer Phone *</Label>
                    <Input
                      id="phone"
                      value={newMeeting.customer_phone}
                      onChange={(e) => setNewMeeting({...newMeeting, customer_phone: e.target.value})}
                      placeholder="Enter phone number (e.g., +1234567890)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Customer Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newMeeting.customer_email}
                      onChange={(e) => setNewMeeting({...newMeeting, customer_email: e.target.value})}
                      placeholder="Enter email address (optional)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newMeeting.date}
                        onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newMeeting.time}
                        onChange={(e) => setNewMeeting({...newMeeting, time: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newMeeting.location}
                      onChange={(e) => setNewMeeting({...newMeeting, location: e.target.value})}
                      placeholder="Meeting location (optional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newMeeting.description}
                      onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                      placeholder="Meeting description (optional)"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddMeeting} className="flex-1">
                      Schedule Meeting
                    </Button>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {meetings.filter(m => m.status === 'scheduled').length} Scheduled
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                {meetings.filter(m => m.response_status === 'attending').length} Will Attend
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm">
                {meetings.filter(m => m.response_status === 'not_attending').length} Won't Attend
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-amber-600" />
              <span className="text-sm">
                {meetings.filter(m => m.response_status === 'no_response').length} No Response
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{meeting.title}</div>
                      {meeting.description && (
                        <div className="text-xs text-muted-foreground mt-1">{meeting.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        {meeting.customer_name}
                      </div>
                      <div className="text-xs text-muted-foreground">{meeting.customer_phone}</div>
                      {meeting.customer_email && (
                        <div className="text-xs text-muted-foreground">{meeting.customer_email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {new Date(meeting.meeting_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(meeting.meeting_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {meeting.location && (
                        <div className="text-xs text-muted-foreground">📍 {meeting.location}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(meeting.status)}>
                      {getStatusIcon(meeting.status)}
                      <span className="ml-1">{meeting.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getResponseStatusColor(meeting.response_status)}>
                      {getResponseStatusIcon(meeting.response_status)}
                      <span className="ml-1">
                        {meeting.response_status === 'attending' ? 'Will Attend' :
                         meeting.response_status === 'not_attending' ? 'Won\'t Attend' : 'No Response'}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendReminder(meeting)}
                        className="flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        Send Reminder
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};