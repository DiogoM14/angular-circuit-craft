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
      description: 'Executa requisições HTTP para APIs externas',
      version: '1.0.0',
      inputs: [
        {
          id: 'trigger',
          name: 'Trigger',
          type: 'any',
          required: false,
          description: 'Dispara a execução da requisição'
        }
      ],
      outputs: [
        {
          id: 'response',
          name: 'Response',
          type: 'object',
          required: true,
          description: 'Resposta da requisição HTTP'
        }
      ],
      configSchema: {
        url: { type: 'string', required: true, description: 'URL da API' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'], default: 'GET' },
        headers: { type: 'object', description: 'Headers da requisição' },
        body: { type: 'object', description: 'Corpo da requisição (para POST/PUT)' },
        timeout: { type: 'number', default: 30000, description: 'Timeout em ms' }
      },
      documentation: 'Permite fazer requisições HTTP para qualquer API REST.',
      examples: [
        {
          name: 'GET simples',
          config: { url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' }
        }
      ]
    },
    {
      id: 'webhook-trigger',
      name: 'Webhook Trigger',
      category: 'Triggers',
      icon: '🔗',
      description: 'Inicia workflows através de webhooks',
      version: '1.0.0',
      inputs: [],
      outputs: [
        {
          id: 'payload',
          name: 'Payload',
          type: 'object',
          required: true,
          description: 'Dados recebidos via webhook'
        }
      ],
      configSchema: {
        path: { type: 'string', required: true, description: 'Caminho do webhook' },
        method: { type: 'string', enum: ['POST', 'GET', 'PUT'], default: 'POST' },
        authentication: { type: 'boolean', default: false, description: 'Requer autenticação' }
      }
    }
    // Mais conectores podem ser adicionados aqui
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

  // Método para registrar conectores customizados
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
      return { valid: false, errors: ['Connector não encontrado'] };
    }

    const errors: string[] = [];
    const schema = connector.configSchema;

    // Validação básica baseada no schema
    Object.keys(schema).forEach(key => {
      const fieldSchema = schema[key];
      const value = config[key];

      if (fieldSchema.required && (value === undefined || value === null || value === '')) {
        errors.push(`Campo '${key}' é obrigatório`);
      }

      if (fieldSchema.enum && value && !fieldSchema.enum.includes(value)) {
        errors.push(`Campo '${key}' deve ser um dos valores: ${fieldSchema.enum.join(', ')}`);
      }

      if (fieldSchema.type && value !== undefined) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== fieldSchema.type && fieldSchema.type !== 'any') {
          errors.push(`Campo '${key}' deve ser do tipo ${fieldSchema.type}`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  }
}
