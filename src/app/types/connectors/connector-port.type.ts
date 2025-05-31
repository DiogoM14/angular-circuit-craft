export interface ConnectorPort {
    id: string;
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
    required: boolean;
    description: string;
  }