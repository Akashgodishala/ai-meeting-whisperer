-- Create tables for flexible voice agent system

-- Voice agents table
CREATE TABLE public.voice_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'draft')),
  
  -- Voice configuration
  voice_provider TEXT NOT NULL DEFAULT 'openai' CHECK (voice_provider IN ('openai', 'elevenlabs', 'vapi')),
  voice_id TEXT NOT NULL DEFAULT 'alloy',
  voice_speed DECIMAL DEFAULT 1.0,
  voice_pitch DECIMAL DEFAULT 1.0,
  
  -- AI configuration
  ai_model TEXT NOT NULL DEFAULT 'gpt-4.1-2025-04-14',
  ai_temperature DECIMAL DEFAULT 0.7,
  system_prompt TEXT NOT NULL DEFAULT 'You are a helpful voice assistant.',
  personality_tone TEXT DEFAULT 'professional' CHECK (personality_tone IN ('professional', 'friendly', 'casual', 'empathetic', 'authoritative')),
  personality_style TEXT DEFAULT 'conversational' CHECK (personality_style IN ('concise', 'detailed', 'conversational', 'formal')),
  personality_traits TEXT[] DEFAULT ARRAY['helpful', 'patient'],
  personality_custom_instructions TEXT,
  max_tokens INTEGER DEFAULT 1000,
  
  -- Analytics settings
  analytics_enabled BOOLEAN DEFAULT true,
  track_sentiment BOOLEAN DEFAULT true,
  track_performance BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  retailer_id UUID REFERENCES retailer_profiles(id)
);

-- Conversation flows table
CREATE TABLE public.conversation_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES voice_agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  start_node_id TEXT NOT NULL,
  fallback_node_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Flow nodes table
CREATE TABLE public.flow_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES conversation_flows(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL, -- Custom node ID for referencing
  node_type TEXT NOT NULL CHECK (node_type IN ('message', 'input', 'condition', 'action', 'integration', 'transfer')),
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  
  -- Node data (JSON)
  node_data JSONB NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(flow_id, node_id)
);

-- Flow connections table
CREATE TABLE public.flow_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES conversation_flows(id) ON DELETE CASCADE,
  connection_id TEXT NOT NULL,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  condition_rule TEXT,
  label TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(flow_id, connection_id)
);

-- Agent channels table
CREATE TABLE public.agent_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES voice_agents(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('voice', 'sms', 'whatsapp', 'webchat', 'email')),
  enabled BOOLEAN DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}',
  phone_numbers TEXT[],
  webhook_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agent integrations table
CREATE TABLE public.agent_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES voice_agents(id) ON DELETE CASCADE,
  integration_id TEXT NOT NULL,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('crm', 'calendar', 'payment', 'database', 'api', 'webhook')),
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  auth_type TEXT DEFAULT 'api_key' CHECK (auth_type IN ('api_key', 'oauth', 'basic', 'none')),
  config JSONB NOT NULL DEFAULT '{}',
  credentials JSONB NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(agent_id, integration_id)
);

-- Business rules table
CREATE TABLE public.agent_business_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES voice_agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  condition_rule TEXT NOT NULL,
  action_rule TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agent execution sessions table
CREATE TABLE public.agent_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES voice_agents(id),
  session_id TEXT NOT NULL,
  channel_type TEXT NOT NULL,
  customer_phone TEXT,
  customer_name TEXT,
  customer_email TEXT,
  
  -- Session state
  current_node_id TEXT,
  session_variables JSONB DEFAULT '{}',
  conversation_history JSONB DEFAULT '[]',
  
  -- Session metadata
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'transferred')),
  
  -- Analytics
  total_duration INTEGER DEFAULT 0, -- in seconds
  sentiment_score DECIMAL,
  satisfaction_rating INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(session_id)
);

