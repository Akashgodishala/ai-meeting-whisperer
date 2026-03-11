import { supabase } from '@/integrations/supabase/client';
import { VoiceAgent, ConversationFlow, FlowNode, FlowConnection, ChannelConfig, IntegrationConfig, BusinessRule } from '@/types/agent';

export class AgentDataService {
  // Voice Agents
  static async getAgents(): Promise<VoiceAgent[]> {
    const { data, error } = await supabase
      .from('voice_agents')
      .select(`
        *,
        conversation_flows(*),
        agent_channels(*),
        agent_integrations(*),
        agent_business_rules(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(this.transformDatabaseToAgent) || [];
  }

  static async getAgent(id: string): Promise<VoiceAgent | null> {
    const { data, error } = await supabase
      .from('voice_agents')
      .select(`
        *,
        conversation_flows(*),
        agent_channels(*),
        agent_integrations(*),
        agent_business_rules(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? this.transformDatabaseToAgent(data) : null;
  }

  static async saveAgent(agent: VoiceAgent): Promise<VoiceAgent> {
    const isUpdate = await this.agentExists(agent.id);
    
    if (isUpdate) {
      return this.updateAgent(agent);
    } else {
      return this.createAgent(agent);
    }
  }

  private static async agentExists(id: string): Promise<boolean> {
    const { data } = await supabase
      .from('voice_agents')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    
    return !!data;
  }

  private static async createAgent(agent: VoiceAgent): Promise<VoiceAgent> {
    // Create the main agent record
    const { data: agentData, error: agentError } = await supabase
      .from('voice_agents')
      .insert(this.transformAgentToDatabase(agent))
      .select()
      .single();

    if (agentError) throw agentError;

    // Create conversation flow
    if (agent.conversationFlow) {
      await this.saveConversationFlow(agentData.id, agent.conversationFlow);
    }

    // Create channels
    for (const channel of agent.channels) {
      await this.saveChannel(agentData.id, channel);
    }

    // Create integrations
    for (const integration of agent.integrations) {
      await this.saveIntegration(agentData.id, integration);
    }

    // Create business rules
    for (const rule of agent.businessRules) {
      await this.saveBusinessRule(agentData.id, rule);
    }

    return this.getAgent(agentData.id) as Promise<VoiceAgent>;
  }

  private static async updateAgent(agent: VoiceAgent): Promise<VoiceAgent> {
    // Update the main agent record
    const { error: agentError } = await supabase
      .from('voice_agents')
      .update(this.transformAgentToDatabase(agent))
      .eq('id', agent.id);

    if (agentError) throw agentError;

    // Update conversation flow
    if (agent.conversationFlow) {
      await this.saveConversationFlow(agent.id, agent.conversationFlow);
    }

    // Update channels (delete and recreate for simplicity)
    await supabase.from('agent_channels').delete().eq('agent_id', agent.id);
    for (const channel of agent.channels) {
      await this.saveChannel(agent.id, channel);
    }

    // Update integrations
    await supabase.from('agent_integrations').delete().eq('agent_id', agent.id);
    for (const integration of agent.integrations) {
      await this.saveIntegration(agent.id, integration);
    }

    // Update business rules
    await supabase.from('agent_business_rules').delete().eq('agent_id', agent.id);
    for (const rule of agent.businessRules) {
      await this.saveBusinessRule(agent.id, rule);
    }

    return this.getAgent(agent.id) as Promise<VoiceAgent>;
  }

  static async deleteAgent(id: string): Promise<void> {
    const { error } = await supabase
      .from('voice_agents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Conversation Flows
  private static async saveConversationFlow(agentId: string, flow: ConversationFlow): Promise<void> {
    // Delete existing flow
    await supabase.from('conversation_flows').delete().eq('agent_id', agentId);

    // Create new flow
    const { data: flowData, error: flowError } = await supabase
      .from('conversation_flows')
      .insert({
        agent_id: agentId,
        name: flow.name,
        is_default: true,
        start_node_id: flow.startNodeId,
        fallback_node_id: flow.fallbackNodeId
      })
      .select()
      .single();

    if (flowError) throw flowError;

    // Save nodes
    for (const node of flow.nodes) {
        await supabase.from('flow_nodes').insert({
          flow_id: flowData.id,
          node_id: node.id,
          node_type: node.type,
          position_x: node.position.x,
          position_y: node.position.y,
          node_data: node.data as any
        });
    }

    // Save connections
    for (const connection of flow.connections) {
      await supabase.from('flow_connections').insert({
        flow_id: flowData.id,
        connection_id: connection.id,
        source_node_id: connection.source,
        target_node_id: connection.target,
        condition_rule: connection.condition,
        label: connection.label
      });
    }
  }

  // Channels
  private static async saveChannel(agentId: string, channel: ChannelConfig): Promise<void> {
    await supabase.from('agent_channels').insert({
      agent_id: agentId,
      channel_type: channel.type,
      enabled: channel.enabled,
      settings: channel.settings,
      phone_numbers: channel.phoneNumbers,
      webhook_url: channel.webhookUrl
    });
  }

  // Integrations
  private static async saveIntegration(agentId: string, integration: IntegrationConfig): Promise<void> {
    await supabase.from('agent_integrations').insert({
      agent_id: agentId,
      integration_id: integration.id,
      integration_type: integration.type,
      name: integration.name,
      enabled: integration.enabled,
      auth_type: integration.authType,
      config: integration.config,
      credentials: integration.credentials
    });
  }

  // Business Rules
  private static async saveBusinessRule(agentId: string, rule: BusinessRule): Promise<void> {
    await supabase.from('agent_business_rules').insert({
      agent_id: agentId,
      name: rule.name,
      condition_rule: rule.condition,
      action_rule: rule.action,
      priority: rule.priority,
      enabled: rule.enabled
    });
  }

  // Agent Sessions
  static async createSession(agentId: string, sessionData: {
    sessionId: string;
    channelType: string;
    customerPhone?: string;
    customerName?: string;
    customerEmail?: string;
  }) {
    const { data, error } = await supabase
      .from('agent_sessions')
      .insert({
        agent_id: agentId,
        session_id: sessionData.sessionId,
        channel_type: sessionData.channelType,
        customer_phone: sessionData.customerPhone,
        customer_name: sessionData.customerName,
        customer_email: sessionData.customerEmail,
        current_node_id: 'start',
        session_variables: {},
        conversation_history: []
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSession(sessionId: string, updates: {
    currentNodeId?: string;
    sessionVariables?: Record<string, any>;
    conversationHistory?: any[];
    status?: string;
    endedAt?: string;
    totalDuration?: number;
    sentimentScore?: number;
    satisfactionRating?: number;
  }) {
    const { data, error } = await supabase
      .from('agent_sessions')
      .update(updates)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getSession(sessionId: string) {
    const { data, error } = await supabase
      .from('agent_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // Templates
  static async getTemplates(category?: string) {
    let query = supabase
      .from('agent_templates')
      .select('*')
      .eq('is_public', true)
      .order('is_featured', { ascending: false })
      .order('usage_count', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async createTemplate(template: {
    name: string;
    description: string;
    category: string;
    industry?: string;
    templateConfig: any;
    previewImageUrl?: string;
    isPublic?: boolean;
  }) {
    const { data, error } = await supabase
      .from('agent_templates')
      .insert({
        ...template,
        template_config: template.templateConfig,
        preview_image_url: template.previewImageUrl,
        is_public: template.isPublic
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async incrementTemplateUsage(templateId: string) {
    // Get current usage count and increment
    const { data: template } = await supabase
      .from('agent_templates')
      .select('usage_count')
      .eq('id', templateId)
      .single();
    
    const { data, error } = await supabase
      .from('agent_templates')
      .update({ 
        usage_count: (template?.usage_count || 0) + 1
      })
      .eq('id', templateId);

    if (error) throw error;
  }

  // Transformation functions
  private static transformDatabaseToAgent(data: any): VoiceAgent {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      status: data.status,
      voice: {
        provider: data.voice_provider,
        voiceId: data.voice_id,
        speed: data.voice_speed,
        pitch: data.voice_pitch
      },
      ai: {
        model: data.ai_model,
        temperature: data.ai_temperature,
        systemPrompt: data.system_prompt,
        personality: {
          tone: data.personality_tone,
          style: data.personality_style,
          traits: data.personality_traits,
          customInstructions: data.personality_custom_instructions
        },
        maxTokens: data.max_tokens
      },
      conversationFlow: data.conversation_flows?.[0] ? {
        id: data.conversation_flows[0].id,
        name: data.conversation_flows[0].name,
        nodes: [], // Will be loaded separately if needed
        connections: [],
        startNodeId: data.conversation_flows[0].start_node_id,
        fallbackNodeId: data.conversation_flows[0].fallback_node_id
      } : {
        id: 'default',
        name: 'Default Flow',
        nodes: [],
        connections: [],
        startNodeId: 'start'
      },
      channels: data.agent_channels?.map((ch: any): ChannelConfig => ({
        type: ch.channel_type,
        enabled: ch.enabled,
        settings: ch.settings,
        phoneNumbers: ch.phone_numbers,
        webhookUrl: ch.webhook_url
      })) || [],
      integrations: data.agent_integrations?.map((int: any): IntegrationConfig => ({
        id: int.integration_id,
        type: int.integration_type,
        name: int.name,
        enabled: int.enabled,
        config: int.config,
        authType: int.auth_type,
        credentials: int.credentials
      })) || [],
      analytics: {
        enabled: data.analytics_enabled,
        trackSentiment: data.track_sentiment,
        trackPerformance: data.track_performance
      },
      businessRules: data.agent_business_rules?.map((rule: any): BusinessRule => ({
        id: rule.id,
        name: rule.name,
        condition: rule.condition_rule,
        action: rule.action_rule,
        priority: rule.priority,
        enabled: rule.enabled
      })) || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      retailerId: data.retailer_id
    };
  }

  private static transformAgentToDatabase(agent: VoiceAgent) {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      status: agent.status,
      voice_provider: agent.voice.provider,
      voice_id: agent.voice.voiceId,
      voice_speed: agent.voice.speed,
      voice_pitch: agent.voice.pitch,
      ai_model: agent.ai.model,
      ai_temperature: agent.ai.temperature,
      system_prompt: agent.ai.systemPrompt,
      personality_tone: agent.ai.personality.tone,
      personality_style: agent.ai.personality.style,
      personality_traits: agent.ai.personality.traits,
      personality_custom_instructions: agent.ai.personality.customInstructions,
      max_tokens: agent.ai.maxTokens,
      analytics_enabled: agent.analytics.enabled,
      track_sentiment: agent.analytics.trackSentiment,
      track_performance: agent.analytics.trackPerformance,
      created_by: agent.createdBy,
      retailer_id: agent.retailerId
    };
  }
}