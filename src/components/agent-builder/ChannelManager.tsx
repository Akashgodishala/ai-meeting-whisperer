import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  MessageSquare, 
  MessageCircle, 
  Monitor, 
  Mail,
  Plus,
  Settings,
  Trash2
} from 'lucide-react';
import { ChannelConfig } from '@/types/agent';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChannelManagerProps {
  channels: ChannelConfig[];
  onChange: (channels: ChannelConfig[]) => void;
}

const channelTypes = [
  { 
    type: 'voice', 
    icon: Phone, 
    label: 'Voice Calls', 
    description: 'Handle inbound and outbound phone calls',
    color: 'bg-blue-500'
  },
  { 
    type: 'sms', 
    icon: MessageSquare, 
    label: 'SMS', 
    description: 'Send and receive text messages',
    color: 'bg-green-500'
  },
  { 
    type: 'whatsapp', 
    icon: MessageCircle, 
    label: 'WhatsApp', 
    description: 'WhatsApp Business integration',
    color: 'bg-green-600'
  },
  { 
    type: 'webchat', 
    icon: Monitor, 
    label: 'Web Chat', 
    description: 'Website chat widget',
    color: 'bg-purple-500'
  },
  { 
    type: 'email', 
    icon: Mail, 
    label: 'Email', 
    description: 'Email automation and responses',
    color: 'bg-orange-500'
  }
];