-- Agent templates table for marketplace
CREATE TABLE public.agent_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  industry TEXT,
  
  -- Template configuration
  template_config JSONB NOT NULL,
  preview_image_url TEXT,
  
  -- Marketplace metadata
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.voice_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_agents
CREATE POLICY "Users can view their own agents" ON public.voice_agents
FOR SELECT USING (created_by = auth.uid() OR retailer_id IN (
  SELECT id FROM retailer_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create their own agents" ON public.voice_agents
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own agents" ON public.voice_agents
FOR UPDATE USING (created_by = auth.uid() OR retailer_id IN (
  SELECT id FROM retailer_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their own agents" ON public.voice_agents
FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "Service role can manage all agents" ON public.voice_agents
FOR ALL USING (auth.role() = 'service_role'::text);

-- RLS Policies for conversation_flows
CREATE POLICY "Users can manage flows for their agents" ON public.conversation_flows
FOR ALL USING (agent_id IN (
  SELECT id FROM voice_agents WHERE created_by = auth.uid()
));

CREATE POLICY "Service role can manage all flows" ON public.conversation_flows
FOR ALL USING (auth.role() = 'service_role'::text);

-- RLS Policies for flow_nodes
CREATE POLICY "Users can manage nodes for their flows" ON public.flow_nodes
FOR ALL USING (flow_id IN (
  SELECT cf.id FROM conversation_flows cf
  JOIN voice_agents va ON cf.agent_id = va.id
  WHERE va.created_by = auth.uid()
));

CREATE POLICY "Service role can manage all nodes" ON public.flow_nodes
FOR ALL USING (auth.role() = 'service_role'::text);

-- RLS Policies for flow_connections
CREATE POLICY "Users can manage connections for their flows" ON public.flow_connections
FOR ALL USING (flow_id IN (
  SELECT cf.id FROM conversation_flows cf
  JOIN voice_agents va ON cf.agent_id = va.id
  WHERE va.created_by = auth.uid()
));

CREATE POLICY "Service role can manage all connections" ON public.flow_connections
FOR ALL USING (auth.role() = 'service_role'::text);

-- RLS Policies for agent_channels
CREATE POLICY "Users can manage channels for their agents" ON public.agent_channels
FOR ALL USING (agent_id IN (
  SELECT id FROM voice_agents WHERE created_by = auth.uid()
));

CREATE POLICY "Service role can manage all channels" ON public.agent_channels
FOR ALL USING (auth.role() = 'service_role'::text);

-- RLS Policies for agent_integrations
CREATE POLICY "Users can manage integrations for their agents" ON public.agent_integrations
FOR ALL USING (agent_id IN (
  SELECT id FROM voice_agents WHERE created_by = auth.uid()
));

CREATE POLICY "Service role can manage all integrations" ON public.agent_integrations
FOR ALL USING (auth.role() = 'service_role'::text);

-- RLS Policies for agent_business_rules
CREATE POLICY "Users can manage rules for their agents" ON public.agent_business_rules
FOR ALL USING (agent_id IN (
  SELECT id FROM voice_agents WHERE created_by = auth.uid()
));

CREATE POLICY "Service role can manage all rules" ON public.agent_business_rules
FOR ALL USING (auth.role() = 'service_role'::text);

-- RLS Policies for agent_sessions
CREATE POLICY "Users can view sessions for their agents" ON public.agent_sessions
FOR SELECT USING (agent_id IN (
  SELECT id FROM voice_agents WHERE created_by = auth.uid()
));

CREATE POLICY "Service role can manage all sessions" ON public.agent_sessions
FOR ALL USING (auth.role() = 'service_role'::text);

-- RLS Policies for agent_templates
CREATE POLICY "Everyone can view public templates" ON public.agent_templates
FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own templates" ON public.agent_templates
FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create templates" ON public.agent_templates
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates" ON public.agent_templates
FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates" ON public.agent_templates
FOR DELETE USING (created_by = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_voice_agents_created_by ON voice_agents(created_by);
CREATE INDEX idx_voice_agents_retailer_id ON voice_agents(retailer_id);
CREATE INDEX idx_voice_agents_status ON voice_agents(status);
CREATE INDEX idx_conversation_flows_agent_id ON conversation_flows(agent_id);
CREATE INDEX idx_flow_nodes_flow_id ON flow_nodes(flow_id);
CREATE INDEX idx_flow_connections_flow_id ON flow_connections(flow_id);
CREATE INDEX idx_agent_channels_agent_id ON agent_channels(agent_id);
CREATE INDEX idx_agent_integrations_agent_id ON agent_integrations(agent_id);
CREATE INDEX idx_agent_sessions_agent_id ON agent_sessions(agent_id);
CREATE INDEX idx_agent_sessions_session_id ON agent_sessions(session_id);
CREATE INDEX idx_agent_templates_category ON agent_templates(category);
CREATE INDEX idx_agent_templates_is_public ON agent_templates(is_public);

-- Create update triggers
CREATE TRIGGER update_voice_agents_updated_at
BEFORE UPDATE ON public.voice_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversation_flows_updated_at
BEFORE UPDATE ON public.conversation_flows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flow_nodes_updated_at
BEFORE UPDATE ON public.flow_nodes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_channels_updated_at
BEFORE UPDATE ON public.agent_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_integrations_updated_at
BEFORE UPDATE ON public.agent_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_sessions_updated_at
BEFORE UPDATE ON public.agent_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_templates_updated_at
BEFORE UPDATE ON public.agent_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();