import { NodeConnection } from "./node-connection.type";

export interface WorkflowNode {
    id: string;
    type: string;
    name: string;
    position: { x: number; y: number };
    data: any;
    inputs: NodeConnection[];
    outputs: NodeConnection[];
  }