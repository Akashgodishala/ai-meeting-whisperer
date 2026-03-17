import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Calendar, 
  CreditCard, 
  Webhook, 
  Users,
  Link2,
  Plus,
  Settings,
  Trash2,
  Key,
  Globe
} from 'lucide-react';
import { IntegrationConfig } from '@/types/agent';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface IntegrationHubProps {
  integrations: IntegrationConfig[];
  onChange: (integrations: IntegrationConfig[]) => void;
}

const integrationTypes = [
  { 
    type: 'crm', 
    icon: Users, 
    label: 'CRM', 
    description: 'Customer Relationship Management',
    color: 'bg-blue-500',
    examples: ['Salesforce', 'HubSpot', 'Pipedrive']
  },
  { 
    type: 'calendar', 
    icon: Calendar, 
    label: 'Calendar', 
    description: 'Appointment scheduling',
    color: 'bg-green-500',
    examples: ['Google Calendar', 'Outlook', 'Calendly']
  },
  { 
    type: 'payment', 
    icon: CreditCard, 
    label: 'Payment', 
    description: 'Payment processing',
    color: 'bg-purple-500',
    examples: ['Stripe', 'PayPal', 'Square']
  },
  { 
    type: 'database', 
    icon: Database, 
    label: 'Database', 
    description: 'Data storage and retrieval',
    color: 'bg-orange-500',
    examples: ['MySQL', 'PostgreSQL', 'Airtable']
  },
  { 
    type: 'api', 
    icon: Globe, 
    label: 'REST API', 
    description: 'Custom API integration',
    color: 'bg-indigo-500',
    examples: ['Custom APIs', 'Third-party services']
  },
  { 
    type: 'webhook', 
    icon: Webhook, 
    label: 'Webhook', 
    description: 'Real-time notifications',
    color: 'bg-red-500',
    examples: ['Zapier', 'IFTTT', 'Custom webhooks']
  }
];

