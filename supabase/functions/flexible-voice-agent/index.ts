import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AgentSession {
  agentId: string;
  sessionId: string;
  currentNodeId: string;
  sessionVariables: Record<string, unknown>;
  conversationHistory: Record<string, unknown>[];
  agent: Record<string, unknown>;
  flow: Record<string, unknown>;
}

// In-memory session storage (in production, use Redis or similar)
const activeSessions = new Map<string, AgentSession>();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    logStep("WebSocket connection opened");
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      logStep("Received message", message);

      switch (message.type) {
        case 'start_session':
          await handleStartSession(socket, message);
          break;
        case 'user_input':
          await handleUserInput(socket, message);
          break;
        case 'end_session':
          await handleEndSession(socket, message);
          break;
        default:
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (error) {
      logStep("Error processing message", error);
      socket.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  };

  socket.onclose = () => {
    logStep("WebSocket connection closed");
  };

  return response;
});

async function handleStartSession(socket: WebSocket, message: Record<string, unknown>) {
  const { agentId, sessionId, customerData } = message;
  
  logStep("Starting session", { agentId, sessionId });

  try {
    // Get agent configuration from database
    const { data: agent, error: agentError } = await supabase
      .from('voice_agents')
      .select('*')
      .eq('id', agentId)
      .eq('status', 'active')
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found or inactive');
    }

    // Get conversation flow
    const { data: flow, error: flowError } = await supabase
      .from('conversation_flows')
      .select(`
        *,
        flow_nodes(*),
        flow_connections(*)
      `)
      .eq('agent_id', agentId)
      .eq('is_default', true)
      .single();

    if (flowError || !flow) {
      throw new Error('Conversation flow not found');
    }

    // Create session record in database
    await supabase.from('agent_sessions').insert({
      agent_id: agentId,
      session_id: sessionId,
      channel_type: 'websocket',
      customer_phone: customerData?.phone,
      customer_name: customerData?.name,
      customer_email: customerData?.email,
      current_node_id: flow.start_node_id,
      session_variables: {},
      conversation_history: []
    });

    // Store session in memory
    const session: AgentSession = {
      agentId,
      sessionId,
      currentNodeId: flow.start_node_id,
      sessionVariables: {},
      conversationHistory: [],
      agent,
      flow
    };

    activeSessions.set(sessionId, session);

    // Send session started confirmation
    socket.send(JSON.stringify({
      type: 'session_created',
      sessionId,
      agentName: agent.name
    }));

    // Execute the first node
    await executeNode(socket, session, flow.start_node_id);

  } catch (error) {
    logStep("Error starting session", error);
    socket.send(JSON.stringify({
      type: 'error',
      message: `Failed to start session: ${error.message}`
    }));
  }
}

async function handleUserInput(socket: WebSocket, message: Record<string, unknown>) {
  const { sessionId, input, inputType } = message;
  
  logStep("Processing user input", { sessionId, input, inputType });

  const session = activeSessions.get(sessionId);
  if (!session) {
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Session not found'
    }));
    return;
  }

  try {
    // Add user input to conversation history
    session.conversationHistory.push({
      type: 'user_input',
      content: input,
      inputType,
      timestamp: new Date().toISOString()
    });

    // Update session in database
    await supabase
      .from('agent_sessions')
      .update({
        conversation_history: session.conversationHistory,
        session_variables: session.sessionVariables
      })
      .eq('session_id', sessionId);

    // Process the input and determine next node
    const nextNodeId = await processUserInput(session, input, inputType);
    
    if (nextNodeId) {
      session.currentNodeId = nextNodeId;
      await executeNode(socket, session, nextNodeId);
    }

  } catch (error) {
    logStep("Error processing user input", error);
    socket.send(JSON.stringify({
      type: 'error',
      message: `Failed to process input: ${error.message}`
    }));
  }
}

