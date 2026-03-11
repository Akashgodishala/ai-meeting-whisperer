// Core types for flexible voice agent system
export interface VoiceAgent {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  
  // Voice Configuration
  voice: {
    provider: 'openai' | 'elevenlabs' | 'vapi';
    voiceId: string;
    speed?: number;
    pitch?: number;
  };
  
  // AI Configuration
  ai: {
    model: string;
    temperature?: number;
    systemPrompt: string;
    personality: AgentPersonality;
    maxTokens?: number;
  };
  
  // Conversation Flow
  conversationFlow: ConversationFlow;
  
  // Channel Configuration
  channels: ChannelConfig[];
  
  // Integration Settings
  integrations: IntegrationConfig[];
  
  // Analytics & Monitoring
  analytics: {
    enabled: boolean;
    trackSentiment?: boolean;
    trackPerformance?: boolean;
  };
  
  // Business Rules
  businessRules: BusinessRule[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  retailerId?: string;
}

export interface AgentPersonality {
  tone: 'professional' | 'friendly' | 'casual' | 'empathetic' | 'authoritative';
  style: 'concise' | 'detailed' | 'conversational' | 'formal';
  traits: string[]; // e.g., ['patient', 'helpful', 'knowledgeable']
  customInstructions?: string;
}

export interface ConversationFlow {
  id: string;
  name: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  startNodeId: string;
  fallbackNodeId?: string;
}

export interface FlowNode {
  id: string;
  type: 'message' | 'input' | 'condition' | 'action' | 'integration' | 'transfer';
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface FlowNodeData {
  // Message Node
  message?: string;
  voiceSettings?: {
    speed?: number;
    pause?: number;
    emphasis?: string[];
  };
  
  // Input Node
  inputType?: 'speech' | 'dtmf' | 'both';
  expectedFormat?: string;
  validation?: ValidationRule[];
  timeout?: number;
  retries?: number;
  
  // Condition Node
  conditions?: ConditionRule[];
  
  // Action Node
  action?: ActionConfig;
  
  // Integration Node
  integration?: {
    type: string;
    config: Record<string, any>;
  };
  
  // Transfer Node
  transferTo?: {
    type: 'human' | 'agent' | 'external';
    destination: string;
  };
}

export interface FlowConnection {
  id: string;
  source: string;
  target: string;
  condition?: string;
  label?: string;
}

export interface ChannelConfig {
  type: 'voice' | 'sms' | 'whatsapp' | 'webchat' | 'email';
  enabled: boolean;
  settings: Record<string, any>;
  phoneNumbers?: string[];
  webhookUrl?: string;
}

export interface IntegrationConfig {
  id: string;
  type: 'crm' | 'calendar' | 'payment' | 'database' | 'api' | 'webhook';
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  authType?: 'api_key' | 'oauth' | 'basic' | 'none';
  credentials?: Record<string, string>;
}

export interface BusinessRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
}

export interface ValidationRule {
  type: 'regex' | 'length' | 'range' | 'custom';
  rule: string | number;
  message: string;
}

export interface ConditionRule {
  variable: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'regex' | 'exists';
  value: any;
  nextNodeId: string;
}

export interface ActionConfig {
  type: 'set_variable' | 'api_call' | 'send_message' | 'schedule_callback' | 'create_record';
  config: Record<string, any>;
}