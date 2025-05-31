import { NodeConnection } from "./node-connection.type";
import { WorkflowNode } from "./workflow-node.type";

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'paused' | 'error';
}