async function handleEndSession(socket: WebSocket, message: Record<string, unknown>) {
  const { sessionId } = message;
  
  logStep("Ending session", { sessionId });

  const session = activeSessions.get(sessionId);
  if (session) {
    // Update session in database
    await supabase
      .from('agent_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        total_duration: Math.floor((Date.now() - new Date(session.conversationHistory[0]?.timestamp || Date.now()).getTime()) / 1000)
      })
      .eq('session_id', sessionId);

    // Remove from memory
    activeSessions.delete(sessionId);
  }

  socket.send(JSON.stringify({
    type: 'session_ended',
    sessionId
  }));
}

async function executeNode(socket: WebSocket, session: AgentSession, nodeId: string) {
  logStep("Executing node", { nodeId, sessionId: session.sessionId });

  const node = session.flow.flow_nodes.find((n: Record<string, unknown>) => n.node_id === nodeId);
  if (!node) {
    throw new Error(`Node ${nodeId} not found`);
  }

  const nodeData = node.node_data;

  switch (node.node_type) {
    case 'message':
      await executeMessageNode(socket, session, nodeData);
      break;
    case 'input':
      await executeInputNode(socket, session, nodeData);
      break;
    case 'condition':
      await executeConditionNode(socket, session, nodeData);
      break;
    case 'action':
      await executeActionNode(socket, session, nodeData);
      break;
    case 'integration':
      await executeIntegrationNode(socket, session, nodeData);
      break;
    case 'transfer':
      await executeTransferNode(socket, session, nodeData);
      break;
    default:
      throw new Error(`Unknown node type: ${node.node_type}`);
  }
}

async function executeMessageNode(socket: WebSocket, session: AgentSession, nodeData: Record<string, unknown>) {
  const message = interpolateMessage(nodeData.message, session.sessionVariables);
  
  // Add to conversation history
  session.conversationHistory.push({
    type: 'agent_message',
    content: message,
    timestamp: new Date().toISOString()
  });

  // Send message to client
  socket.send(JSON.stringify({
    type: 'agent_message',
    message,
    voiceSettings: nodeData.voiceSettings
  }));

  // Auto-advance to next node if there are connections
  const nextNode = getNextNode(session, session.currentNodeId);
  if (nextNode) {
    session.currentNodeId = nextNode;
    // Small delay before next node
    setTimeout(() => executeNode(socket, session, nextNode), 1000);
  }
}

async function executeInputNode(socket: WebSocket, session: AgentSession, nodeData: Record<string, unknown>) {
  // Send input request to client
  socket.send(JSON.stringify({
    type: 'input_required',
    inputType: nodeData.inputType || 'speech',
    expectedFormat: nodeData.expectedFormat,
    timeout: nodeData.timeout || 10,
    retries: nodeData.retries || 2
  }));

  // The response will be handled in handleUserInput
}

async function executeConditionNode(socket: WebSocket, session: AgentSession, nodeData: Record<string, unknown>) {
  const conditions = nodeData.conditions || [];
  
  for (const condition of conditions) {
    if (evaluateCondition(condition, session.sessionVariables)) {
      session.currentNodeId = condition.nextNodeId;
      await executeNode(socket, session, condition.nextNodeId);
      return;
    }
  }

  // No condition matched, go to fallback or next node
  const nextNode = getNextNode(session, session.currentNodeId) || session.flow.fallback_node_id;
  if (nextNode) {
    session.currentNodeId = nextNode;
    await executeNode(socket, session, nextNode);
  }
}

async function executeActionNode(socket: WebSocket, session: AgentSession, nodeData: Record<string, unknown>) {
  const action = nodeData.action;
  
  switch (action?.type) {
    case 'set_variable':
      session.sessionVariables[action.config.variable] = action.config.value;
      break;
    case 'api_call':
      // Make API call (implement based on config)
      break;
    case 'send_message':
      // Send external message (SMS, email, etc.)
      break;
    case 'schedule_callback':
      // Schedule a callback
      break;
    case 'create_record':
      // Create database record
      break;
  }

  // Continue to next node
  const nextNode = getNextNode(session, session.currentNodeId);
  if (nextNode) {
    session.currentNodeId = nextNode;
    await executeNode(socket, session, nextNode);
  }
}