export const ChannelManager: React.FC<ChannelManagerProps> = ({ channels, onChange }) => {
  const [selectedChannel, setSelectedChannel] = useState<ChannelConfig | null>(null);
  const [isAddingChannel, setIsAddingChannel] = useState(false);

  const addChannel = (type: ChannelConfig['type']) => {
    const newChannel: ChannelConfig = {
      type,
      enabled: true,
      settings: getDefaultChannelSettings(type),
      phoneNumbers: type === 'voice' || type === 'sms' ? [] : undefined,
      webhookUrl: type === 'whatsapp' ? '' : undefined
    };

    onChange([...channels, newChannel]);
    setSelectedChannel(newChannel);
    setIsAddingChannel(false);
  };

  const updateChannel = (index: number, updates: Partial<ChannelConfig>) => {
    const updatedChannels = channels.map((channel, i) =>
      i === index ? { ...channel, ...updates } : channel
    );
    onChange(updatedChannels);
    
    if (selectedChannel && channels[index] === selectedChannel) {
      setSelectedChannel({ ...selectedChannel, ...updates });
    }
  };

  const removeChannel = (index: number) => {
    const updatedChannels = channels.filter((_, i) => i !== index);
    onChange(updatedChannels);
    setSelectedChannel(null);
  };

  const renderChannelSettings = () => {
    if (!selectedChannel) return null;

    const channelIndex = channels.findIndex(c => c === selectedChannel);
    if (channelIndex === -1) return null;

    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {React.createElement(
              channelTypes.find(ct => ct.type === selectedChannel.type)?.icon || Phone,
              { className: "w-5 h-5" }
            )}
            {channelTypes.find(ct => ct.type === selectedChannel.type)?.label} Settings
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => removeChannel(channelIndex)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Channel</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to contact through this channel
              </p>
            </div>
            <Switch
              checked={selectedChannel.enabled}
              onCheckedChange={(enabled) => updateChannel(channelIndex, { enabled })}
            />
          </div>

          <Separator />

          {selectedChannel.type === 'voice' && (
            <>
              <div className="space-y-2">
                <Label>Phone Numbers</Label>
                <div className="space-y-2">
                  {selectedChannel.phoneNumbers?.map((number, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input value={number} readOnly />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const numbers = selectedChannel.phoneNumbers?.filter((_, i) => i !== idx) || [];
                          updateChannel(channelIndex, { phoneNumbers: numbers });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Phone Number
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Voice Provider</Label>
                <Select
                  value={selectedChannel.settings.provider || 'vapi'}
                  onValueChange={(provider) => 
                    updateChannel(channelIndex, { 
                      settings: { ...selectedChannel.settings, provider }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vapi">VAPI</SelectItem>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="openai">OpenAI Realtime</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Call Recording</Label>
                <Switch
                  checked={selectedChannel.settings.recordCalls || false}
                  onCheckedChange={(recordCalls) => 
                    updateChannel(channelIndex, { 
                      settings: { ...selectedChannel.settings, recordCalls }
                    })
                  }
                />
              </div>
            </>
          )}

          {selectedChannel.type === 'sms' && (
            <>
              <div className="space-y-2">
                <Label>SMS Provider</Label>
                <Select
                  value={selectedChannel.settings.provider || 'twilio'}
                  onValueChange={(provider) => 
                    updateChannel(channelIndex, { 
                      settings: { ...selectedChannel.settings, provider }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="messagebird">MessageBird</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Phone Numbers</Label>
                <div className="space-y-2">
                  {selectedChannel.phoneNumbers?.map((number, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input value={number} readOnly />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const numbers = selectedChannel.phoneNumbers?.filter((_, i) => i !== idx) || [];
                          updateChannel(channelIndex, { phoneNumbers: numbers });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Phone Number
                  </Button>
                </div>
              </div>
            </>
          )}

          {selectedChannel.type === 'whatsapp' && (
            <>
              <div className="space-y-2">
                <Label>WhatsApp Provider</Label>
                <Select
                  value={selectedChannel.settings.provider || 'twilio'}
                  onValueChange={(provider) => 
                    updateChannel(channelIndex, { 
                      settings: { ...selectedChannel.settings, provider }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="whatsapp-business">WhatsApp Business API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={selectedChannel.webhookUrl || ''}
                  onChange={(e) => updateChannel(channelIndex, { webhookUrl: e.target.value })}
                  placeholder="https://your-webhook-url.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Business Phone Number</Label>
                <Input
                  value={selectedChannel.settings.businessNumber || ''}
                  onChange={(e) => 
                    updateChannel(channelIndex, { 
                      settings: { ...selectedChannel.settings, businessNumber: e.target.value }
                    })
                  }
                  placeholder="+1234567890"
                />
              </div>
            </>
          )}

          {selectedChannel.type === 'webchat' && (
            <>
              <div className="space-y-2">
                <Label>Widget Theme</Label>
                <Select
                  value={selectedChannel.settings.theme || 'default'}
                  onValueChange={(theme) => 
                    updateChannel(channelIndex, { 
                      settings: { ...selectedChannel.settings, theme }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Welcome Message</Label>
                <Input
                  value={selectedChannel.settings.welcomeMessage || ''}
                  onChange={(e) => 
                    updateChannel(channelIndex, { 
                      settings: { ...selectedChannel.settings, welcomeMessage: e.target.value }
                    })
                  }
                  placeholder="Hi! How can I help you today?"
                />
              </div>

              <div className="space-y-2">
                <Label>Position</Label>
                <Select
                  value={selectedChannel.settings.position || 'bottom-right'}
                  onValueChange={(position) => 
                    updateChannel(channelIndex, { 
                      settings: { ...selectedChannel.settings, position }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {selectedChannel.type === 'email' && (
            <>
              <div className="space-y-2">
                <Label>Email Provider</Label>
                <Select
                  value={selectedChannel.settings.provider || 'smtp'}
                  onValueChange={(provider) => 
                    updateChannel(channelIndex, { 
                      settings: { ...selectedChannel.settings, provider }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smtp">SMTP</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>From Email</Label>
                <Input
                  value={selectedChannel.settings.fromEmail || ''}
                  onChange={(e) => 
                    updateChannel(channelIndex, { 
                      settings: { ...selectedChannel.settings, fromEmail: e.target.value }
                    })
                  }
                  placeholder="noreply@yourcompany.com"
                />
              </div>

              <div className="space-y-2">
                <Label>From Name</Label>
                <Input
                  value={selectedChannel.settings.fromName || ''}
                  onChange={(e) => 
                    updateChannel(channelIndex, { 
                      settings: { ...selectedChannel.settings, fromName: e.target.value }
                    })
                  }
                  placeholder="Your Company"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full flex gap-6">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Communication Channels</h3>
          <Button onClick={() => setIsAddingChannel(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Channel
          </Button>
        </div>

        {isAddingChannel && (
          <Card>
            <CardHeader>
              <CardTitle>Add Communication Channel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {channelTypes.map((channelType) => (
                  <Button
                    key={channelType.type}
                    variant="outline"
                    className="h-24 flex flex-col items-center gap-2 text-left"
                    onClick={() => addChannel(channelType.type as ChannelConfig['type'])}
                  >
                    <div className={`p-2 rounded-full text-white ${channelType.color}`}>
                      <channelType.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{channelType.label}</p>
                      <p className="text-xs text-muted-foreground">{channelType.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setIsAddingChannel(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {channels.map((channel, index) => {
            const channelType = channelTypes.find(ct => ct.type === channel.type);
            const isSelected = selectedChannel === channel;

            return (
              <Card 
                key={`${channel.type}-${index}`}
                className={`cursor-pointer transition-colors ${
                  isSelected ? 'border-primary bg-muted/30' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedChannel(channel)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full text-white ${channelType?.color}`}>
                        {channelType && React.createElement(channelType.icon, { className: "w-4 h-4" })}
                      </div>
                      <div>
                        <p className="font-medium">{channelType?.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {channel.enabled ? 'Active' : 'Inactive'}
                          {channel.phoneNumbers && channel.phoneNumbers.length > 0 && 
                            ` • ${channel.phoneNumbers.length} number(s)`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={channel.enabled ? 'default' : 'secondary'}>
                        {channel.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Settings className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {channels.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-muted-foreground">
                  <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No channels configured</p>
                  <p className="text-sm">Add a channel to start receiving customer contacts</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="w-80">
        {selectedChannel ? (
          renderChannelSettings()
        ) : (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a channel to configure its settings</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

function getDefaultChannelSettings(type: ChannelConfig['type']): Record<string, unknown> {
  switch (type) {
    case 'voice':
      return {
        provider: 'vapi',
        recordCalls: true,
        voicemail: true
      };
    case 'sms':
      return {
        provider: 'twilio',
        autoReply: true
      };
    case 'whatsapp':
      return {
        provider: 'twilio',
        businessNumber: ''
      };
    case 'webchat':
      return {
        theme: 'default',
        position: 'bottom-right',
        welcomeMessage: 'Hi! How can I help you today?'
      };
    case 'email':
      return {
        provider: 'smtp',
        fromEmail: '',
        fromName: ''
      };
    default:
      return {};
  }
}