import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  MessageSquare, 
  Mic, 
  GitBranch, 
  Zap, 
  Link2, 
  Phone,
  Trash2,
  Edit,
  ArrowRight
} from 'lucide-react';
import { ConversationFlow, FlowNode, FlowConnection, FlowNodeData } from '@/types/agent';

interface FlowDesignerProps {
  flow?: ConversationFlow;
  onChange: (flow: ConversationFlow) => void;
}

const nodeTypes = [
  { type: 'message', icon: MessageSquare, label: 'Message', color: 'bg-blue-500' },
  { type: 'input', icon: Mic, label: 'Input', color: 'bg-green-500' },
  { type: 'condition', icon: GitBranch, label: 'Condition', color: 'bg-yellow-500' },
  { type: 'action', icon: Zap, label: 'Action', color: 'bg-purple-500' },
  { type: 'integration', icon: Link2, label: 'Integration', color: 'bg-orange-500' },
  { type: 'transfer', icon: Phone, label: 'Transfer', color: 'bg-red-500' }
];

export const FlowDesigner: React.FC<FlowDesignerProps> = ({ flow, onChange }) => {
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [isAddingNode, setIsAddingNode] = useState(false);

  const currentFlow = useMemo(() => flow || {
    id: 'default',
    name: 'Default Flow',
    nodes: [
      {
        id: 'start',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: {
          message: 'Hello! How can I help you today?'
        }
      }
    ],
    connections: [],
    startNodeId: 'start'
  }, [flow]);

  const updateFlow = useCallback((updates: Partial<ConversationFlow>) => {
    onChange({ ...currentFlow, ...updates });
  }, [currentFlow, onChange]);

  const addNode = useCallback((type: FlowNode['type']) => {
    const newNode: FlowNode = {
      id: `node_${Date.now()}`,
      type,
      position: { x: 200 + currentFlow.nodes.length * 50, y: 200 + currentFlow.nodes.length * 50 },
      data: getDefaultNodeData(type)
    };

    updateFlow({
      nodes: [...currentFlow.nodes, newNode]
    });
    setSelectedNode(newNode);
    setIsAddingNode(false);
  }, [currentFlow.nodes, updateFlow]);

  const updateNode = useCallback((nodeId: string, updates: Partial<FlowNode>) => {
    const updatedNodes = currentFlow.nodes.map(node =>
      node.id === nodeId ? { ...node, ...updates } : node
    );
    updateFlow({ nodes: updatedNodes });
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, ...updates });
    }
  }, [currentFlow.nodes, selectedNode, updateFlow]);

  const deleteNode = useCallback((nodeId: string) => {
    const updatedNodes = currentFlow.nodes.filter(node => node.id !== nodeId);
    const updatedConnections = currentFlow.connections.filter(
      conn => conn.source !== nodeId && conn.target !== nodeId
    );
    
    updateFlow({ 
      nodes: updatedNodes,
      connections: updatedConnections
    });
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [currentFlow.nodes, currentFlow.connections, selectedNode, updateFlow]);

  const addConnection = useCallback((sourceId: string, targetId: string) => {
    const newConnection: FlowConnection = {
      id: `conn_${Date.now()}`,
      source: sourceId,
      target: targetId
    };

    updateFlow({
      connections: [...currentFlow.connections, newConnection]
    });
  }, [currentFlow.connections, updateFlow]);

  const updateNodeData = useCallback((nodeId: string, data: Partial<FlowNodeData>) => {
    updateNode(nodeId, { data: { ...selectedNode?.data, ...data } });
  }, [selectedNode, updateNode]);

  const renderNodeEditor = () => {
    if (!selectedNode) return null;

    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {React.createElement(
              nodeTypes.find(nt => nt.type === selectedNode.type)?.icon || MessageSquare,
              { className: "w-5 h-5" }
            )}
            Edit {selectedNode.type} Node
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteNode(selectedNode.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedNode.type === 'message' && (
            <div className="space-y-2">
              <Label>Message Text</Label>
              <Textarea
                value={selectedNode.data.message || ''}
                onChange={(e) => updateNodeData(selectedNode.id, { message: e.target.value })}
                placeholder="Enter the message to speak..."
                rows={3}
              />
            </div>
          )}

          {selectedNode.type === 'input' && (
            <>
              <div className="space-y-2">
                <Label>Input Type</Label>
                <Select
                  value={selectedNode.data.inputType || 'speech'}
                  onValueChange={(value: any) => updateNodeData(selectedNode.id, { inputType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="speech">Speech</SelectItem>
                    <SelectItem value="dtmf">DTMF (Keypad)</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Format</Label>
                <Input
                  value={selectedNode.data.expectedFormat || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { expectedFormat: e.target.value })}
                  placeholder="e.g., phone number, name, yes/no"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Timeout (seconds)</Label>
                  <Input
                    type="number"
                    value={selectedNode.data.timeout || 10}
                    onChange={(e) => updateNodeData(selectedNode.id, { timeout: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Retries</Label>
                  <Input
                    type="number"
                    value={selectedNode.data.retries || 2}
                    onChange={(e) => updateNodeData(selectedNode.id, { retries: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </>
          )}

          {selectedNode.type === 'action' && (
            <>
              <div className="space-y-2">
                <Label>Action Type</Label>
              <Select
                  value={selectedNode.data.action?.type}
                  onValueChange={(value: any) => updateNodeData(selectedNode.id, { 
                    action: { type: value, config: {} }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="set_variable">Set Variable</SelectItem>
                    <SelectItem value="api_call">API Call</SelectItem>
                    <SelectItem value="send_message">Send Message</SelectItem>
                    <SelectItem value="schedule_callback">Schedule Callback</SelectItem>
                    <SelectItem value="create_record">Create Record</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {selectedNode.type === 'transfer' && (
            <>
              <div className="space-y-2">
                <Label>Transfer Type</Label>
                <Select
                  value={selectedNode.data.transferTo?.type}
                  onValueChange={(value: any) => updateNodeData(selectedNode.id, { 
                    transferTo: { type: value, destination: '' }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="human">Human Agent</SelectItem>
                    <SelectItem value="agent">Another AI Agent</SelectItem>
                    <SelectItem value="external">External Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destination</Label>
                <Input
                  value={selectedNode.data.transferTo?.destination || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { 
                    transferTo: { 
                      ...selectedNode.data.transferTo!, 
                      destination: e.target.value 
                    }
                  })}
                  placeholder="Phone number, agent ID, etc."
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
          <h3 className="text-lg font-semibold">Conversation Flow</h3>
          <Button onClick={() => setIsAddingNode(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Node
          </Button>
        </div>

        {isAddingNode && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Node</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {nodeTypes.map((nodeType) => (
                  <Button
                    key={nodeType.type}
                    variant="outline"
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => addNode(nodeType.type as any)}
                  >
                    <div className={`p-2 rounded-full text-white ${nodeType.color}`}>
                      <nodeType.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm">{nodeType.label}</span>
                  </Button>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setIsAddingNode(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="border rounded-lg p-4 bg-muted/20 min-h-[400px]">
          <div className="space-y-4">
            {currentFlow.nodes.map((node, index) => {
              const nodeType = nodeTypes.find(nt => nt.type === node.type);
              const isSelected = selectedNode?.id === node.id;

              return (
                <div key={node.id} className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {index + 1}
                    </Badge>
                    <div
                      className={`p-2 rounded-full text-white cursor-pointer ${nodeType?.color} ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedNode(node)}
                    >
                      {nodeType && React.createElement(nodeType.icon, { className: "w-4 h-4" })}
                    </div>
                  </div>

                  <div 
                    className={`flex-1 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                      isSelected ? 'border-primary bg-muted/30' : ''
                    }`}
                    onClick={() => setSelectedNode(node)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{node.type} Node</p>
                        <p className="text-sm text-muted-foreground">
                          {getNodeSummary(node)}
                        </p>
                      </div>
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  {index < currentFlow.nodes.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-80">
        {selectedNode ? (
          renderNodeEditor()
        ) : (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a node to edit its properties</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

function getDefaultNodeData(type: FlowNode['type']): FlowNodeData {
  switch (type) {
    case 'message':
      return { message: 'Hello! How can I help you?' };
    case 'input':
      return { 
        inputType: 'speech', 
        timeout: 10, 
        retries: 2,
        expectedFormat: 'any text'
      };
    case 'condition':
      return { conditions: [] };
    case 'action':
      return { action: { type: 'set_variable', config: {} } };
    case 'integration':
      return { integration: { type: 'api', config: {} } };
    case 'transfer':
      return { transferTo: { type: 'human', destination: '' } };
    default:
      return {};
  }
}

function getNodeSummary(node: FlowNode): string {
  switch (node.type) {
    case 'message':
      return node.data.message?.substring(0, 50) + (node.data.message && node.data.message.length > 50 ? '...' : '') || 'No message';
    case 'input':
      return `Collect ${node.data.inputType || 'speech'} input`;
    case 'condition':
      return `${node.data.conditions?.length || 0} conditions`;
    case 'action':
      return node.data.action?.type || 'No action';
    case 'integration':
      return node.data.integration?.type || 'No integration';
    case 'transfer':
      return `Transfer to ${node.data.transferTo?.type || 'unknown'}`;
    default:
      return 'Node';
  }
}