async function executeIntegrationNode(socket: WebSocket, session: AgentSession, nodeData: Record<string, unknown>) {
  const integration = nodeData.integration;
  
  // Execute integration based on type
  // This would call external APIs, CRM systems, etc.
  logStep("Executing integration", integration);

  // Continue to next node
  const nextNode = getNextNode(session, session.currentNodeId);
  if (nextNode) {
    session.currentNodeId = nextNode;
    await executeNode(socket, session, nextNode);
  }
}

async function executeTransferNode(socket: WebSocket, session: AgentSession, nodeData: Record<string, unknown>) {
  const transferTo = nodeData.transferTo;
  
  // Send transfer request
  socket.send(JSON.stringify({
    type: 'transfer_requested',
    transferType: transferTo.type,
    destination: transferTo.destination
  }));

  // End the session
  await handleEndSession(socket, { sessionId: session.sessionId });
}

async function processUserInput(session: AgentSession, input: string, inputType: string): Promise<string | null> {
  // Find the current node
  const currentNode = session.flow.flow_nodes.find((n: Record<string, unknown>) => n.node_id === session.currentNodeId);
  
  if (!currentNode || currentNode.node_type !== 'input') {
    return null;
  }

  // Store the input in session variables
  session.sessionVariables.lastInput = input;
  session.sessionVariables.lastInputType = inputType;

  // Validate input if validation rules exist
  const nodeData = currentNode.node_data;
  if (nodeData.validation) {
    const isValid = validateInput(input, nodeData.validation);
    if (!isValid) {
      // Return to same node for retry
      return session.currentNodeId;
    }
  }

  // Find next node based on connections
  return getNextNode(session, session.currentNodeId);
}

function getNextNode(session: AgentSession, currentNodeId: string): string | null {
  const connections = session.flow.flow_connections.filter((c: Record<string, unknown>) => c.source_node_id === currentNodeId);
  
  if (connections.length === 0) {
    return null;
  }

  // If there's only one connection, use it
  if (connections.length === 1) {
    return connections[0].target_node_id;
  }

  // Multiple connections - check conditions
  for (const connection of connections) {
    if (!connection.condition_rule) {
      return connection.target_node_id; // Default connection
    }
    
    if (evaluateCondition({ rule: connection.condition_rule }, session.sessionVariables)) {
      return connection.target_node_id;
    }
  }

  return null;
}

function evaluateCondition(condition: Record<string, unknown>, variables: Record<string, unknown>): boolean {
  // Simple condition evaluation - can be expanded
  const { variable, operator, value } = condition;
  const varValue = variables[variable];

  switch (operator) {
    case 'equals':
      return varValue === value;
    case 'contains':
      return String(varValue).toLowerCase().includes(String(value).toLowerCase());
    case 'greater':
      return Number(varValue) > Number(value);
    case 'less':
      return Number(varValue) < Number(value);
    case 'exists':
      return varValue !== undefined && varValue !== null;
    default:
      return false;
  }
}

function validateInput(input: string, validationRules: Record<string, unknown>[]): boolean {
  for (const rule of validationRules) {
    switch (rule.type) {
      case 'regex':
        if (!new RegExp(rule.rule).test(input)) {
          return false;
        }
        break;
      case 'length':
        if (input.length < rule.rule) {
          return false;
        }
        break;
      case 'range': {
        const num = Number(input);
        if (isNaN(num) || num < rule.min || num > rule.max) {
          return false;
        }
        break;
      }
    }
  }
  return true;
}

function interpolateMessage(message: string, variables: Record<string, unknown>): string {
  return message.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] || match;
  });
}

function logStep(step: string, details?: unknown) {
  console.log(`[FlexibleAgent] ${step}`, details || '');
}