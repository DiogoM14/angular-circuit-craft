import { Injectable } from '@angular/core';
import { ConnectorTemplate } from '../types';

@Injectable({
  providedIn: 'root'
})
export class ConnectorService {
  private connectors: ConnectorTemplate[] = [
    {
      id: 'http-request',
      name: 'HTTP Request',
      category: 'HTTP & APIs',
      icon: '🌐',
      description: 'Executes HTTP requests to external APIs',
      version: '1.0.0',
      inputs: [
        {
          id: 'trigger',
          name: 'Trigger',
          type: 'any',
          required: false,
          description: 'Triggers the request execution'
        }
      ],
      outputs: [
        {
          id: 'response',
          name: 'Response',
          type: 'object',
          required: true,
          description: 'HTTP request response'
        }
      ],
      configSchema: {
        url: { type: 'string', required: true, description: 'API URL' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'], default: 'GET' },
        headers: { type: 'object', description: 'Request headers' },
        body: { type: 'object', description: 'Request body (for POST/PUT)' },
        timeout: { type: 'number', default: 30000, description: 'Timeout in ms' }
      },
      documentation: 'Allows making HTTP requests to any REST API.',
      examples: [
        {
          name: 'Simple GET',
          config: { url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' }
        }
      ]
    },
  ];

  getConnectors(): ConnectorTemplate[] {
    return [...this.connectors];
  }

  getConnectorsByCategory(category: string): ConnectorTemplate[] {
    return this.connectors.filter(connector => connector.category === category);
  }

  getConnectorById(id: string): ConnectorTemplate | undefined {
    return this.connectors.find(connector => connector.id === id);
  }

  searchConnectors(query: string): ConnectorTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.connectors.filter(connector =>
      connector.name.toLowerCase().includes(lowerQuery) ||
      connector.description.toLowerCase().includes(lowerQuery) ||
      connector.category.toLowerCase().includes(lowerQuery)
    );
  }

  getCategories(): string[] {
    const categories = new Set(this.connectors.map(c => c.category));
    return Array.from(categories).sort();
  }

  registerCustomConnector(connector: ConnectorTemplate): void {
    const existingIndex = this.connectors.findIndex(c => c.id === connector.id);
    if (existingIndex >= 0) {
      this.connectors[existingIndex] = connector;
    } else {
      this.connectors.push(connector);
    }
  }

  validateConnectorConfig(connectorId: string, config: any): { valid: boolean; errors: string[] } {
    const connector = this.getConnectorById(connectorId);
    if (!connector) {
      return { valid: false, errors: ['Connector not found'] };
    }

    const errors: string[] = [];
    const schema = connector.configSchema;

    Object.keys(schema).forEach(key => {
      const fieldSchema = schema[key];
      const value = config[key];

      if (fieldSchema.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field '${key}' is required`);
      }

      if (fieldSchema.enum && value && !fieldSchema.enum.includes(value)) {
        errors.push(`Field '${key}' must be one of: ${fieldSchema.enum.join(', ')}`);
      }

      if (fieldSchema.type && value !== undefined) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== fieldSchema.type && fieldSchema.type !== 'any') {
          errors.push(`Field '${key}' must be of type ${fieldSchema.type}`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  }
}
