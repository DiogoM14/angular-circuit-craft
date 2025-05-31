import { ConnectorPort } from "./connector-port.type";

export interface ConnectorTemplate {
    id: string;
    name: string;
    category: string;
    icon: string;
    description: string;
    version: string;
    inputs: ConnectorPort[];
    outputs: ConnectorPort[];
    configSchema: any;
    documentation?: string;
    examples?: any[];
  }
  