import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, MessageSquare, Zap, BarChart3, Users } from 'lucide-react';
import { VoiceAgent, AgentPersonality, ChannelConfig } from '@/types/agent';
import { FlowDesigner } from './FlowDesigner';
import { ChannelManager } from './ChannelManager';
import { IntegrationHub } from './IntegrationHub';

interface AgentBuilderProps {
  agent?: VoiceAgent;
  onSave: (agent: VoiceAgent) => void;
  onCancel: () => void;
}

export const AgentBuilder: React.FC<AgentBuilderProps> = ({
  agent,
  onSave,
  onCancel
}) => {
  const [currentAgent, setCurrentAgent] = useState<Partial<VoiceAgent>>(
    agent || {
      name: '',
      description: '',
      status: 'draft',
      voice: {
        provider: 'openai',
        voiceId: 'alloy',
        speed: 1.0
      },
      ai: {
        model: 'gpt-4.1-2025-04-14',
        temperature: 0.7,
        systemPrompt: 'You are a helpful voice assistant.',
        personality: {
          tone: 'professional',
          style: 'conversational',
          traits: ['helpful', 'patient']
        }
      },
      channels: [],
      integrations: [],
      analytics: {
        enabled: true,
        trackSentiment: true,
        trackPerformance: true
      },
      businessRules: []
    }
  );

  const [currentTab, setCurrentTab] = useState('basic');

  const updateAgent = useCallback((updates: Partial<VoiceAgent>) => {
    setCurrentAgent(prev => ({ ...prev, ...updates }));
  }, []);

  const updateVoiceConfig = useCallback((voiceUpdates: Partial<VoiceAgent['voice']>) => {
    setCurrentAgent(prev => ({
      ...prev,
      voice: { ...prev.voice!, ...voiceUpdates }
    }));
  }, []);

  const updateAIConfig = useCallback((aiUpdates: Partial<VoiceAgent['ai']>) => {
    setCurrentAgent(prev => ({
      ...prev,
      ai: { ...prev.ai!, ...aiUpdates }
    }));
  }, []);

  const updatePersonality = useCallback((personalityUpdates: Partial<AgentPersonality>) => {
    setCurrentAgent(prev => ({
      ...prev,
      ai: {
        ...prev.ai!,
        personality: { ...prev.ai!.personality, ...personalityUpdates }
      }
    }));
  }, []);

  const handleSave = () => {
    const completeAgent: VoiceAgent = {
      id: agent?.id || Date.now().toString(),
      name: currentAgent.name!,
      description: currentAgent.description,
      status: currentAgent.status!,
      voice: currentAgent.voice!,
      ai: currentAgent.ai!,
      conversationFlow: currentAgent.conversationFlow || {
        id: 'default',
        name: 'Default Flow',
        nodes: [],
        connections: [],
        startNodeId: 'start'
      },
      channels: currentAgent.channels!,
      integrations: currentAgent.integrations!,
      analytics: currentAgent.analytics!,
      businessRules: currentAgent.businessRules!,
      createdAt: agent?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: agent?.createdBy || 'current-user'
    };
    
    onSave(completeAgent);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">
            {agent ? 'Edit Agent' : 'Create New Agent'}
          </h1>
          <p className="text-muted-foreground">
            Build and configure your voice AI agent
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {agent ? 'Update Agent' : 'Create Agent'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="h-full flex flex-col">
          <TabsList className="grid grid-cols-6 w-full mx-6 mt-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Voice & AI
            </TabsTrigger>
            <TabsTrigger value="flow" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Flow
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto p-6">
            <TabsContent value="basic" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Agent Name</Label>
                      <Input
                        id="name"
                        value={currentAgent.name || ''}
                        onChange={(e) => updateAgent({ name: e.target.value })}
                        placeholder="e.g., Customer Support Agent"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={currentAgent.status} 
                        onValueChange={(value: any) => updateAgent({ status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={currentAgent.description || ''}
                      onChange={(e) => updateAgent({ description: e.target.value })}
                      placeholder="Describe what this agent does..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="voice" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Voice Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Voice Provider</Label>
                      <Select 
                        value={currentAgent.voice?.provider} 
                        onValueChange={(value: any) => updateVoiceConfig({ provider: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                          <SelectItem value="vapi">VAPI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Voice</Label>
                      <Select 
                        value={currentAgent.voice?.voiceId} 
                        onValueChange={(value) => updateVoiceConfig({ voiceId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alloy">Alloy</SelectItem>
                          <SelectItem value="echo">Echo</SelectItem>
                          <SelectItem value="fable">Fable</SelectItem>
                          <SelectItem value="onyx">Onyx</SelectItem>
                          <SelectItem value="nova">Nova</SelectItem>
                          <SelectItem value="shimmer">Shimmer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Speed: {currentAgent.voice?.speed}</Label>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={currentAgent.voice?.speed || 1.0}
                        onChange={(e) => updateVoiceConfig({ speed: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>AI Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>AI Model</Label>
                      <Select 
                        value={currentAgent.ai?.model} 
                        onValueChange={(value) => updateAIConfig({ model: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-5-2025-08-07">GPT-5 (Latest)</SelectItem>
                          <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>System Prompt</Label>
                      <Textarea
                        value={currentAgent.ai?.systemPrompt || ''}
                        onChange={(e) => updateAIConfig({ systemPrompt: e.target.value })}
                        placeholder="Define the agent's role and behavior..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Personality</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tone</Label>
                      <Select 
                        value={currentAgent.ai?.personality?.tone} 
                        onValueChange={(value: any) => updatePersonality({ tone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="empathetic">Empathetic</SelectItem>
                          <SelectItem value="authoritative">Authoritative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Style</Label>
                      <Select 
                        value={currentAgent.ai?.personality?.style} 
                        onValueChange={(value: any) => updatePersonality({ style: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="concise">Concise</SelectItem>
                          <SelectItem value="detailed">Detailed</SelectItem>
                          <SelectItem value="conversational">Conversational</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Traits</Label>
                      <div className="flex flex-wrap gap-2">
                        {currentAgent.ai?.personality?.traits?.map((trait, index) => (
                          <Badge key={index} variant="secondary">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flow" className="mt-0 h-full">
              <FlowDesigner
                flow={currentAgent.conversationFlow}
                onChange={(flow) => updateAgent({ conversationFlow: flow })}
              />
            </TabsContent>

            <TabsContent value="channels" className="space-y-6 mt-0">
              <ChannelManager
                channels={currentAgent.channels || []}
                onChange={(channels) => updateAgent({ channels })}
              />
            </TabsContent>

            <TabsContent value="integrations" className="space-y-6 mt-0">
              <IntegrationHub
                integrations={currentAgent.integrations || []}
                onChange={(integrations) => updateAgent({ integrations })}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics & Monitoring</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Analytics</Label>
                      <p className="text-sm text-muted-foreground">
                        Track conversations and performance metrics
                      </p>
                    </div>
                    <Switch
                      checked={currentAgent.analytics?.enabled}
                      onCheckedChange={(enabled) => 
                        updateAgent({ analytics: { ...currentAgent.analytics!, enabled } })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Sentiment Analysis</Label>
                      <p className="text-sm text-muted-foreground">
                        Analyze customer sentiment during conversations
                      </p>
                    </div>
                    <Switch
                      checked={currentAgent.analytics?.trackSentiment}
                      onCheckedChange={(trackSentiment) => 
                        updateAgent({ analytics: { ...currentAgent.analytics!, trackSentiment } })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Performance Tracking</Label>
                      <p className="text-sm text-muted-foreground">
                        Monitor response times and success rates
                      </p>
                    </div>
                    <Switch
                      checked={currentAgent.analytics?.trackPerformance}
                      onCheckedChange={(trackPerformance) => 
                        updateAgent({ analytics: { ...currentAgent.analytics!, trackPerformance } })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};