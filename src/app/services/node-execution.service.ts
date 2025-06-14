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
          console.warn('Invalid headers, using default');
        }
      }

      if ((config.method === 'POST' || config.method === 'PUT') && config.body) {
        try {
          options.body = typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
          options.headers['Content-Type'] = 'application/json';
        } catch (e) {
          console.warn('Invalid body');
        }
      }

      const response = await fetch(config.url, options);
      const data = await response.json();

      return {
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      };

    } catch (error) {
      throw new Error(`HTTP request error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private executeDisplay(data: any, config: any): any {
    console.log('Displaying data:', data, 'in format:', config.format);
    return {
      format: config.format || 'table',
      data: data,
      displayedAt: new Date().toISOString(),
      message: 'Data displayed successfully'
    };
  }

  private executeFilter(data: any, condition: string): any {  
    if (!Array.isArray(data)) {
      return data;
    }

    if (!condition) {
      return data;
    }

    console.log('Applying filter:', condition, 'to data:', data);
    return data;
  }

  private async executeDelay(data: any, config: any): Promise<any> {
    try {
      const delayMs = parseInt(config.delay) || 1000;
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