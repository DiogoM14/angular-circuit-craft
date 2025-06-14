export interface SimpleConnectorTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;  
  inputs: number;
  outputs: number;
  configSchema: any;
}