import { Injectable } from '@angular/core';
import { executeIfCondition } from '../helpers/condition-evaluator.helper';
import { executeTransform } from '../helpers/data-transformation.helper';

@Injectable({
  providedIn: 'root'
})
export class NodeExecutionService {

  constructor() {}

  async executeNode(node: any, previousResults: { [nodeId: string]: any }, connections: any[]): Promise<any> {
    switch (node.type) {
      case 'http-request':
        return await this.executeHttpRequest(node.data);

      case 'display-data':
        const inputData = this.getInputData(node, previousResults, connections);
        return this.executeDisplay(inputData, node.data);

      case 'filter':
        const filterInput = this.getInputData(node, previousResults, connections);
        return this.executeFilter(filterInput, node.data.condition);

      case 'transform':
        const transformInput = this.getInputData(node, previousResults, connections);
        return executeTransform(transformInput, node.data);

      case 'if-condition':
        const conditionInput = this.getInputData(node, previousResults, connections);
        return executeIfCondition(conditionInput, node.data);

      case 'delay':
        const delayInput = this.getInputData(node, previousResults, connections);
        return await this.executeDelay(delayInput, node.data);

      default:
        return { message: `Node type ${node.type} executed`, data: node.data };
    }
  }

  private async executeHttpRequest(config: any): Promise<any> {
    try {
      if (!config.url) {
        throw new Error('URL is required for HTTP Request');
      }

      // Validação de URL mais rigorosa
      let url: URL;
      try {
        url = new URL(config.url);
      } catch (e) {
        throw new Error(`Invalid URL format: ${config.url}`);
      }

      // Verificar protocolos permitidos
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error(`Unsupported protocol: ${url.protocol}. Only HTTP and HTTPS are allowed.`);
      }

      // Verificar se não é localhost em produção (exemplo de validação)
      if (url.hostname === 'localhost' && url.port && !['3000', '4200', '8080'].includes(url.port)) {
        throw new Error(`Localhost port ${url.port} not allowed. Use ports 3000, 4200, or 8080 for development.`);
      }

      console.log('Executing HTTP Request:', config);

      const options: any = {
        method: config.method || 'GET',
        headers: {}
      };

      if (config.headers) {
        try {
          const headersObj = typeof config.headers === 'string' ? JSON.parse(config.headers) : config.headers;
          options.headers = headersObj;
        } catch (e) {
          throw new Error('Invalid headers format. Must be valid JSON.');
        }
      }

      if ((config.method === 'POST' || config.method === 'PUT') && config.body) {
        try {
          options.body = typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
          options.headers['Content-Type'] = 'application/json';
        } catch (e) {
          throw new Error('Invalid request body format');
        }
      }

      const response = await fetch(config.url, options);
      
      // Verificar se a resposta é válida
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}: Request failed`);
      }

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) {
          throw new Error('Response is not valid JSON despite Content-Type header');
        }
      } else {
        data = await response.text();
      }

      return {
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: Object.fromEntries(response.headers.entries()),
        url: config.url,
        method: config.method || 'GET'
      };

    } catch (error) {
      // Capturar erros de rede também
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Network error: Could not connect to ${config.url}. Check if the server is running and the URL is correct.`);
      }
      
      throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private executeDisplay(data: any, config: any): any {
    try {
      if (!data && data !== 0 && data !== false) {
        throw new Error('No data provided to display');
      }

      const format = config.format || 'table';
      
      if (!['table', 'json', 'raw'].includes(format)) {
        throw new Error(`Invalid display format: ${format}. Must be 'table', 'json', or 'raw'`);
      }

      console.log('Displaying data with format:', format, 'Data:', data);
      
      return {
        format: format,
        data: data,
        displayedAt: new Date().toISOString(),
        message: `Data displayed in ${format} format`
      };
    } catch (error) {
      throw new Error(`Display error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private executeFilter(data: any, condition: string): any {
    try {
      if (!data) {
        throw new Error('No data provided to filter');
      }

      if (!Array.isArray(data)) {
        throw new Error('Filter requires array data input');
      }

      if (!condition || condition.trim() === '') {
        throw new Error('Filter condition is required');
      }

      console.log('Filtering data with condition:', condition);
      
      // Simular filtro simples
      const filteredData = data.filter((item, index) => {
        // Exemplo: filtrar por índice par/ímpar ou por propriedades básicas
        if (condition.includes('even')) {
          return index % 2 === 0;
        } else if (condition.includes('odd')) {
          return index % 2 !== 0;
        } else {
          // Filtro padrão - retorna todos os itens
          return true;
        }
      });

      return {
        originalCount: data.length,
        filteredCount: filteredData.length,
        data: filteredData,
        condition: condition,
        filteredAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Filter error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeDelay(data: any, config: any): Promise<any> {
    try {
      const delayMs = parseInt(config.delay) || 1000;
      
      if (delayMs < 0) {
        throw new Error('Delay cannot be negative');
      }
      
      if (delayMs > 300000) { // 5 minutos máximo
        throw new Error('Delay cannot exceed 5 minutes (300000ms)');
      }
      
      console.log(`Executing delay for ${delayMs}ms with data:`, data);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      return {
        data: data,
        delayExecuted: delayMs,
        executedAt: new Date().toISOString(),
        message: `Delayed execution by ${delayMs}ms`
      };
    } catch (error) {
      throw new Error(`Delay error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getInputData(node: any, previousResults: { [nodeId: string]: any }, connections: any[]): any {
    const inputConnections = connections.filter(conn => conn.targetNode === node.id);

    if (inputConnections.length === 0) {
      return null;
    }

    const inputData: any[] = [];
    inputConnections.forEach(conn => {
      if (previousResults[conn.sourceNode]) {
        inputData.push(previousResults[conn.sourceNode]);
      }
    });

    return inputData.length === 1 ? inputData[0] : inputData;
  }
} 