import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Play, 
  Pause,
  Volume2,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Users,
  Mic,
  CalendarCheck,
  CalendarX,
  Download,
  Settings,
  Webhook
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VAPIWebhookWalkthrough } from "@/components/calling/VAPIWebhookWalkthrough";

interface Call {
  id: string;
  customerName: string;
  phoneNumber: string;
  startTime: string;
  duration: number;
  status: 'connecting' | 'in_progress' | 'completed' | 'failed';
  transcript: string;
  meetingReminder: string;
}

interface LiveCallStats {
  totalCalls: number;
  activeCalls: number;
  successfulCalls: number;
  failedCalls: number;
}

interface MeetingResponse {
  id: string;
  customer_name: string;
  customer_phone: string;
  response_type: string;
  response_message: string;
  created_at: string;
}

interface CallSession {
  id: string;
  call_id: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  start_time: string;
  end_time?: string;
  duration: number;
  recording_url?: string;
  transcript?: string;
  created_at: string;
}

export const CallMonitor = () => {
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveStats, setLiveStats] = useState<LiveCallStats>({
    totalCalls: 0,
    activeCalls: 0,
    successfulCalls: 0,
    failedCalls: 0
  });

  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [meetingResponses, setMeetingResponses] = useState<MeetingResponse[]>([]);
  const [callSessions, setCallSessions] = useState<CallSession[]>([]);

  useEffect(() => {
    // Fetch meeting responses
    const fetchMeetingResponses = async () => {
      try {
        const { data, error } = await supabase
          .from('meeting_responses')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching meeting responses:', error);
          return;
        }
        
        console.log('Fetched meeting responses:', data);
        setMeetingResponses(data || []);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    // Fetch call sessions
    const fetchCallSessions = async () => {
      try {
        const { data, error } = await supabase
          .from('call_sessions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (error) {
          console.error('Error fetching call sessions:', error);
          return;
        }
        
        console.log('Fetched call sessions:', data);
        setCallSessions(data || []);
        
        // Update live stats based on real data
        const totalCalls = data?.length || 0;
        const activeCalls = data?.filter(session => session.status === 'in_progress').length || 0;
        const successfulCalls = data?.filter(session => session.status === 'completed').length || 0;
        const failedCalls = data?.filter(session => session.status === 'failed').length || 0;
        
        setLiveStats({
          totalCalls,
          activeCalls,
          successfulCalls,
          failedCalls
        });
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchMeetingResponses();
    fetchCallSessions();
    
    // Set up real-time listeners
    const channel = supabase
      .channel('call-monitor-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_responses'
        },
        (payload) => {
          console.log('Real-time meeting response update:', payload);
          fetchMeetingResponses();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_sessions'
        },
        (payload) => {
          console.log('Real-time call session update:', payload);
          fetchCallSessions();
        }
      )
      .subscribe();

    // Update durations for active calls
    let interval: NodeJS.Timeout;
    if (isLiveMode) {
      interval = setInterval(() => {
        setCallSessions(prevSessions => 
          prevSessions.map(session => {
            if (session.status === 'in_progress') {
              const currentDuration = Math.floor((new Date().getTime() - new Date(session.start_time).getTime()) / 1000);
              return { ...session, duration: currentDuration };
            }
            return session;
          })
        );
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [isLiveMode]);

  const getStatusColor = (status: Call['status']) => {
    switch (status) {
      case 'connecting': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayRecording = (session: CallSession) => {
    if (currentlyPlaying === session.call_id) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(session.call_id);
      
      // If there's a recording URL, try to play it
      if (session.recording_url) {
        const audio = new Audio(session.recording_url);
        audio.play().then(() => {
          audio.onended = () => setCurrentlyPlaying(null);
        }).catch(error => {
          console.error('Error playing recording:', error);
          setCurrentlyPlaying(null);
        });
      } else {
        // Fallback: simulate playing for demo
        setTimeout(() => setCurrentlyPlaying(null), 3000);
      }
    }
  };

  const confirmedAttendees = meetingResponses.filter(response => response.response_type === 'yes');
  const declinedAttendees = meetingResponses.filter(response => response.response_type === 'no');

  return (
    <div className="space-y-6">
      {/* Live Monitor Header */}
      <Card className="bg-gradient-to-r from-card to-muted/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                Live Call Monitor
              </CardTitle>
              <CardDescription>
                Real-time monitoring of voice agent calls and attendee responses
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Webhook className="h-4 w-4" />
                    Setup Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>VAPI Webhook Configuration</DialogTitle>
                  </DialogHeader>
                  <VAPIWebhookWalkthrough />
                </DialogContent>
              </Dialog>
              
              <Button
                onClick={() => setIsLiveMode(!isLiveMode)}
                variant={isLiveMode ? "destructive" : "default"}
                className="flex items-center gap-2"
              >
                {isLiveMode ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Stop Monitor
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start Monitor
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${isLiveMode ? 'text-voice-active' : 'text-voice-inactive'}`}>
              <div className={`w-3 h-3 rounded-full ${isLiveMode ? 'bg-voice-active animate-pulse' : 'bg-voice-inactive'}`}></div>
              <span className="font-medium">
                {isLiveMode ? 'Live Monitoring Active' : 'Monitoring Inactive'}
              </span>
            </div>
            {isLiveMode && (
              <Badge variant="secondary" className="animate-pulse">
                <Mic className="h-3 w-3 mr-1" />
                Recording calls
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Webhook Setup Warning */}
      {callSessions.length === 0 && (
        <Card className="border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Webhook className="h-8 w-8 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Webhook Configuration Required
                </h3>
                <p className="text-amber-800 dark:text-amber-200 text-sm mb-4">
                  To track live customer calls, you must configure the VAPI webhook in your dashboard. 
                  This enables automatic call monitoring and customer response detection.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Webhook Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>VAPI Webhook Configuration</DialogTitle>
                    </DialogHeader>
                    <VAPIWebhookWalkthrough />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveStats.totalCalls}</div>
            <p className="text-xs text-muted-foreground">
              Today's total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
            <PhoneCall className="h-4 w-4 text-call-pending" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveStats.activeCalls}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-call-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedAttendees.length}</div>
            <p className="text-xs text-muted-foreground">
              Will attend meeting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Declined</CardTitle>
            <XCircle className="h-4 w-4 text-call-failed" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{declinedAttendees.length}</div>
            <p className="text-xs text-muted-foreground">
              Won't attend meeting
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Attendees and Recordings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confirmed Attendees */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-call-success" />
              Confirmed Attendees ({confirmedAttendees.length})
            </CardTitle>
            <CardDescription>
              Customers who confirmed they will attend the meeting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {confirmedAttendees.map((response) => (
                <div key={response.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{response.customer_name}</div>
                    <div className="text-sm text-muted-foreground">{response.customer_phone}</div>
                    <div className="text-sm text-green-700 dark:text-green-400 mt-1 italic">
                      "{response.response_message}"
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(response.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200">
                    Attending
                  </Badge>
                </div>
              ))}
              {confirmedAttendees.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No confirmed attendees yet</p>
                  <p className="text-sm">Start making calls to get meeting confirmations</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Call Recordings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              Call Recordings ({callSessions.filter(s => s.recording_url || s.transcript).length})
            </CardTitle>
            <CardDescription>
              Audio recordings and transcripts from completed calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {callSessions
                .filter(session => session.recording_url || session.transcript)
                .map((session) => (
                <div key={session.id} className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <PhoneCall className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold">{session.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{session.customer_phone}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(session.start_time).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(session.status as Call['status'])}>
                        {session.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  
                  {session.transcript && (
                    <div className="mb-3 p-3 bg-white/50 dark:bg-black/20 rounded border">
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        Conversation Transcript
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {session.transcript}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Duration: {session.duration > 0 ? formatDuration(session.duration) : 'N/A'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.recording_url && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePlayRecording(session)}
                            className="flex items-center gap-2"
                          >
                            {currentlyPlaying === session.call_id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            {currentlyPlaying === session.call_id ? 'Pause' : 'Play'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a 
                              href={session.recording_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </a>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {callSessions.filter(session => session.recording_url || session.transcript).length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <Volume2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No recordings available yet</p>
                  <p className="text-sm">Completed calls will appear here with recordings and transcripts</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Declined Attendees (Compact Section) */}
      {declinedAttendees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarX className="h-5 w-5 text-red-500" />
              Declined Attendees ({declinedAttendees.length})
            </CardTitle>
            <CardDescription>
              Customers who won't be attending the meeting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {declinedAttendees.map((response) => (
                <div key={response.id} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{response.customer_name}</div>
                    <div className="text-sm text-muted-foreground truncate">{response.customer_phone}</div>
                    <div className="text-xs text-red-600 dark:text-red-400 truncate">
                      "{response.response_message}"
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};