import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Bot, Settings, Play, Pause } from 'lucide-react';
import { VoiceAgent } from '@/types/agent';
import { AgentBuilder } from './agent-builder/AgentBuilder';

export const FlexibleVoiceAgentDashboard: React.FC = () => {
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<VoiceAgent | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);

  const handleSaveAgent = (agent: VoiceAgent) => {
    if (selectedAgent) {
      setAgents(prev => prev.map(a => a.id === agent.id ? agent : a));
    } else {
      setAgents(prev => [...prev, agent]);
    }
    setIsBuilding(false);
    setSelectedAgent(null);
  };

  const toggleAgentStatus = (agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: agent.status === 'active' ? 'inactive' : 'active' as const }
        : agent
    ));
  };

  if (isBuilding) {
    return (
      <AgentBuilder
        agent={selectedAgent || undefined}
        onSave={handleSaveAgent}
        onCancel={() => {
          setIsBuilding(false);
          setSelectedAgent(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Voice Agent Hub</h1>
          <p className="text-muted-foreground">Create and manage flexible AI voice agents</p>
        </div>
        <Button onClick={() => setIsBuilding(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No agents yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first flexible voice agent with custom flows, channels, and integrations
            </p>
            <Button onClick={() => setIsBuilding(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                  {agent.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{agent.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Channels:</span>
                    <span>{agent.channels.filter(c => c.enabled).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Integrations:</span>
                    <span>{agent.integrations.filter(i => i.enabled).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Voice:</span>
                    <span>{agent.voice.provider}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAgentStatus(agent.id)}
                    className="flex-1"
                  >
                    {agent.status === 'active' ? (
                      <><Pause className="w-4 h-4 mr-1" /> Pause</>
                    ) : (
                      <><Play className="w-4 h-4 mr-1" /> Activate</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAgent(agent);
                      setIsBuilding(true);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};