export const IntegrationHub: React.FC<IntegrationHubProps> = ({ integrations, onChange }) => {
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [isAddingIntegration, setIsAddingIntegration] = useState(false);
  const [newIntegrationType, setNewIntegrationType] = useState<string>('');

  const addIntegration = () => {
    if (!newIntegrationType) return;

    const newIntegration: IntegrationConfig = {
      id: `integration_${Date.now()}`,
      type: newIntegrationType as IntegrationConfig['type'],
      name: `New ${integrationTypes.find(it => it.type === newIntegrationType)?.label} Integration`,
      enabled: true,
      config: getDefaultIntegrationConfig(newIntegrationType as IntegrationConfig['type']),
      authType: 'api_key',
      credentials: {}
    };

    onChange([...integrations, newIntegration]);
    setSelectedIntegration(newIntegration);
    setIsAddingIntegration(false);
    setNewIntegrationType('');
  };

  const updateIntegration = (id: string, updates: Partial<IntegrationConfig>) => {
    const updatedIntegrations = integrations.map(integration =>
      integration.id === id ? { ...integration, ...updates } : integration
    );
    onChange(updatedIntegrations);
    
    if (selectedIntegration?.id === id) {
      setSelectedIntegration({ ...selectedIntegration, ...updates });
    }
  };

  const removeIntegration = (id: string) => {
    const updatedIntegrations = integrations.filter(integration => integration.id !== id);
    onChange(updatedIntegrations);
    setSelectedIntegration(null);
  };

  const renderIntegrationSettings = () => {
    if (!selectedIntegration) return null;

    const integrationType = integrationTypes.find(it => it.type === selectedIntegration.type);

    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {React.createElement(
              integrationType?.icon || Link2,
              { className: "w-5 h-5" }
            )}
            {selectedIntegration.name}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => removeIntegration(selectedIntegration.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Integration Name</Label>
            <Input
              value={selectedIntegration.name}
              onChange={(e) => updateIntegration(selectedIntegration.id, { name: e.target.value })}
              placeholder="Enter integration name"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Integration</Label>
              <p className="text-sm text-muted-foreground">
                Allow the agent to use this integration
              </p>
            </div>
            <Switch
              checked={selectedIntegration.enabled}
              onCheckedChange={(enabled) => updateIntegration(selectedIntegration.id, { enabled })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Authentication Type</Label>
            <Select
              value={selectedIntegration.authType}
              onValueChange={(authType: string) => updateIntegration(selectedIntegration.id, { authType: authType as IntegrationConfig['authType'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="oauth">OAuth</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="none">No Authentication</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedIntegration.authType === 'api_key' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Key
              </Label>
              <Input
                type="password"
                value={selectedIntegration.credentials?.apiKey || ''}
                onChange={(e) => updateIntegration(selectedIntegration.id, {
                  credentials: { ...selectedIntegration.credentials, apiKey: e.target.value }
                })}
                placeholder="Enter your API key"
              />
            </div>
          )}

          {selectedIntegration.authType === 'basic' && (
            <>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={selectedIntegration.credentials?.username || ''}
                  onChange={(e) => updateIntegration(selectedIntegration.id, {
                    credentials: { ...selectedIntegration.credentials, username: e.target.value }
                  })}
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={selectedIntegration.credentials?.password || ''}
                  onChange={(e) => updateIntegration(selectedIntegration.id, {
                    credentials: { ...selectedIntegration.credentials, password: e.target.value }
                  })}
                  placeholder="Enter password"
                />
              </div>
            </>
          )}

          <Separator />

          {/* Type-specific configuration */}
          {selectedIntegration.type === 'api' && (
            <>
              <div className="space-y-2">
                <Label>Base URL</Label>
                <Input
                  value={selectedIntegration.config.baseUrl || ''}
                  onChange={(e) => updateIntegration(selectedIntegration.id, {
                    config: { ...selectedIntegration.config, baseUrl: e.target.value }
                  })}
                  placeholder="https://api.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Default Headers (JSON)</Label>
                <Textarea
                  value={JSON.stringify(selectedIntegration.config.headers || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const headers = JSON.parse(e.target.value);
                      updateIntegration(selectedIntegration.id, {
                        config: { ...selectedIntegration.config, headers }
                      });
                    } catch { /* ignored */ }
                  }}
                  placeholder='{"Content-Type": "application/json"}'
                  rows={3}
                />
              </div>
            </>
          )}

          {selectedIntegration.type === 'webhook' && (
            <>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={selectedIntegration.config.webhookUrl || ''}
                  onChange={(e) => updateIntegration(selectedIntegration.id, {
                    config: { ...selectedIntegration.config, webhookUrl: e.target.value }
                  })}
                  placeholder="https://your-webhook-endpoint.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Events to Send</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['call_started', 'call_ended', 'message_sent', 'action_completed'].map(event => (
                    <div key={event} className="flex items-center gap-2">
                      <Switch
                        checked={selectedIntegration.config.events?.includes(event) || false}
                        onCheckedChange={(checked) => {
                          const events = selectedIntegration.config.events || [];
                          const newEvents = checked
                            ? [...events, event]
                            : events.filter(e => e !== event);
                          updateIntegration(selectedIntegration.id, {
                            config: { ...selectedIntegration.config, events: newEvents }
                          });
                        }}
                      />
                      <Label className="text-sm">{event.replace('_', ' ')}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {selectedIntegration.type === 'crm' && (
            <>
              <div className="space-y-2">
                <Label>CRM Platform</Label>
                <Select
                  value={selectedIntegration.config.platform || 'salesforce'}
                  onValueChange={(platform) => updateIntegration(selectedIntegration.id, {
                    config: { ...selectedIntegration.config, platform }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salesforce">Salesforce</SelectItem>
                    <SelectItem value="hubspot">HubSpot</SelectItem>
                    <SelectItem value="pipedrive">Pipedrive</SelectItem>
                    <SelectItem value="custom">Custom CRM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Instance URL</Label>
                <Input
                  value={selectedIntegration.config.instanceUrl || ''}
                  onChange={(e) => updateIntegration(selectedIntegration.id, {
                    config: { ...selectedIntegration.config, instanceUrl: e.target.value }
                  })}
                  placeholder="https://your-instance.salesforce.com"
                />
              </div>
            </>
          )}

          {selectedIntegration.type === 'payment' && (
            <>
              <div className="space-y-2">
                <Label>Payment Provider</Label>
                <Select
                  value={selectedIntegration.config.provider || 'stripe'}
                  onValueChange={(provider) => updateIntegration(selectedIntegration.id, {
                    config: { ...selectedIntegration.config, provider }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={selectedIntegration.config.currency || 'USD'}
                  onValueChange={(currency) => updateIntegration(selectedIntegration.id, {
                    config: { ...selectedIntegration.config, currency }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="pt-4">
            <Button className="w-full">
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full flex gap-6">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Integrations</h3>
          <Button onClick={() => setIsAddingIntegration(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Integration
          </Button>
        </div>

        {isAddingIntegration && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {integrationTypes.map((integrationType) => (
                    <Button
                      key={integrationType.type}
                      variant={newIntegrationType === integrationType.type ? "default" : "outline"}
                      className="h-20 flex flex-col items-center gap-2 text-left"
                      onClick={() => setNewIntegrationType(integrationType.type)}
                    >
                      <div className={`p-2 rounded-full text-white ${integrationType.color}`}>
                        <integrationType.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">{integrationType.label}</p>
                        <p className="text-xs text-muted-foreground">{integrationType.description}</p>
                      </div>
                    </Button>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddingIntegration(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addIntegration} disabled={!newIntegrationType}>
                    Add Integration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {integrations.map((integration) => {
            const integrationType = integrationTypes.find(it => it.type === integration.type);
            const isSelected = selectedIntegration?.id === integration.id;

            return (
              <Card 
                key={integration.id}
                className={`cursor-pointer transition-colors ${
                  isSelected ? 'border-primary bg-muted/30' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedIntegration(integration)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full text-white ${integrationType?.color}`}>
                        {integrationType && React.createElement(integrationType.icon, { className: "w-4 h-4" })}
                      </div>
                      <div>
                        <p className="font-medium">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {integrationType?.label} • {integration.enabled ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integration.enabled ? 'default' : 'secondary'}>
                        {integration.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Settings className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {integrations.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-muted-foreground">
                  <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No integrations configured</p>
                  <p className="text-sm">Connect external services to extend your agent's capabilities</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="w-80">
        {selectedIntegration ? (
          renderIntegrationSettings()
        ) : (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select an integration to configure its settings</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

function getDefaultIntegrationConfig(type: IntegrationConfig['type']): Record<string, unknown> {
  switch (type) {
    case 'crm':
      return {
        platform: 'salesforce',
        instanceUrl: '',
        createLeads: true,
        updateContacts: true
      };
    case 'calendar':
      return {
        provider: 'google',
        timeZone: 'UTC',
        bufferTime: 15
      };
    case 'payment':
      return {
        provider: 'stripe',
        currency: 'USD',
        collectBilling: true
      };
    case 'database':
      return {
        type: 'postgresql',
        connectionString: '',
        autoSync: true
      };
    case 'api':
      return {
        baseUrl: '',
        timeout: 30000,
        retries: 3,
        headers: {}
      };
    case 'webhook':
      return {
        webhookUrl: '',
        events: ['call_ended'],
        method: 'POST'
      };
    default:
      return {};
  }
}